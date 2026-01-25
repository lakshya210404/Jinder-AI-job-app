import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function enrichJobWithAI(job: any, apiKey: string) {
  const systemPrompt = `You are a job description analyzer. Extract structured information from job postings.
Return a JSON object with these exact fields:
- summary: A 2-3 sentence TL;DR of the role (what you'll do, team, impact)
- responsibilities: Array of 5-8 key responsibilities (action-oriented, concise)
- qualifications: Array of 5-8 required qualifications/skills
- tech_stack: Array of specific technologies, frameworks, languages mentioned
- benefits: Array of notable benefits/perks mentioned
- visa_info: String describing visa sponsorship status if mentioned, null otherwise

Be concise. Extract actual content, don't fabricate.`;

  const userPrompt = `Analyze this job posting:

Title: ${job.title}
Company: ${job.company}
Location: ${job.location}

Description:
${job.description?.slice(0, 8000)}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [{
        type: "function",
        function: {
          name: "extract_job_details",
          description: "Extract structured job details from the description",
          parameters: {
            type: "object",
            properties: {
              summary: { type: "string", description: "2-3 sentence TL;DR of the role" },
              responsibilities: {
                type: "array",
                items: { type: "string" },
                description: "5-8 key responsibilities"
              },
              qualifications: {
                type: "array",
                items: { type: "string" },
                description: "5-8 required qualifications"
              },
              tech_stack: {
                type: "array",
                items: { type: "string" },
                description: "Technologies and frameworks mentioned"
              },
              benefits: {
                type: "array",
                items: { type: "string" },
                description: "Notable benefits and perks"
              },
              visa_info: {
                type: ["string", "null"],
                description: "Visa sponsorship information if mentioned"
              }
            },
            required: ["summary", "responsibilities", "qualifications", "tech_stack", "benefits"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "extract_job_details" } }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI API error:", response.status, errorText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (!toolCall?.function?.arguments) {
    throw new Error("No tool call response from AI");
  }

  return JSON.parse(toolCall.function.arguments);
}

// Validate CRON_SECRET for automated calls
function validateCronSecret(req: Request): boolean {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) {
    console.warn("CRON_SECRET not configured");
    return false;
  }
  const authHeader = req.headers.get("Authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate CRON_SECRET for automated calls
  if (!validateCronSecret(req)) {
    console.warn("Unauthorized request - invalid CRON_SECRET");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    
    if (!lovableKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { job_id, limit = 10 } = await req.json();
    
    console.log(`Job enrichment called with job_id: ${job_id}, limit: ${limit}`);
    
    let jobsToEnrich;
    
    if (job_id) {
      // Single job enrichment
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", job_id)
        .single();
      
      if (error) throw error;
      jobsToEnrich = [data];
    } else {
      // Batch enrichment for jobs without AI summary
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .is("ai_summary", null)
        .not("description", "is", null)
        .limit(limit);
      
      if (error) throw error;
      jobsToEnrich = data || [];
    }
    
    console.log(`Enriching ${jobsToEnrich.length} jobs`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];
    
    for (const job of jobsToEnrich) {
      try {
        const enriched = await enrichJobWithAI(job, lovableKey);
        
        const { error: updateError } = await supabase
          .from("jobs")
          .update({
            ai_summary: enriched.summary,
            ai_responsibilities: enriched.responsibilities,
            ai_qualifications: enriched.qualifications,
            ai_tech_stack: enriched.tech_stack,
            ai_benefits: enriched.benefits,
            ai_visa_info: enriched.visa_info,
            ai_enriched_at: new Date().toISOString(),
          })
          .eq("id", job.id);
        
        if (updateError) {
          throw updateError;
        }
        
        successCount++;
        console.log(`Enriched job ${job.id}: ${job.title}`);
        
        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Failed to enrich job ${job.id}:`, err);
        errorCount++;
        errors.push({ job_id: job.id, error: errorMessage });
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      processed: jobsToEnrich.length,
      successCount,
      errorCount,
      errors: errors.slice(0, 5),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Job enrichment error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
