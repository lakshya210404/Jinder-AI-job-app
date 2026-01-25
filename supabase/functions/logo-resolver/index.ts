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

// Extract domain from company name or URL
function extractDomain(company: string, applyUrl?: string): string | null {
  // Try to extract from apply URL first
  if (applyUrl) {
    try {
      const url = new URL(applyUrl);
      // Skip job board domains
      const jobBoards = ["greenhouse.io", "lever.co", "workday.com", "myworkdayjobs.com", "jobvite.com", "ashbyhq.com"];
      if (!jobBoards.some(board => url.hostname.includes(board))) {
        return url.hostname.replace("www.", "").replace("careers.", "").replace("jobs.", "");
      }
    } catch {
      // Invalid URL, continue
    }
  }
  
  // Clean company name and guess domain
  const cleaned = company
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+(inc|llc|corp|corporation|ltd|limited|co|company)$/i, "")
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
      return url;
    }
  } catch {
    // Clearbit failed
  }
  return null;
}

// Try Google favicon service
async function tryGoogleFavicon(domain: string): Promise<string | null> {
  const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  try {
    const response = await fetch(url, { method: "HEAD" });
    if (response.ok) {
      return url;
    }
  } catch {
    // Google favicon failed
  }
  return null;
}

// Try DuckDuckGo favicon service
async function tryDuckDuckGoFavicon(domain: string): Promise<string | null> {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

// Resolve logo with fallback chain
async function resolveLogo(company: string, applyUrl?: string, atsLogoUrl?: string): Promise<LogoResult> {
  const domain = extractDomain(company, applyUrl);
  
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
    return { logo_url: null, source: "fallback", domain: null };
  }
  
  // 2. Try Clearbit (highest quality)
  const clearbitLogo = await tryClearbit(domain);
  if (clearbitLogo) {
    return { logo_url: clearbitLogo, source: "clearbit", domain };
  }
  
  // 3. Try Google favicon
  const googleFavicon = await tryGoogleFavicon(domain);
  if (googleFavicon) {
    return { logo_url: googleFavicon, source: "favicon", domain };
  }
  
  // 4. Try DuckDuckGo as final fallback
  const ddgFavicon = await tryDuckDuckGoFavicon(domain);
  return { logo_url: ddgFavicon, source: "favicon", domain };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { job_id, company, apply_url, logo_url: atsLogoUrl, batch_size = 50 } = await req.json();
    
    console.log(`Logo resolver called with job_id: ${job_id}, company: ${company}, batch_size: ${batch_size}`);
    
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
        console.error("Failed to update job:", updateError);
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
      .limit(batch_size);
    
    if (fetchError) {
      throw fetchError;
    }
    
    console.log(`Found ${jobsWithoutLogos?.length || 0} jobs without logos`);
    
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
          
          if (cached) {
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
        
        // Rate limit to avoid overwhelming external services
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.error(`Failed to resolve logo for job ${job.id}:`, err);
        errorCount++;
      }
    }
    
    console.log(`Logo resolution complete: ${successCount} success, ${errorCount} errors`);
    
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
    console.error("Logo resolver error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
