import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LogoResult {
  logo_url: string | null;
  source: "clearbit" | "favicon" | "ats" | "manual" | "fallback";
  domain: string | null;
}

// Logging helper
const log = (level: string, message: string, details?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({ timestamp, level, message, ...details }));
};

// Extract domain from company name or URL
function extractDomain(company: string, applyUrl?: string): string | null {
  // Try to extract from apply URL first
  if (applyUrl) {
    try {
      const url = new URL(applyUrl);
      // Skip job board domains - extract company domain from path if possible
      const jobBoards = [
        "greenhouse.io", "boards.greenhouse.io",
        "lever.co", "jobs.lever.co",
        "workday.com", "myworkdayjobs.com",
        "jobvite.com", "ashbyhq.com", "smartrecruiters.com",
        "linkedin.com", "indeed.com", "glassdoor.com"
      ];
      
      if (!jobBoards.some(board => url.hostname.includes(board))) {
        return url.hostname.replace("www.", "").replace("careers.", "").replace("jobs.", "");
      }
    } catch {
      // Invalid URL, continue
    }
  }
  
  // Known company domain mappings
  const knownDomains: Record<string, string> = {
    "stripe": "stripe.com",
    "coinbase": "coinbase.com",
    "airbnb": "airbnb.com",
    "anthropic": "anthropic.com",
    "vercel": "vercel.com",
    "figma": "figma.com",
    "linear": "linear.app",
    "notion": "notion.so",
    "openai": "openai.com",
    "google": "google.com",
    "meta": "meta.com",
    "facebook": "meta.com",
    "apple": "apple.com",
    "amazon": "amazon.com",
    "microsoft": "microsoft.com",
    "netflix": "netflix.com",
    "spotify": "spotify.com",
    "uber": "uber.com",
    "lyft": "lyft.com",
    "doordash": "doordash.com",
    "instacart": "instacart.com",
    "slack": "slack.com",
    "discord": "discord.com",
    "github": "github.com",
    "gitlab": "gitlab.com",
    "atlassian": "atlassian.com",
    "dropbox": "dropbox.com",
    "salesforce": "salesforce.com",
    "adobe": "adobe.com",
    "nvidia": "nvidia.com",
    "amd": "amd.com",
    "intel": "intel.com",
    "qualcomm": "qualcomm.com",
    "snap": "snap.com",
    "snapchat": "snap.com",
    "pinterest": "pinterest.com",
    "reddit": "reddit.com",
    "twitter": "x.com",
    "x": "x.com",
    "tiktok": "tiktok.com",
    "bytedance": "bytedance.com",
    "shopify": "shopify.com",
    "square": "squareup.com",
    "block": "block.xyz",
    "robinhood": "robinhood.com",
    "plaid": "plaid.com",
    "brex": "brex.com",
    "ramp": "ramp.com",
    "datadog": "datadoghq.com",
    "snowflake": "snowflake.com",
    "databricks": "databricks.com",
    "mongodb": "mongodb.com",
    "elastic": "elastic.co",
    "twilio": "twilio.com",
    "cloudflare": "cloudflare.com",
    "airtable": "airtable.com",
    "asana": "asana.com",
    "monday": "monday.com",
    "zoom": "zoom.us",
    "webex": "webex.com",
    "cisco": "cisco.com",
    "ibm": "ibm.com",
    "oracle": "oracle.com",
    "sap": "sap.com",
    "workday": "workday.com",
    "servicenow": "servicenow.com",
    "palantir": "palantir.com",
    "crowdstrike": "crowdstrike.com",
    "palo alto networks": "paloaltonetworks.com",
    "okta": "okta.com",
    "docusign": "docusign.com",
    "zendesk": "zendesk.com",
    "hubspot": "hubspot.com",
    "mailchimp": "mailchimp.com",
    "intercom": "intercom.com",
    "amplitude": "amplitude.com",
    "mixpanel": "mixpanel.com",
    "segment": "segment.com",
    "contentful": "contentful.com",
    "sanity": "sanity.io",
    "supabase": "supabase.com",
    "netlify": "netlify.com",
    "heroku": "heroku.com",
    "render": "render.com",
    "deno": "deno.com",
    "bun": "bun.sh",
  };
  
  const companyLower = company.toLowerCase().trim();
  if (knownDomains[companyLower]) {
    return knownDomains[companyLower];
  }
  
  // Try partial match
  for (const [key, domain] of Object.entries(knownDomains)) {
    if (companyLower.includes(key) || key.includes(companyLower)) {
      return domain;
    }
  }
  
  // Clean company name and guess domain
  const cleaned = company
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+(inc|llc|corp|corporation|ltd|limited|co|company|technologies|labs|studios|group|holdings)$/i, "")
    .trim()
    .replace(/\s+/g, "");
  
  return cleaned ? `${cleaned}.com` : null;
}

// Try Clearbit Logo API (free tier)
async function tryClearbit(domain: string): Promise<string | null> {
  const url = `https://logo.clearbit.com/${domain}`;
  try {
    const response = await fetch(url, { method: "HEAD" });
    if (response.ok) {
      log("info", "Clearbit logo found", { domain, url });
      return url;
    }
  } catch {
    // Clearbit failed
  }
  return null;
}

// Try Google favicon service (128px)
async function tryGoogleFavicon(domain: string): Promise<string | null> {
  const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  try {
    const response = await fetch(url, { method: "HEAD" });
    if (response.ok) {
      log("info", "Google favicon found", { domain, url });
      return url;
    }
  } catch {
    // Google favicon failed
  }
  return null;
}

// Try DuckDuckGo favicon service
function getDuckDuckGoFavicon(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

// Resolve logo with fallback chain
async function resolveLogo(company: string, applyUrl?: string, atsLogoUrl?: string): Promise<LogoResult> {
  const domain = extractDomain(company, applyUrl);
  
  log("info", "Resolving logo", { company, domain, applyUrl: applyUrl?.slice(0, 50), atsLogoUrl });
  
  // 1. Check ATS-provided logo first
  if (atsLogoUrl && atsLogoUrl.startsWith("http")) {
    try {
      const response = await fetch(atsLogoUrl, { method: "HEAD" });
      if (response.ok) {
        return { logo_url: atsLogoUrl, source: "ats", domain };
      }
    } catch {
      // ATS logo failed
    }
  }
  
  if (!domain) {
    log("warn", "Could not determine domain", { company });
    return { logo_url: null, source: "fallback", domain: null };
  }
  
  // 2. Try Clearbit (highest quality)
  const clearbitLogo = await tryClearbit(domain);
  if (clearbitLogo) {
    return { logo_url: clearbitLogo, source: "clearbit", domain };
  }
  
  // 3. Try Google favicon (usually reliable)
  const googleFavicon = await tryGoogleFavicon(domain);
  if (googleFavicon) {
    return { logo_url: googleFavicon, source: "favicon", domain };
  }
  
  // 4. DuckDuckGo as final fallback (always returns something)
  const ddgFavicon = getDuckDuckGoFavicon(domain);
  return { logo_url: ddgFavicon, source: "favicon", domain };
}

// Validate CRON_SECRET for automated calls
function validateCronSecret(req: Request): boolean {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) {
    log("warn", "CRON_SECRET not configured");
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
    log("warn", "Unauthorized request - invalid CRON_SECRET");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { job_id, company, apply_url, logo_url: atsLogoUrl, batch_size = 100 } = await req.json();
    
    log("info", "Logo resolver called", { job_id, company, batch_size });
    
    // Single job resolution
    if (job_id && company) {
      const result = await resolveLogo(company, apply_url, atsLogoUrl);
      
      // Update job with logo
      const { error: updateError } = await supabase
        .from("jobs")
        .update({
          company_logo_url: result.logo_url,
          company_domain: result.domain,
          logo_source: result.source,
          logo_last_verified_at: new Date().toISOString(),
        })
        .eq("id", job_id);
      
      if (updateError) {
        log("error", "Failed to update job logo", { job_id, error: updateError.message });
        throw updateError;
      }
      
      // Cache in company_logos table
      if (result.domain) {
        await supabase
          .from("company_logos")
          .upsert({
            domain: result.domain,
            company_name: company,
            logo_url: result.logo_url,
            source: result.source,
            verified_at: new Date().toISOString(),
          }, { onConflict: "domain" });
      }
      
      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Batch resolution for jobs without logos
    const { data: jobsWithoutLogos, error: fetchError } = await supabase
      .from("jobs")
      .select("id, company, apply_url, logo_url")
      .is("company_logo_url", null)
      .order("created_at", { ascending: false })
      .limit(batch_size);
    
    if (fetchError) {
      throw fetchError;
    }
    
    log("info", `Found ${jobsWithoutLogos?.length || 0} jobs without logos`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const job of jobsWithoutLogos || []) {
      try {
        // Check cache first
        const domain = extractDomain(job.company, job.apply_url);
        if (domain) {
          const { data: cached } = await supabase
            .from("company_logos")
            .select("logo_url, source")
            .eq("domain", domain)
            .single();
          
          if (cached && cached.logo_url) {
            await supabase
              .from("jobs")
              .update({
                company_logo_url: cached.logo_url,
                company_domain: domain,
                logo_source: cached.source,
                logo_last_verified_at: new Date().toISOString(),
              })
              .eq("id", job.id);
            
            successCount++;
            continue;
          }
        }
        
        // Resolve and update
        const result = await resolveLogo(job.company, job.apply_url, job.logo_url);
        
        await supabase
          .from("jobs")
          .update({
            company_logo_url: result.logo_url,
            company_domain: result.domain,
            logo_source: result.source,
            logo_last_verified_at: new Date().toISOString(),
          })
          .eq("id", job.id);
        
        // Cache the result
        if (result.domain) {
          await supabase
            .from("company_logos")
            .upsert({
              domain: result.domain,
              company_name: job.company,
              logo_url: result.logo_url,
              source: result.source,
              verified_at: new Date().toISOString(),
            }, { onConflict: "domain" });
        }
        
        successCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (err) {
        log("error", `Failed to resolve logo for job ${job.id}`, { error: String(err) });
        errorCount++;
      }
    }
    
    log("info", "Logo resolution complete", { successCount, errorCount, processed: jobsWithoutLogos?.length || 0 });
    
    return new Response(JSON.stringify({
      success: true,
      processed: jobsWithoutLogos?.length || 0,
      successCount,
      errorCount,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log("error", "Logo resolver error", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
