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
// KNOWN ATS PATTERNS
// =============================================
const ATS_PATTERNS = {
  greenhouse: {
    boardUrlPattern: /boards\.greenhouse\.io\/(\w+)/i,
    apiTemplate: (slug: string) => `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`,
    boardTemplate: (slug: string) => `https://boards.greenhouse.io/${slug}`,
    discoveryUrls: [
      "https://boards.greenhouse.io",
    ],
  },
  lever: {
    boardUrlPattern: /jobs\.lever\.co\/(\w[\w-]*)/i,
    apiTemplate: (slug: string) => `https://api.lever.co/v0/postings/${slug}`,
    boardTemplate: (slug: string) => `https://jobs.lever.co/${slug}`,
    discoveryUrls: [],
  },
  ashby: {
    boardUrlPattern: /jobs\.ashbyhq\.com\/(\w[\w-]*)/i,
    apiTemplate: (slug: string) => `https://api.ashbyhq.com/posting-api/job-board/${slug}`,
    boardTemplate: (slug: string) => `https://jobs.ashbyhq.com/${slug}`,
    discoveryUrls: [],
  },
};

// =============================================
// KNOWN GREENHOUSE BOARD SLUGS (seed list for discovery)
// =============================================
const GREENHOUSE_SEED_SLUGS = [
  // Tech giants & unicorns
  "airbnb", "airtable", "amplitude", "anduril", "anthropic", "astranis",
  "benchling", "brex", "canva", "chainalysis", "chime", "circleinternet",
  "cloudflare", "cockroachlabs", "confluent", "crusoeenergy", "databricks",
  "datadog", "deel", "descript", "discord", "doordash", "dropbox",
  "duolingo", "elastic", "faire", "fastly", "figma", "flexport",
  "gusto", "hashicorp", "hubspot", "instacart", "ironclad",
  "joinpuzzle", "justworks", "klaviyo", "lacework", "lattice",
  "linear", "loom", "lyft", "masterclass", "miro", "mixpanel",
  "mongodb", "nerdwallet", "newrelic", "notion", "nuro", "okta",
  "openai", "pagerduty", "palantir", "pinterestcareers", "plaid",
  "postman", "qualtrics", "ramp", "reddit", "relativity",
  "retool", "rippling", "robinhood", "samsara", "scale",
  "scribd", "seatgeek", "sentry", "shopify", "snap",
  "snowflake", "sofi", "sourcegraph", "splunk", "spotify",
  "square", "stripe", "supabase", "tempus", "toast",
  "twilio", "twitch", "uber", "vanta", "vercel", "wealthsimple",
  "whatnot", "wikimedia", "wiz", "zapier", "zscaler",
  // Finance/fintech
  "affirm", "betterment", "blockfi", "bolt", "checkout",
  "coinbase", "column", "cross-river", "dave", "drata",
  "galileo", "greenlight", "marqeta", "mercury", "melio",
  "moderntreasury", "orum", "payoneer", "paytm", "plaidcareers",
  "remitly", "revolut", "wise", "upstart",
  // Healthcare/bio
  "23andme", "cerebral", "cityblock", "color", "devoted",
  "elationhealth", "flatiron", "ginkgobioworks", "grail",
  "hims", "illumina", "invitae", "modernhealth", "omadahealth",
  "onemedical", "optum", "osfdigital", "recursion", "ro",
  "springhealth", "tempus", "veracyte", "verily",
  // Enterprise/B2B
  "1password", "abnormalsecurity", "aiven", "algolia", "astronomer",
  "auth0", "automattic", "box", "calendly", "contentful",
  "contrast", "cribl", "crowdstrike", "cypress", "dbt",
  "elastic", "fivetran", "gitlab", "grafana", "harness",
  "hashicorp", "honey", "hygraph", "incident", "launchdarkly",
  "lightstep", "linear", "logicmonitor", "mezmo", "mux",
  "netlify", "newrelic", "nginx", "observeinc", "opsramp",
  "pagerduty", "panther", "pulumi", "rapid7", "sailpoint",
  "samsara", "secureworks", "semgrep", "snyk", "sonarqube",
  "sumo", "temporal", "terraform", "torq", "uipath",
  "veeam", "verkada", "vmware", "weights-biases", "zoominfo",
];

const LEVER_SEED_SLUGS = [
  "netflix", "notion", "figma", "netlify", "tailscale",
  "anyscale", "dbt-labs", "gitpod", "grafana-labs",
  "hashicorp", "meilisearch", "neon", "oxide",
  "planetscale", "postman", "prisma", "railway",
  "replit", "resend", "rust-foundation", "sentry",
  "sourcegraph", "stytch", "supabase", "temporal",
  "turso", "upstash", "vercel", "zed-industries",
];

const ASHBY_SEED_SLUGS = [
  "anthropic", "linear", "notion", "ramp", "vercel",
  "mercury", "deel", "dbt-labs", "airbyte",
  "axiom", "cal-com", "encore", "fly-io",
  "inngest", "neon", "pylon", "resend",
  "turso", "trigger-dev", "upstash",
];

// =============================================
// VALIDATE A SOURCE
// =============================================
async function validateSource(
  sourceType: string,
  apiEndpoint: string,
  companyName: string,
): Promise<{ valid: boolean; jobCount: number; sampleJobs: unknown[]; error?: string }> {
  try {
    const response = await fetch(apiEndpoint, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { valid: false, jobCount: 0, sampleJobs: [], error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    let jobs: unknown[] = [];

    if (sourceType === "greenhouse") {
      jobs = data.jobs || [];
    } else if (sourceType === "lever") {
      jobs = Array.isArray(data) ? data : [];
    } else if (sourceType === "ashby") {
      jobs = data.jobs || [];
    }

    if (jobs.length === 0) {
      return { valid: false, jobCount: 0, sampleJobs: [], error: "No jobs found" };
    }

    // Check for valid apply URLs
    const sampleJobs = jobs.slice(0, 3).map((j: any) => ({
      title: j.title || j.text || "Unknown",
      url: j.absolute_url || j.hostedUrl || j.jobUrl || "",
    }));

    const hasValidUrls = sampleJobs.some((j: any) => j.url && j.url.startsWith("http"));

    return {
      valid: hasValidUrls,
      jobCount: jobs.length,
      sampleJobs,
      error: hasValidUrls ? undefined : "No valid apply URLs found",
    };
  } catch (error) {
    return {
      valid: false,
      jobCount: 0,
      sampleJobs: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// =============================================
// DISCOVER FROM SEED SLUGS
// =============================================
async function discoverFromSeeds(
  supabase: any,
  runId: string,
  atsType: string,
  slugs: string[],
  countryCode: string,
): Promise<{ discovered: number; validated: number; duplicates: number }> {
  const stats = { discovered: 0, validated: 0, duplicates: 0 };

  const atsConfig = ATS_PATTERNS[atsType as keyof typeof ATS_PATTERNS];
  if (!atsConfig) return stats;

  for (const slug of slugs) {
    const apiEndpoint = atsConfig.apiTemplate(slug);
    const baseUrl = atsConfig.boardTemplate(slug);
    const domain = `${slug}.com`;

    // Check if source already exists
    const { data: existing } = await supabase
      .from("job_sources")
      .select("id")
      .eq("api_endpoint", apiEndpoint)
      .maybeSingle();

    if (existing) {
      stats.duplicates++;
      continue;
    }

    // Check discovered_sources too
    const { data: existingDiscovered } = await supabase
      .from("discovered_sources")
      .select("id")
      .eq("api_endpoint", apiEndpoint)
      .maybeSingle();

    if (existingDiscovered) {
      stats.duplicates++;
      continue;
    }

    stats.discovered++;

    // Validate the source
    const companyName = slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

    const validation = await validateSource(atsType, apiEndpoint, companyName);

    const discoveredSource = {
      name: `${companyName} (${atsType})`,
      company_name: companyName,
      source_type: atsType,
      base_url: baseUrl,
      api_endpoint: apiEndpoint,
      domain,
      country_code: countryCode,
      discovery_method: "ats_crawl",
      discovery_run_id: runId,
      validation_status: validation.valid ? "validated" : "rejected",
      validation_error: validation.error || null,
      sample_job_count: validation.jobCount,
      sample_jobs: validation.sampleJobs,
      has_valid_apply_urls: validation.valid,
      has_consistent_structure: validation.valid,
      quality_score: validation.valid ? Math.min(100, 50 + validation.jobCount) : 0,
    };

    await supabase.from("discovered_sources").insert(discoveredSource);

    if (validation.valid) {
      stats.validated++;
    }

    // Rate limit: 200ms between requests
    await new Promise((r) => setTimeout(r, 200));
  }

  return stats;
}

// =============================================
// AUTO-APPROVE HIGH-QUALITY SOURCES
// =============================================
async function autoApproveHighQuality(supabase: any): Promise<number> {
  // Auto-approve validated sources with quality_score >= 60 and job count >= 5
  const { data: candidates } = await supabase
    .from("discovered_sources")
    .select("*")
    .eq("validation_status", "validated")
    .gte("quality_score", 60)
    .gte("sample_job_count", 5)
    .is("reviewed_at", null)
    .limit(100);

  if (!candidates || candidates.length === 0) return 0;

  let approved = 0;

  for (const source of candidates) {
    // Insert into job_sources
    const { error } = await supabase.from("job_sources").insert({
      name: source.name,
      company_name: source.company_name,
      source_type: source.source_type,
      base_url: source.base_url,
      api_endpoint: source.api_endpoint,
      status: "active",
      poll_interval_minutes: 60,
      country_code: source.country_code,
      language: source.language,
      auto_discovered: true,
      discovery_method: source.discovery_method,
      domain: source.domain,
      source_quality_score: source.quality_score,
    });

    if (!error) {
      await supabase
        .from("discovered_sources")
        .update({
          validation_status: "approved",
          reviewed_at: new Date().toISOString(),
          review_notes: "Auto-approved (quality >= 60, jobs >= 5)",
        })
        .eq("id", source.id);

      approved++;
    }
  }

  return approved;
}

// =============================================
// DETECT ATS TYPE FROM URL
// =============================================
function detectAtsFromUrl(url: string): { type: string; slug: string } | null {
  for (const [atsType, config] of Object.entries(ATS_PATTERNS)) {
    const match = url.match(config.boardUrlPattern);
    if (match) {
      return { type: atsType, slug: match[1] };
    }
  }
  return null;
}

// =============================================
// VALIDATE COMMUNITY SUBMISSION
// =============================================
async function validateSubmission(
  supabase: any,
  url: string,
  userId: string,
): Promise<{
  success: boolean;
  atsType?: string;
  companyName?: string;
  jobCount?: number;
  error?: string;
}> {
  // Try to detect ATS type from URL
  const detected = detectAtsFromUrl(url);

  if (detected) {
    const atsConfig = ATS_PATTERNS[detected.type as keyof typeof ATS_PATTERNS];
    const apiEndpoint = atsConfig.apiTemplate(detected.slug);
    const companyName = detected.slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

    // Check duplicates
    const { data: existing } = await supabase
      .from("job_sources")
      .select("id")
      .eq("api_endpoint", apiEndpoint)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "This source already exists in our system" };
    }

    const validation = await validateSource(detected.type, apiEndpoint, companyName);

    if (validation.valid) {
      // Create discovered source
      await supabase.from("discovered_sources").insert({
        name: `${companyName} (${detected.type})`,
        company_name: companyName,
        source_type: detected.type,
        base_url: url,
        api_endpoint: apiEndpoint,
        discovery_method: "community",
        validation_status: "validated",
        sample_job_count: validation.jobCount,
        sample_jobs: validation.sampleJobs,
        has_valid_apply_urls: true,
        has_consistent_structure: true,
        quality_score: Math.min(100, 50 + validation.jobCount),
        submitted_by: userId,
        submission_url: url,
      });

      return {
        success: true,
        atsType: detected.type,
        companyName,
        jobCount: validation.jobCount,
      };
    }

    return { success: false, error: validation.error || "Source validation failed" };
  }

  // Not a recognized ATS URL
  return {
    success: false,
    error: "Could not detect ATS type. We currently support Greenhouse, Lever, and Ashby job boards.",
  };
}

// =============================================
// AUTH VALIDATION
// =============================================
async function validateAuth(req: Request, supabaseUrl: string, supabaseKey: string): Promise<{ authenticated: boolean; userId?: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return { authenticated: false };

  const token = authHeader.replace("Bearer ", "");

  // System auth
  for (const envVar of ["CRON_SECRET", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY"]) {
    const secret = Deno.env.get(envVar);
    if (secret && token === secret) return { authenticated: true };
  }

  // User auth
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) return { authenticated: true, userId: user.id };
  } catch (_) {}

  return { authenticated: false };
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

  const { authenticated, userId } = await validateAuth(req, supabaseUrl, supabaseKey);
  if (!authenticated) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  try {
    const body = await req.json().catch(() => ({}));
    const { action = "discover", ...params } = body;

    // ---- COMMUNITY SUBMISSION ----
    if (action === "submit") {
      if (!userId) {
        return new Response(JSON.stringify({ error: "Must be logged in to submit" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }

      const { url } = params;
      if (!url) {
        return new Response(JSON.stringify({ error: "URL is required" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const result = await validateSubmission(supabase, url, userId);

      // Log submission
      await supabase.from("source_submissions").insert({
        user_id: userId,
        url,
        detected_ats_type: result.atsType || null,
        detected_company_name: result.companyName || null,
        status: result.success ? "pending" : "rejected",
      });

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- DISCOVERY RUN ----
    const runStartedAt = new Date();
    const {
      ats_types = ["greenhouse", "lever", "ashby"],
      country_code = "US",
      auto_approve = true,
      limit: slugLimit,
    } = params;

    // Create discovery run
    const { data: run } = await supabase
      .from("discovery_runs")
      .insert({
        run_type: "ats_crawl",
        country_code,
        target_ats: ats_types.join(","),
        started_at: runStartedAt.toISOString(),
        status: "running",
      })
      .select("id")
      .single();

    const runId = run?.id;
    let totalDiscovered = 0;
    let totalValidated = 0;
    let totalDuplicates = 0;

    // Process each ATS type
    for (const atsType of ats_types) {
      let slugs: string[] = [];
      if (atsType === "greenhouse") slugs = GREENHOUSE_SEED_SLUGS;
      else if (atsType === "lever") slugs = LEVER_SEED_SLUGS;
      else if (atsType === "ashby") slugs = ASHBY_SEED_SLUGS;

      if (slugLimit) slugs = slugs.slice(0, slugLimit);

      log("info", `Discovering ${atsType} sources`, { slugCount: slugs.length });

      const stats = await discoverFromSeeds(supabase, runId, atsType, slugs, country_code);
      totalDiscovered += stats.discovered;
      totalValidated += stats.validated;
      totalDuplicates += stats.duplicates;
    }

    // Auto-approve high-quality sources
    let autoApproved = 0;
    if (auto_approve) {
      autoApproved = await autoApproveHighQuality(supabase);
    }

    // Update run
    await supabase
      .from("discovery_runs")
      .update({
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - runStartedAt.getTime(),
        status: "completed",
        sources_discovered: totalDiscovered,
        sources_validated: totalValidated,
        sources_duplicate: totalDuplicates,
        sources_approved: autoApproved,
      })
      .eq("id", runId);

    log("info", "Discovery run complete", {
      discovered: totalDiscovered,
      validated: totalValidated,
      duplicates: totalDuplicates,
      auto_approved: autoApproved,
    });

    return new Response(
      JSON.stringify({
        success: true,
        run_id: runId,
        discovered: totalDiscovered,
        validated: totalValidated,
        duplicates: totalDuplicates,
        auto_approved: autoApproved,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log("error", "Discovery error", { error: errorMessage });

    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
