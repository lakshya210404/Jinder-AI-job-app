import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (level: string, message: string, details?: Record<string, unknown>) => {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...details }));
};

// =============================================
// AI CLASSIFICATION WITH LOVABLE AI
// =============================================
async function classifyJobWithAI(
  job: { id: string; title: string; description: string; company: string; location: string },
  lovableApiKey: string
): Promise<{
  role_type: string;
  tech_stack: string[];
  experience_level_parsed: string;
  education_requirements: string | null;
  visa_sponsorship: boolean | null;
  hiring_urgency_score: number;
  student_relevance_score: number;
  competition_score: number;
}> {
  const systemPrompt = `You are a job classification AI. Analyze job postings and extract structured information.
Be precise and conservative. Only mark visa_sponsorship as true if explicitly mentioned.
Score hiring_urgency based on language like "immediately", "ASAP", "urgent" (higher = more urgent).
Score student_relevance based on entry-level signals, internship mentions, new grad programs (higher = more relevant).
Score competition based on company prestige, role desirability, typical applicant volume (higher = more competitive).`;

  const userPrompt = `Analyze this job posting:

Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description: ${job.description.slice(0, 3000)}

Extract the following using the suggest_classification function.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "suggest_classification",
            description: "Classify the job posting with structured data",
            parameters: {
              type: "object",
              properties: {
                role_type: {
                  type: "string",
                  enum: ["internship", "new_grad", "part_time", "full_time", "contract", "unknown"],
                  description: "The type of role",
                },
                tech_stack: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of technologies/tools mentioned (max 10)",
                },
                experience_level: {
                  type: "string",
                  enum: ["entry", "mid", "senior", "lead", "executive", "unknown"],
                  description: "Required experience level",
                },
                education_requirements: {
                  type: "string",
                  description: "Education requirements if mentioned (e.g., 'BS in Computer Science')",
                },
                visa_sponsorship: {
                  type: "boolean",
                  description: "Whether visa sponsorship is offered (true only if explicitly mentioned)",
                },
                hiring_urgency_score: {
                  type: "integer",
                  minimum: 0,
                  maximum: 100,
                  description: "How urgently is the company hiring (0-100)",
                },
                student_relevance_score: {
                  type: "integer",
                  minimum: 0,
                  maximum: 100,
                  description: "How relevant for students/new grads (0-100)",
                },
                competition_score: {
                  type: "integer",
                  minimum: 0,
                  maximum: 100,
                  description: "Expected competition level (0-100)",
                },
              },
              required: ["role_type", "tech_stack", "experience_level", "hiring_urgency_score", "student_relevance_score", "competition_score"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "suggest_classification" } },
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("AI rate limit exceeded");
    }
    if (response.status === 402) {
      throw new Error("AI credits exhausted");
    }
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  
  if (!toolCall?.function?.arguments) {
    throw new Error("No classification returned from AI");
  }

  const classification = JSON.parse(toolCall.function.arguments);
  
  return {
    role_type: classification.role_type || "unknown",
    tech_stack: (classification.tech_stack || []).slice(0, 10),
    experience_level_parsed: classification.experience_level || "unknown",
    education_requirements: classification.education_requirements || null,
    visa_sponsorship: classification.visa_sponsorship ?? null,
    hiring_urgency_score: Math.min(100, Math.max(0, classification.hiring_urgency_score || 50)),
    student_relevance_score: Math.min(100, Math.max(0, classification.student_relevance_score || 50)),
    competition_score: Math.min(100, Math.max(0, classification.competition_score || 50)),
  };
}

// =============================================
// MAIN HANDLER
// =============================================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableApiKey) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  try {
    log("info", "AI classification pipeline started");

    const body = await req.json().catch(() => ({}));
    const { job_id, limit = 10 } = body;

    // Get jobs pending AI classification
    let query = supabase
      .from("jobs")
      .select("id, title, description, company, location")
      .eq("ai_classification_done", false)
      .order("first_seen_at", { ascending: false })
      .limit(limit);

    if (job_id) {
      query = supabase
        .from("jobs")
        .select("id, title, description, company, location")
        .eq("id", job_id);
    }

    const { data: jobs, error: jobsError } = await query;

    if (jobsError) {
      throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
    }

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No jobs pending classification",
        classified: 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    log("info", "Classifying jobs", { count: jobs.length });

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const job of jobs) {
      try {
        const classification = await classifyJobWithAI(job, lovableApiKey);

        await supabase
          .from("jobs")
          .update({
            ...classification,
            ai_classification_done: true,
            ai_classification_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        successCount++;
        log("info", "Job classified", { job_id: job.id, title: job.title, role_type: classification.role_type });

        // Rate limit protection - wait between AI calls
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        errorCount++;
        const msg = error instanceof Error ? error.message : String(error);
        errors.push(`${job.id}: ${msg}`);
        log("error", "Classification failed", { job_id: job.id, error: msg });

        // If rate limited, stop processing
        if (msg.includes("rate limit") || msg.includes("credits")) {
          break;
        }
      }
    }

    log("info", "AI classification complete", { success: successCount, errors: errorCount });

    return new Response(JSON.stringify({
      success: true,
      classified: successCount,
      errors: errorCount,
      error_details: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log("error", "Pipeline error", { error: errorMessage });

    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
