import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile, additionalInfo, targetJob } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = `You are an expert resume writer. Create a professional, well-formatted resume based on the user's profile information. The resume should be:
- Clear and concise
- ATS-friendly with proper keywords
- Professionally structured with sections: Contact, Summary, Skills, Experience (if provided), Education (if provided)
- Action-oriented with strong verbs
- Quantified achievements where possible`;

    if (targetJob) {
      systemPrompt += `\n\nIMPORTANT: This resume should be tailored specifically for the following job:
- Job Title: ${targetJob.title}
- Company: ${targetJob.company}
- Description: ${targetJob.description}
${targetJob.requirements ? `- Key Requirements: ${targetJob.requirements.join(", ")}` : ""}

Incorporate relevant keywords from this job posting and emphasize matching skills.`;
    }

    const userPrompt = `Create a resume for:
Name: ${profile.name}
Email: ${profile.email}
Title: ${profile.title}
Skills: ${profile.skills?.join(", ") || "Not specified"}

${additionalInfo ? `Additional Information:\n${additionalInfo}` : ""}

Generate a complete, professional resume in plain text format that can be easily copied and used.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate resume");
    }

    const data = await response.json();
    const resume = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ resume }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating resume:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});