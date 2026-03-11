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
  description_raw: string; // Original HTML/markdown
  description_text: string; // Sanitized plain text
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
  jobs_unchanged: number;
  jobs_seen: number;
  jobs_deduplicated: number;
  jobs_stale: number;
  jobs_expired: number;
  error_count: number;
  sample_new_job_ids: string[];
  sample_updated_job_ids: string[];
  sample_expired_job_ids: string[];
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
// HTML SANITIZATION
// =============================================
function sanitizeHtml(html: string): string {
  // Remove script tags and their content
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  // Remove style tags and their content
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  // Remove all HTML tags but preserve content
  clean = clean.replace(/<[^>]*>/g, " ");
  // Normalize whitespace
  clean = clean.replace(/\s+/g, " ").trim();
  // Decode common HTML entities
  clean = clean.replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  return clean;
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
    const descriptionRaw = job.content || "";
    const descriptionText = sanitizeHtml(descriptionRaw);
    const { work_type, is_remote } = classifyWorkType(location, job.title, descriptionText);
    
    jobs.push({
      title: job.title || "Untitled",
      company: companyName,
      location,
      description: descriptionText.slice(0, 5000),
      description_raw: descriptionRaw.slice(0, 50000),
      description_text: descriptionText.slice(0, 10000),
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
      tech_stack: extractTechStack(descriptionText),
      role_type: classifyRoleType(job.title, descriptionText),
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
    const descriptionRaw = job.description || "";
    const descriptionPlain = job.descriptionPlain || sanitizeHtml(descriptionRaw);
    const { work_type, is_remote } = classifyWorkType(location, job.text, descriptionPlain);
    
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
      description: descriptionPlain.slice(0, 5000),
      description_raw: descriptionRaw.slice(0, 50000),
      description_text: descriptionPlain.slice(0, 10000),
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
      tech_stack: extractTechStack(descriptionPlain),
      role_type: classifyRoleType(job.text, descriptionPlain),
    });
  }
  
  log("info", "Lever jobs fetched", { count: jobs.length, company: companyName });
  return jobs;
}

// =============================================
// EXTRACT DOMAIN FOR LOGO
// =============================================
function extractDomain(company: string, applyUrl: string): string | null {
  const knownDomains: Record<string, string> = {
    "stripe": "stripe.com", "coinbase": "coinbase.com", "airbnb": "airbnb.com",
    "anthropic": "anthropic.com", "vercel": "vercel.com", "figma": "figma.com",
    "notion": "notion.so", "openai": "openai.com", "google": "google.com",
    "meta": "meta.com", "apple": "apple.com", "amazon": "amazon.com",
    "microsoft": "microsoft.com", "netflix": "netflix.com", "spotify": "spotify.com",
    "uber": "uber.com", "lyft": "lyft.com", "doordash": "doordash.com",
    "instacart": "instacart.com", "slack": "slack.com", "discord": "discord.com",
    "github": "github.com", "gitlab": "gitlab.com", "dropbox": "dropbox.com",
    "salesforce": "salesforce.com", "adobe": "adobe.com", "nvidia": "nvidia.com",
    "pinterest": "pinterest.com", "reddit": "reddit.com", "snap": "snap.com",
    "shopify": "shopify.com", "robinhood": "robinhood.com", "plaid": "plaid.com",
    "brex": "brex.com", "ramp": "ramp.com", "datadog": "datadoghq.com",
    "snowflake": "snowflake.com", "databricks": "databricks.com", "mongodb": "mongodb.com",
    "cloudflare": "cloudflare.com", "twilio": "twilio.com", "airtable": "airtable.com",
    "supabase": "supabase.com", "linear": "linear.app", "retool": "retool.com",
  };
  const companyLower = company.toLowerCase().trim();
  if (knownDomains[companyLower]) return knownDomains[companyLower];
  for (const [key, domain] of Object.entries(knownDomains)) {
    if (companyLower.includes(key)) return domain;
  }
  return company.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
}

// =============================================
// INGESTION ORCHESTRATOR WITH RECONCILIATION
// =============================================
async function ingestSource(
  supabaseUrl: string,
  supabaseKey: string,
  source: JobSource,
  runStartedAt: Date
): Promise<IngestionResult> {
  const supabase = createClient(supabaseUrl, supabaseKey, { 
    auth: { persistSession: false },
    db: { schema: "public" }
  });
  
  const startTime = Date.now();
  const result: IngestionResult = {
    jobs_fetched: 0,
    jobs_new: 0,
    jobs_updated: 0,
    jobs_unchanged: 0,
    jobs_seen: 0,
    jobs_deduplicated: 0,
    jobs_stale: 0,
    jobs_expired: 0,
    error_count: 0,
    sample_new_job_ids: [],
    sample_updated_job_ids: [],
    sample_expired_job_ids: [],
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
    const seenJobIds: string[] = [];
    
    for (const job of normalizedJobs) {
      const jobHash = generateJobHash(job.title, job.company, job.location, job.apply_url);
      
      // Check for existing job by external_job_id first (most reliable)
      const { data: existingById } = await supabase
        .from("jobs")
        .select("id, job_hash, description")
        .eq("source_id", source.id)
        .eq("external_job_id", job.external_job_id)
        .maybeSingle();
      
      if (existingById) {
        seenJobIds.push(existingById.id);
        
        // Check if content changed
        const contentChanged = existingById.description !== job.description;
        
        const updateData: Record<string, unknown> = {
          last_seen_at: new Date().toISOString(),
          verification_status: "verified_active",
          updated_at: new Date().toISOString(),
        };
        
        if (contentChanged) {
          Object.assign(updateData, {
            job_hash: jobHash,
            title: job.title,
            description: job.description,
            description_raw: job.description_raw,
            description_text: job.description_text,
            requirements: job.requirements,
            work_type: job.work_type,
            is_remote: job.is_remote,
            apply_url: job.apply_url,
            posted_date: job.posted_date,
            tech_stack: job.tech_stack,
            role_type: job.role_type,
            // Reset AI classification when content changes
            ai_classification_done: false,
          });
        }
        
        await supabase.from("jobs").update(updateData).eq("id", existingById.id);
        
        if (contentChanged) {
          result.jobs_updated++;
          if (result.sample_updated_job_ids.length < 10) {
            result.sample_updated_job_ids.push(existingById.id);
          }
        } else {
          result.jobs_unchanged++;
        }
        result.jobs_seen++;
        continue;
      }
      
      // Check by hash for cross-source deduplication
      const { data: existingByHash } = await supabase
        .from("jobs")
        .select("id, source_id")
        .eq("job_hash", jobHash)
        .maybeSingle();
      
      if (existingByHash) {
        if (existingByHash.source_id === source.id) {
          // Same source, update last_seen_at
          await supabase.from("jobs").update({
            last_seen_at: new Date().toISOString(),
            verification_status: "verified_active",
            external_job_id: job.external_job_id,
          }).eq("id", existingByHash.id);
          seenJobIds.push(existingByHash.id);
          result.jobs_seen++;
        } else {
          result.jobs_deduplicated++;
        }
        continue;
      }
      
      // Insert new job
      const companyDomain = extractDomain(job.company, job.apply_url);
      const companyLogoUrl = companyDomain ? `https://logo.clearbit.com/${companyDomain}` : null;
      
      const { data: insertedJob } = await supabase.from("jobs").insert({
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        description_raw: job.description_raw,
        description_text: job.description_text,
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
        company_logo_url: companyLogoUrl,
        company_domain: companyDomain,
        logo_source: "clearbit",
        logo_last_verified_at: new Date().toISOString(),
        tech_stack: job.tech_stack,
        role_type: job.role_type,
        source_id: source.id,
        source: source.source_type,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        verification_status: "verified_active",
        ai_classification_done: false,
      }).select("id").maybeSingle();
      
      result.jobs_new++;
      result.jobs_seen++;
      if (insertedJob && result.sample_new_job_ids.length < 10) {
        result.sample_new_job_ids.push(insertedJob.id);
        seenJobIds.push(insertedJob.id);
      }
    }
    
    // RECONCILIATION: Mark jobs not seen in this run
    // Jobs from this source that weren't seen become stale after 24h or expired after 72h
    const { data: unseenJobs } = await supabase
      .from("jobs")
      .select("id, last_seen_at, verification_status")
      .eq("source_id", source.id)
      .lt("last_seen_at", runStartedAt.toISOString())
      .in("verification_status", ["pending", "verified_active", "stale"]);
    
    for (const job of unseenJobs || []) {
      const lastSeen = new Date(job.last_seen_at);
      const hoursSinceLastSeen = (Date.now() - lastSeen.getTime()) / (1000 * 60 * 60);
      
      let newStatus = job.verification_status;
      if (hoursSinceLastSeen > 72) {
        newStatus = "expired";
        result.jobs_expired++;
        if (result.sample_expired_job_ids.length < 10) {
          result.sample_expired_job_ids.push(job.id);
        }
      } else if (hoursSinceLastSeen > 24) {
        newStatus = "stale";
        result.jobs_stale++;
      }
      
      if (newStatus !== job.verification_status) {
        await supabase.from("jobs").update({
          verification_status: newStatus,
        }).eq("id", job.id);
      }
    }
    
    const durationMs = Date.now() - startTime;
    
    // Update source stats
    await supabase.from("job_sources").update({
      last_poll_at: new Date().toISOString(),
      last_success_at: new Date().toISOString(),
      next_poll_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      consecutive_failures: 0,
      status: "active",
      active_job_count: result.jobs_fetched,
    }).eq("id", source.id);
    
    // Log to ingestion_logs
    await supabase.from("ingestion_logs").insert({
      source_id: source.id,
      started_at: runStartedAt.toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: durationMs,
      jobs_fetched: result.jobs_fetched,
      jobs_new: result.jobs_new,
      jobs_updated: result.jobs_updated,
      jobs_deduplicated: result.jobs_deduplicated,
      jobs_expired: result.jobs_expired,
      jobs_seen: result.jobs_seen,
      jobs_stale: result.jobs_stale,
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
    result.error_count++;
    
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    
    await supabase.from("job_sources").update({
      last_poll_at: new Date().toISOString(),
      last_failure_at: new Date().toISOString(),
      last_error_message: errorMessage,
      status: "failing",
    }).eq("id", source.id);
    
    await supabase.from("ingestion_logs").insert({
      source_id: source.id,
      started_at: runStartedAt.toISOString(),
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
// AUTH VALIDATION
// =============================================
async function validateAuth(req: Request, supabaseUrl: string, supabaseKey: string): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  
  const token = authHeader.replace("Bearer ", "");
  
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && token === cronSecret) {
    log("info", "Authenticated via CRON_SECRET");
    return true;
  }
  
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRoleKey && token === serviceRoleKey) {
    log("info", "Authenticated via service role key");
    return true;
  }
  
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (anonKey && token === anonKey) {
    log("info", "Authenticated via anon key (pg_cron)");
    return true;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      log("info", "Authenticated via user JWT", { userId: user.id });
      return true;
    }
  } catch (e) {
    log("warn", "JWT validation failed", { error: String(e) });
  }
  
  return false;
}

// =============================================
// MAIN HANDLER
// =============================================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  
  if (!await validateAuth(req, supabaseUrl, supabaseKey)) {
    log("warn", "Unauthorized request");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey, { 
    auth: { persistSession: false } 
  });
  
  try {
    const runStartedAt = new Date();
    log("info", "Job ingestion pipeline started", { run_started_at: runStartedAt.toISOString() });
    
    const body = await req.json().catch(() => ({}));
    const { source_id, source_type, limit = 10, run_type = "scheduled" } = body;
    
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
      const result = await ingestSource(supabaseUrl, supabaseKey, source as JobSource, runStartedAt);
      results.push({
        source_id: source.id,
        company: source.company_name,
        result,
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Aggregate stats
    const totalNew = results.reduce((sum, r) => sum + r.result.jobs_new, 0);
    const totalUpdated = results.reduce((sum, r) => sum + r.result.jobs_updated, 0);
    const totalSeen = results.reduce((sum, r) => sum + r.result.jobs_seen, 0);
    const totalStale = results.reduce((sum, r) => sum + r.result.jobs_stale, 0);
    const totalExpired = results.reduce((sum, r) => sum + r.result.jobs_expired, 0);
    const totalErrors = results.filter(r => r.result.error).length;
    
    // Create run record
    await supabase.from("ingestion_runs").insert({
      source_id: source_id || null,
      run_type: source_id ? "manual" : run_type,
      started_at: runStartedAt.toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - runStartedAt.getTime(),
      status: totalErrors === sources.length ? "failed" : "success",
      jobs_fetched: results.reduce((sum, r) => sum + r.result.jobs_fetched, 0),
      jobs_new: totalNew,
      jobs_updated: totalUpdated,
      jobs_seen: totalSeen,
      jobs_stale: totalStale,
      jobs_expired: totalExpired,
      jobs_deduplicated: results.reduce((sum, r) => sum + r.result.jobs_deduplicated, 0),
      error_count: totalErrors,
      sample_new_job_ids: results.flatMap(r => r.result.sample_new_job_ids).slice(0, 20),
      sample_updated_job_ids: results.flatMap(r => r.result.sample_updated_job_ids).slice(0, 20),
      sample_expired_job_ids: results.flatMap(r => r.result.sample_expired_job_ids).slice(0, 20),
    });
    
    log("info", "Job ingestion pipeline complete", { 
      sources_processed: sources.length,
      total_new: totalNew,
      total_updated: totalUpdated,
      total_seen: totalSeen,
      total_stale: totalStale,
      total_expired: totalExpired,
      errors: totalErrors
    });
    
    return new Response(JSON.stringify({
      success: true,
      sources_processed: sources.length,
      total_new: totalNew,
      total_updated: totalUpdated,
      total_seen: totalSeen,
      total_stale: totalStale,
      total_expired: totalExpired,
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
