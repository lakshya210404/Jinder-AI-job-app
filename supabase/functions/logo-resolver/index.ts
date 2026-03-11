import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LogoResult {
  logo_url: string | null;
  logo_storage_url: string | null;
  source: "clearbit" | "favicon" | "ats" | "manual" | "fallback" | "storage";
  domain: string | null;
}

const log = (level: string, message: string, details?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({ timestamp, level, message, ...details }));
};

// Extract domain from company name or URL
function extractDomain(company: string, applyUrl?: string): string | null {
  if (applyUrl) {
    try {
      const url = new URL(applyUrl);
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
  
  const knownDomains: Record<string, string> = {
    "stripe": "stripe.com", "coinbase": "coinbase.com", "airbnb": "airbnb.com",
    "anthropic": "anthropic.com", "vercel": "vercel.com", "figma": "figma.com",
    "linear": "linear.app", "notion": "notion.so", "openai": "openai.com",
    "google": "google.com", "meta": "meta.com", "facebook": "meta.com",
    "apple": "apple.com", "amazon": "amazon.com", "microsoft": "microsoft.com",
    "netflix": "netflix.com", "spotify": "spotify.com", "uber": "uber.com",
    "lyft": "lyft.com", "doordash": "doordash.com", "instacart": "instacart.com",
    "slack": "slack.com", "discord": "discord.com", "github": "github.com",
    "gitlab": "gitlab.com", "atlassian": "atlassian.com", "dropbox": "dropbox.com",
    "salesforce": "salesforce.com", "adobe": "adobe.com", "nvidia": "nvidia.com",
    "amd": "amd.com", "intel": "intel.com", "qualcomm": "qualcomm.com",
    "snap": "snap.com", "snapchat": "snap.com", "pinterest": "pinterest.com",
    "reddit": "reddit.com", "twitter": "x.com", "x": "x.com",
    "tiktok": "tiktok.com", "bytedance": "bytedance.com", "shopify": "shopify.com",
    "square": "squareup.com", "block": "block.xyz", "robinhood": "robinhood.com",
    "plaid": "plaid.com", "brex": "brex.com", "ramp": "ramp.com",
    "datadog": "datadoghq.com", "snowflake": "snowflake.com", "databricks": "databricks.com",
    "mongodb": "mongodb.com", "elastic": "elastic.co", "twilio": "twilio.com",
    "cloudflare": "cloudflare.com", "airtable": "airtable.com", "asana": "asana.com",
    "monday": "monday.com", "zoom": "zoom.us", "webex": "webex.com",
    "cisco": "cisco.com", "ibm": "ibm.com", "oracle": "oracle.com",
    "sap": "sap.com", "workday": "workday.com", "servicenow": "servicenow.com",
    "palantir": "palantir.com", "crowdstrike": "crowdstrike.com",
    "palo alto networks": "paloaltonetworks.com", "okta": "okta.com",
    "docusign": "docusign.com", "zendesk": "zendesk.com", "hubspot": "hubspot.com",
    "mailchimp": "mailchimp.com", "intercom": "intercom.com", "amplitude": "amplitude.com",
    "mixpanel": "mixpanel.com", "segment": "segment.com", "contentful": "contentful.com",
    "sanity": "sanity.io", "supabase": "supabase.com", "netlify": "netlify.com",
    "heroku": "heroku.com", "render": "render.com", "deno": "deno.com", "bun": "bun.sh",
  };
  
  const companyLower = company.toLowerCase().trim();
  if (knownDomains[companyLower]) return knownDomains[companyLower];
  
  for (const [key, domain] of Object.entries(knownDomains)) {
    if (companyLower.includes(key) || key.includes(companyLower)) return domain;
  }
  
  const cleaned = company.toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+(inc|llc|corp|corporation|ltd|limited|co|company|technologies|labs|studios|group|holdings)$/i, "")
    .trim()
    .replace(/\s+/g, "");
  
  return cleaned ? `${cleaned}.com` : null;
}

// Download logo and upload to Supabase Storage
async function downloadAndStoreLogo(
  supabase: any,
  logoUrl: string,
  domain: string
): Promise<string | null> {
  try {
    const response = await fetch(logoUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LogoResolver/1.0)" }
    });
    
    if (!response.ok) return null;
    
    const contentType = response.headers.get("content-type") || "image/png";
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Skip tiny images (likely 1x1 tracking pixels)
    if (uint8Array.length < 500) return null;
    
    const extension = contentType.includes("svg") ? "svg" : 
                     contentType.includes("png") ? "png" : 
                     contentType.includes("webp") ? "webp" : "jpg";
    const fileName = `${domain.replace(/\./g, "_")}.${extension}`;
    
    const { error: uploadError } = await supabase.storage
      .from("job-logos")
      .upload(fileName, uint8Array, {
        contentType,
        upsert: true,
      });
    
    if (uploadError) {
      log("warn", "Failed to upload logo to storage", { domain, error: uploadError.message });
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from("job-logos")
      .getPublicUrl(fileName);
    
    log("info", "Logo stored in Supabase Storage", { domain, fileName, publicUrl });
    return publicUrl;
  } catch (error) {
    log("warn", "Failed to download logo", { logoUrl, error: String(error) });
    return null;
  }
}

// Try Clearbit Logo API
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

// DuckDuckGo favicon service
function getDuckDuckGoFavicon(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

// Check if a URL returns a valid image
async function isValidLogo(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) return false;
    const contentType = response.headers.get("content-type") || "";
    return contentType.includes("image");
  } catch {
    return false;
  }
}

// Resolve logo with fallback chain and storage
async function resolveLogo(
  supabase: any,
  company: string,
  applyUrl?: string,
  atsLogoUrl?: string,
  checkBroken = false
): Promise<LogoResult> {
  const domain = extractDomain(company, applyUrl);
  
  log("info", "Resolving logo", { company, domain, checkBroken });
  
  // 1. Check ATS-provided logo first
  if (atsLogoUrl && atsLogoUrl.startsWith("http")) {
    if (await isValidLogo(atsLogoUrl)) {
      const storageUrl = domain ? await downloadAndStoreLogo(supabase, atsLogoUrl, domain) : null;
      return { 
        logo_url: atsLogoUrl, 
        logo_storage_url: storageUrl,
        source: storageUrl ? "storage" : "ats", 
        domain 
      };
    }
  }
  
  if (!domain) {
    log("warn", "Could not determine domain", { company });
    return { logo_url: null, logo_storage_url: null, source: "fallback", domain: null };
  }
  
  // 2. Try Clearbit (highest quality)
  const clearbitLogo = await tryClearbit(domain);
  if (clearbitLogo) {
    const storageUrl = await downloadAndStoreLogo(supabase, clearbitLogo, domain);
    return { 
      logo_url: clearbitLogo, 
      logo_storage_url: storageUrl,
      source: storageUrl ? "storage" : "clearbit", 
      domain 
    };
  }
  
  // 3. Try Google favicon
  const googleFavicon = await tryGoogleFavicon(domain);
  if (googleFavicon) {
    const storageUrl = await downloadAndStoreLogo(supabase, googleFavicon, domain);
    return { 
      logo_url: googleFavicon, 
      logo_storage_url: storageUrl,
      source: storageUrl ? "storage" : "favicon", 
      domain 
    };
  }
  
  // 4. DuckDuckGo as final fallback
  const ddgFavicon = getDuckDuckGoFavicon(domain);
  return { logo_url: ddgFavicon, logo_storage_url: null, source: "favicon", domain };
}

// Validate auth
async function validateAuth(req: Request, supabaseUrl: string, supabaseKey: string): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  
  const token = authHeader.replace("Bearer ", "");
  
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && token === cronSecret) return true;
  
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRoleKey && token === serviceRoleKey) return true;
  
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (anonKey && token === anonKey) return true;
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) return true;
  } catch {
    // JWT validation failed
  }
  
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  // Validate auth
  if (!await validateAuth(req, supabaseUrl, supabaseKey)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { job_id, company, apply_url, logo_url: atsLogoUrl, batch_size = 100, check_broken = false } = await req.json();
    
    log("info", "Logo resolver called", { job_id, company, batch_size, check_broken });
    
    // Single job resolution
    if (job_id && company) {
      const result = await resolveLogo(supabase, company, apply_url, atsLogoUrl, check_broken);
      
      await supabase.from("jobs").update({
        company_logo_url: result.logo_storage_url || result.logo_url,
        logo_storage_url: result.logo_storage_url,
        company_domain: result.domain,
        logo_source: result.source,
        logo_last_verified_at: new Date().toISOString(),
      }).eq("id", job_id);
      
      if (result.domain) {
        await supabase.from("company_logos").upsert({
          domain: result.domain,
          company_name: company,
          logo_url: result.logo_storage_url || result.logo_url,
          source: result.source,
          verified_at: new Date().toISOString(),
        }, { onConflict: "domain" });
      }
      
      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Batch resolution
    let query = supabase
      .from("jobs")
      .select("id, company, apply_url, logo_url, logo_storage_url, company_logo_url")
      .order("created_at", { ascending: false })
      .limit(batch_size);
    
    if (check_broken) {
      // Check jobs with logos that might be broken
      query = query.not("company_logo_url", "is", null);
    } else {
      // Only jobs missing logos
      query = query.or("company_logo_url.is.null,logo_storage_url.is.null");
    }
    
    const { data: jobsToProcess, error: fetchError } = await query;
    
    if (fetchError) throw fetchError;
    
    log("info", `Found ${jobsToProcess?.length || 0} jobs to process`);
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const job of jobsToProcess || []) {
      try {
        // If checking broken logos, verify existing logo first
        if (check_broken && job.logo_storage_url) {
          if (await isValidLogo(job.logo_storage_url)) {
            skippedCount++;
            continue; // Logo is fine
          }
        }
        
        // Check cache first
        const domain = extractDomain(job.company, job.apply_url);
        if (domain) {
          const { data: cached } = await supabase
            .from("company_logos")
            .select("logo_url, source")
            .eq("domain", domain)
            .maybeSingle();
          
          if (cached?.logo_url && !check_broken) {
            await supabase.from("jobs").update({
              company_logo_url: cached.logo_url,
              logo_storage_url: cached.logo_url.includes("supabase") ? cached.logo_url : null,
              company_domain: domain,
              logo_source: cached.source,
              logo_last_verified_at: new Date().toISOString(),
            }).eq("id", job.id);
            
            successCount++;
            continue;
          }
        }
        
        // Resolve and update
        const result = await resolveLogo(supabase, job.company, job.apply_url, job.logo_url, check_broken);
        
        await supabase.from("jobs").update({
          company_logo_url: result.logo_storage_url || result.logo_url,
          logo_storage_url: result.logo_storage_url,
          company_domain: result.domain,
          logo_source: result.source,
          logo_last_verified_at: new Date().toISOString(),
        }).eq("id", job.id);
        
        if (result.domain) {
          await supabase.from("company_logos").upsert({
            domain: result.domain,
            company_name: job.company,
            logo_url: result.logo_storage_url || result.logo_url,
            source: result.source,
            verified_at: new Date().toISOString(),
          }, { onConflict: "domain" });
        }
        
        successCount++;
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (err) {
        log("error", `Failed to resolve logo for job ${job.id}`, { error: String(err) });
        errorCount++;
      }
    }
    
    log("info", "Logo resolution complete", { successCount, errorCount, skippedCount, processed: jobsToProcess?.length || 0 });
    
    return new Response(JSON.stringify({
      success: true,
      processed: jobsToProcess?.length || 0,
      successCount,
      errorCount,
      skippedCount,
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
