import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Logging helper
const log = (level: string, message: string, details?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({ timestamp, level, message, ...details }));
};

// =============================================
// COMMON INTERFACES
// =============================================
interface NormalizedJob {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  work_type: string;
  is_remote: boolean;
  apply_url: string;
  external_job_id: string;
  posted_date: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  logo_url: string | null;
  tech_stack: string[];
  role_type: string;
}

interface IngestionResult {
  jobs_fetched: number;
  jobs_new: number;
  jobs_updated: number;
  jobs_deduplicated: number;
  error?: string;
}

interface JobSource {
  id: string;
  source_type: string;
  company_name: string;
  api_endpoint: string | null;
  logo_url: string | null;
}

// =============================================
// RULE-BASED CLASSIFICATION
// =============================================
function classifyRoleType(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  if (/\b(intern|internship|co-op|coop)\b/.test(text)) return "internship";
  if (/\b(new\s*grad|entry[\s-]?level|junior|associate|graduate\s*program|university\s*grad)\b/.test(text)) return "new_grad";
  if (/\b(part[\s-]?time)\b/.test(text)) return "part_time";
  if (/\b(contract|contractor|freelance|temporary)\b/.test(text)) return "contract";
  if (/\b(full[\s-]?time)\b/.test(text)) return "full_time";
  
  return "unknown";
}

function extractTechStack(description: string): string[] {
  const techPatterns = [
    "javascript", "typescript", "python", "java", "go", "golang", "rust", "c\\+\\+", "c#",
    "ruby", "php", "swift", "kotlin", "scala", "sql", "nosql",
    "react", "vue", "angular", "svelte", "next\\.?js", "nuxt", "node\\.?js", "express",
    "django", "flask", "fastapi", "spring", "rails", "laravel",
    "aws", "gcp", "azure", "docker", "kubernetes", "k8s", "terraform", "jenkins",
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "dynamodb", "supabase",
    "graphql", "rest", "grpc", "kafka", "rabbitmq",
    "machine\\s*learning", "deep\\s*learning", "nlp", "computer\\s*vision",
    "tensorflow", "pytorch", "scikit", "pandas", "numpy",
    "figma", "sketch", "adobe", "css", "tailwind", "sass", "html"
  ];
  
  const found: string[] = [];
  const text = description.toLowerCase();
  
  for (const pattern of techPatterns) {
    const regex = new RegExp(`\\b${pattern}\\b`, "i");
    if (regex.test(text)) {
      const match = text.match(regex)?.[0] || pattern;
      const normalized = match.replace(/\s+/g, "");
      if (!found.includes(normalized)) {
        found.push(normalized);
      }
    }
  }
  
  return found.slice(0, 15);
}

function classifyWorkType(location: string, title: string, description: string): { work_type: string; is_remote: boolean } {
  const text = `${location} ${title} ${description}`.toLowerCase();
  
  const isRemote = /\b(remote|work\s*from\s*home|wfh|distributed|anywhere)\b/.test(text);
  const isHybrid = /\b(hybrid|flexible\s*location|partial\s*remote)\b/.test(text);
  const isOnsite = /\b(on[\s-]?site|in[\s-]?office|office[\s-]?based)\b/.test(text);
  
  if (isRemote && !isHybrid) return { work_type: "remote", is_remote: true };
  if (isHybrid) return { work_type: "hybrid", is_remote: false };
  if (isOnsite) return { work_type: "onsite", is_remote: false };
  
  return { work_type: "hybrid", is_remote: false };
}

// Generate job hash for deduplication
function generateJobHash(title: string, company: string, location: string, applyUrl: string): string {
  const input = [title, company, location, applyUrl]
    .map(s => (s || "").toLowerCase().trim())
    .join("|");
  
  // Simple hash function for edge runtime
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, "0");
}

// =============================================
// GREENHOUSE CONNECTOR
// =============================================
async function fetchGreenhouseJobs(apiEndpoint: string, companyName: string, logoUrl: string | null): Promise<NormalizedJob[]> {
  log("info", "Fetching Greenhouse jobs", { endpoint: apiEndpoint, company: companyName });
  
  const response = await fetch(apiEndpoint, {
    headers: { "Accept": "application/json" }
  });
  
  if (!response.ok) {
    throw new Error(`Greenhouse API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  const jobs: NormalizedJob[] = [];
  
  for (const job of data.jobs || []) {
    const location = job.location?.name || "Unknown";
    const description = job.content || "";
    const { work_type, is_remote } = classifyWorkType(location, job.title, description);
    
    jobs.push({
      title: job.title || "Untitled",
      company: companyName,
      location,
      description: description.replace(/<[^>]*>/g, " ").trim(),
      requirements: [],
      work_type,
      is_remote,
      apply_url: job.absolute_url || "",
      external_job_id: String(job.id),
      posted_date: job.updated_at || job.first_published_at || null,
      salary_min: null,
      salary_max: null,
      salary_currency: null,
      logo_url: logoUrl,
      tech_stack: extractTechStack(description),
      role_type: classifyRoleType(job.title, description),
    });
  }
  
  log("info", "Greenhouse jobs fetched", { count: jobs.length, company: companyName });
  return jobs;
}

// =============================================
// LEVER CONNECTOR
// =============================================
async function fetchLeverJobs(apiEndpoint: string, companyName: string, logoUrl: string | null): Promise<NormalizedJob[]> {
  log("info", "Fetching Lever jobs", { endpoint: apiEndpoint, company: companyName });
  
  const response = await fetch(apiEndpoint, {
    headers: { "Accept": "application/json" }
  });
  
  if (!response.ok) {
    throw new Error(`Lever API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  const jobs: NormalizedJob[] = [];
  
  for (const job of data || []) {
    const location = job.categories?.location || "Unknown";
    const description = job.descriptionPlain || job.description || "";
    const { work_type, is_remote } = classifyWorkType(location, job.text, description);
    
    const additionalLists = job.lists || [];
    const requirements: string[] = [];
    for (const list of additionalLists) {
      if (list.text?.toLowerCase().includes("requirement") || list.text?.toLowerCase().includes("qualification")) {
        requirements.push(...(list.content?.replace(/<[^>]*>/g, "\n").split("\n").filter((s: string) => s.trim()) || []));
      }
    }
    
    jobs.push({
      title: job.text || "Untitled",
      company: companyName,
      location,
      description: description.replace(/<[^>]*>/g, " ").trim(),
      requirements: requirements.slice(0, 10),
      work_type,
      is_remote,
      apply_url: job.hostedUrl || job.applyUrl || "",
      external_job_id: job.id || "",
      posted_date: job.createdAt ? new Date(job.createdAt).toISOString() : null,
      salary_min: null,
      salary_max: null,
      salary_currency: null,
      logo_url: logoUrl,
      tech_stack: extractTechStack(description),
      role_type: classifyRoleType(job.text, description),
    });
  }
  
  log("info", "Lever jobs fetched", { count: jobs.length, company: companyName });
  return jobs;
}

// =============================================
// INGESTION ORCHESTRATOR
// =============================================
async function ingestSource(
  supabaseUrl: string,
  supabaseKey: string,
  source: JobSource
): Promise<IngestionResult> {
  // Create fresh client for each source to avoid type issues
  const supabase = createClient(supabaseUrl, supabaseKey, { 
    auth: { persistSession: false },
    db: { schema: "public" }
  });
  
  const startTime = Date.now();
  const result: IngestionResult = {
    jobs_fetched: 0,
    jobs_new: 0,
    jobs_updated: 0,
    jobs_deduplicated: 0,
  };
  
  try {
    if (!source.api_endpoint) {
      throw new Error("No API endpoint configured");
    }
    
    let normalizedJobs: NormalizedJob[] = [];
    
    switch (source.source_type) {
      case "greenhouse":
        normalizedJobs = await fetchGreenhouseJobs(source.api_endpoint, source.company_name, source.logo_url);
        break;
      case "lever":
        normalizedJobs = await fetchLeverJobs(source.api_endpoint, source.company_name, source.logo_url);
        break;
      default:
        throw new Error(`Unsupported source type: ${source.source_type}`);
    }
    
    result.jobs_fetched = normalizedJobs.length;
    
    for (const job of normalizedJobs) {
      const jobHash = generateJobHash(job.title, job.company, job.location, job.apply_url);
      
      // Check for existing job by hash using raw query approach
      const { data: existingJobs } = await supabase
        .from("jobs")
        .select("id, external_job_id, source_id")
        .eq("job_hash", jobHash)
        .limit(1);
      
      const existingByHash = existingJobs?.[0];
      
      if (existingByHash) {
        if (existingByHash.source_id === source.id) {
          await supabase
            .from("jobs")
            .update({
              title: job.title,
              description: job.description,
              requirements: job.requirements,
              work_type: job.work_type,
              is_remote: job.is_remote,
              apply_url: job.apply_url,
              posted_date: job.posted_date,
              salary_min: job.salary_min,
              salary_max: job.salary_max,
              salary_currency: job.salary_currency,
              tech_stack: job.tech_stack,
              role_type: job.role_type,
              verification_status: "pending",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingByHash.id);
          
          result.jobs_updated++;
        } else {
          result.jobs_deduplicated++;
        }
        continue;
      }
      
      // Check by external ID
      const { data: existingByIdJobs } = await supabase
        .from("jobs")
        .select("id")
        .eq("source_id", source.id)
        .eq("external_job_id", job.external_job_id)
        .limit(1);
      
      const existingById = existingByIdJobs?.[0];
      
      if (existingById) {
        await supabase
          .from("jobs")
          .update({
            job_hash: jobHash,
            title: job.title,
            description: job.description,
            requirements: job.requirements,
            work_type: job.work_type,
            is_remote: job.is_remote,
            apply_url: job.apply_url,
            posted_date: job.posted_date,
            tech_stack: job.tech_stack,
            role_type: job.role_type,
            verification_status: "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingById.id);
        
        result.jobs_updated++;
        continue;
      }
      
      // Insert new job
      await supabase.from("jobs").insert({
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        requirements: job.requirements,
        work_type: job.work_type,
        is_remote: job.is_remote,
        apply_url: job.apply_url,
        external_job_id: job.external_job_id,
        job_hash: jobHash,
        posted_date: job.posted_date,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_currency: job.salary_currency,
        logo_url: job.logo_url,
        tech_stack: job.tech_stack,
        role_type: job.role_type,
        source_id: source.id,
        source: source.source_type,
        first_seen_at: new Date().toISOString(),
        verification_status: "pending",
        ai_classification_done: false,
      });
      
      result.jobs_new++;
    }
    
    const durationMs = Date.now() - startTime;
    
    await supabase
      .from("job_sources")
      .update({
        last_poll_at: new Date().toISOString(),
        last_success_at: new Date().toISOString(),
        next_poll_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        consecutive_failures: 0,
        status: "active",
        active_job_count: result.jobs_fetched,
      })
      .eq("id", source.id);
    
    await supabase.from("ingestion_logs").insert({
      source_id: source.id,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: durationMs,
      jobs_fetched: result.jobs_fetched,
      jobs_new: result.jobs_new,
      jobs_updated: result.jobs_updated,
      jobs_deduplicated: result.jobs_deduplicated,
      success: true,
    });
    
    log("info", "Source ingestion complete", { 
      source_id: source.id, 
      company: source.company_name,
      ...result 
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.error = errorMessage;
    
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    
    await supabase
      .from("job_sources")
      .update({
        last_poll_at: new Date().toISOString(),
        last_failure_at: new Date().toISOString(),
        last_error_message: errorMessage,
        status: "failing",
      })
      .eq("id", source.id);
    
    await supabase.from("ingestion_logs").insert({
      source_id: source.id,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      jobs_fetched: 0,
      success: false,
      error_message: errorMessage,
    });
    
    log("error", "Source ingestion failed", { 
      source_id: source.id, 
      company: source.company_name,
      error: errorMessage 
    });
  }
  
  return result;
}

// =============================================
// CRON SECRET VALIDATION
// =============================================
function validateCronSecret(req: Request): boolean {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) {
    log("warn", "CRON_SECRET not configured");
    return false;
  }
  const authHeader = req.headers.get("Authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

// =============================================
// MAIN HANDLER
// =============================================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Validate CRON_SECRET for automated calls
  if (!validateCronSecret(req)) {
    log("warn", "Unauthorized request - invalid CRON_SECRET");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  
  const supabase = createClient(supabaseUrl, supabaseKey, { 
    auth: { persistSession: false } 
  });
  
  try {
    log("info", "Job ingestion pipeline started");
    
    const body = await req.json().catch(() => ({}));
    const { source_id, source_type, limit = 10 } = body;
    
    let query = supabase
      .from("job_sources")
      .select("id, source_type, company_name, api_endpoint, logo_url")
      .eq("status", "active")
      .order("is_priority_source", { ascending: false })
      .order("last_poll_at", { ascending: true, nullsFirst: true })
      .limit(limit);
    
    if (source_id) {
      query = supabase
        .from("job_sources")
        .select("id, source_type, company_name, api_endpoint, logo_url")
        .eq("id", source_id);
    } else if (source_type) {
      query = query.eq("source_type", source_type);
    }
    
    const { data: sources, error: sourcesError } = await query;
    
    if (sourcesError) {
      throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
    }
    
    if (!sources || sources.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No sources to poll",
        results: [] 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    log("info", "Processing sources", { count: sources.length });
    
    const results: Array<{ source_id: string; company: string; result: IngestionResult }> = [];
    
    for (const source of sources) {
      const result = await ingestSource(supabaseUrl, supabaseKey, source as JobSource);
      results.push({
        source_id: source.id,
        company: source.company_name,
        result,
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const totalNew = results.reduce((sum, r) => sum + r.result.jobs_new, 0);
    const totalUpdated = results.reduce((sum, r) => sum + r.result.jobs_updated, 0);
    const totalErrors = results.filter(r => r.result.error).length;
    
    log("info", "Job ingestion pipeline complete", { 
      sources_processed: sources.length,
      total_new: totalNew,
      total_updated: totalUpdated,
      errors: totalErrors
    });
    
    return new Response(JSON.stringify({
      success: true,
      sources_processed: sources.length,
      total_new: totalNew,
      total_updated: totalUpdated,
      errors: totalErrors,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log("error", "Pipeline error", { error: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
