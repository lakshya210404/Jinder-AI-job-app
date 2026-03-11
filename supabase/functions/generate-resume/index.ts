import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validation constants
const MAX_NAME_LENGTH = 200;
const MAX_EMAIL_LENGTH = 254;
const MAX_TITLE_LENGTH = 200;
const MAX_SKILLS_COUNT = 50;
const MAX_SKILL_LENGTH = 100;
const MAX_ADDITIONAL_INFO_LENGTH = 5000;
const MAX_JOB_TITLE_LENGTH = 200;
const MAX_JOB_COMPANY_LENGTH = 200;
const MAX_JOB_DESCRIPTION_LENGTH = 10000;
const MAX_JOB_REQUIREMENTS_COUNT = 20;

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sanitize text by removing potentially harmful characters
const sanitizeText = (text: string | undefined | null): string => {
  if (!text) return "";
  return text
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/\0/g, "") // Remove null bytes
    .trim();
};

// Safe error messages for clients
const getSafeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("required") || message.includes("invalid") || message.includes("too long") || message.includes("too many")) {
      return error.message; // These are validation errors safe to show
    }
  }
  return "An error occurred while generating your resume. Please try again.";
};

// Validate profile data
const validateProfile = (profile: unknown): { name: string; email: string; title: string; skills: string[] } => {
  if (!profile || typeof profile !== "object") {
    throw new Error("Profile is required");
  }

  const p = profile as Record<string, unknown>;

  // Validate name
  if (!p.name || typeof p.name !== "string") {
    throw new Error("Profile name is required");
  }
  const name = sanitizeText(p.name);
  if (name.length > MAX_NAME_LENGTH) {
    throw new Error(`Name must be less than ${MAX_NAME_LENGTH} characters`);
  }

  // Validate email
  if (!p.email || typeof p.email !== "string") {
    throw new Error("Profile email is required");
  }
  const email = sanitizeText(p.email);
  if (email.length > MAX_EMAIL_LENGTH) {
    throw new Error(`Email must be less than ${MAX_EMAIL_LENGTH} characters`);
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new Error("Invalid email format");
  }

  // Validate title
  const title = sanitizeText(p.title as string | undefined);
  if (title.length > MAX_TITLE_LENGTH) {
    throw new Error(`Title must be less than ${MAX_TITLE_LENGTH} characters`);
  }

  // Validate skills
  let skills: string[] = [];
  if (Array.isArray(p.skills)) {
    if (p.skills.length > MAX_SKILLS_COUNT) {
      throw new Error(`Maximum ${MAX_SKILLS_COUNT} skills allowed`);
    }
    skills = p.skills
      .filter((s): s is string => typeof s === "string")
      .map((s) => sanitizeText(s).slice(0, MAX_SKILL_LENGTH))
      .filter((s) => s.length > 0);
  }

  return { name, email, title, skills };
};

// Validate additional info
const validateAdditionalInfo = (additionalInfo: unknown): string => {
  if (!additionalInfo) return "";
  if (typeof additionalInfo !== "string") {
    throw new Error("Additional info must be text");
  }
  const sanitized = sanitizeText(additionalInfo);
  if (sanitized.length > MAX_ADDITIONAL_INFO_LENGTH) {
    throw new Error(`Additional info must be less than ${MAX_ADDITIONAL_INFO_LENGTH} characters`);
  }
  return sanitized;
};

// Validate target job
const validateTargetJob = (targetJob: unknown): { title: string; company: string; description: string; requirements: string[] } | null => {
  if (!targetJob) return null;
  if (typeof targetJob !== "object") {
    throw new Error("Invalid target job format");
  }

  const job = targetJob as Record<string, unknown>;

  const title = sanitizeText(job.title as string | undefined);
  if (title.length > MAX_JOB_TITLE_LENGTH) {
    throw new Error(`Job title must be less than ${MAX_JOB_TITLE_LENGTH} characters`);
  }

  const company = sanitizeText(job.company as string | undefined);
  if (company.length > MAX_JOB_COMPANY_LENGTH) {
    throw new Error(`Company name must be less than ${MAX_JOB_COMPANY_LENGTH} characters`);
  }

  const description = sanitizeText(job.description as string | undefined);
  if (description.length > MAX_JOB_DESCRIPTION_LENGTH) {
    throw new Error(`Job description must be less than ${MAX_JOB_DESCRIPTION_LENGTH} characters`);
  }

  let requirements: string[] = [];
  if (Array.isArray(job.requirements)) {
    if (job.requirements.length > MAX_JOB_REQUIREMENTS_COUNT) {
      throw new Error(`Maximum ${MAX_JOB_REQUIREMENTS_COUNT} job requirements allowed`);
    }
    requirements = job.requirements
      .filter((r): r is string => typeof r === "string")
      .map((r) => sanitizeText(r).slice(0, MAX_SKILL_LENGTH))
      .filter((r) => r.length > 0);
  }

  return { title, company, description, requirements };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("JWT verification failed");
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);

    // Parse and validate input
    const body = await req.json();
    const profile = validateProfile(body.profile);
    const additionalInfo = validateAdditionalInfo(body.additionalInfo);
    const targetJob = validateTargetJob(body.targetJob);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
${targetJob.requirements.length > 0 ? `- Key Requirements: ${targetJob.requirements.join(", ")}` : ""}

Incorporate relevant keywords from this job posting and emphasize matching skills.`;
    }

    const userPrompt = `Create a resume for:
Name: ${profile.name}
Email: ${profile.email}
Title: ${profile.title}
Skills: ${profile.skills.length > 0 ? profile.skills.join(", ") : "Not specified"}

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
      console.error("AI gateway responded with status:", response.status);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate resume. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const resume = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ resume }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-resume function:", error instanceof Error ? error.message : "Unknown error");
    
    const safeMessage = getSafeErrorMessage(error);
    const isValidationError = error instanceof Error && 
      (error.message.includes("required") || error.message.includes("invalid") || 
       error.message.includes("too long") || error.message.includes("too many") ||
       error.message.includes("must be"));
    
    return new Response(
      JSON.stringify({ error: safeMessage }),
      { status: isValidationError ? 400 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});