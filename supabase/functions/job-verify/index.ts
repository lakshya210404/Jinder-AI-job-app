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
// VERIFY JOB URL ACCESSIBILITY
// =============================================
async function verifyJobUrl(applyUrl: string): Promise<{
  http_status: number | null;
  is_accessible: boolean;
  page_title: string | null;
  apply_button_found: boolean;
  job_closed_signal: boolean;
  redirect_detected: boolean;
  redirect_url: string | null;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(applyUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; JobVerifier/1.0)",
        "Accept": "text/html",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const finalUrl = response.url;
    const redirectDetected = finalUrl !== applyUrl;
    const html = await response.text();

    // Extract page title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim().slice(0, 200) : null;

    // Check for job closed signals
    const closedSignals = [
      /position\s+(has\s+been\s+)?filled/i,
      /no\s+longer\s+(accepting|available)/i,
      /job\s+(has\s+been\s+)?closed/i,
      /position\s+(is\s+)?closed/i,
      /this\s+job\s+is\s+no\s+longer/i,
      /role\s+(has\s+been\s+)?filled/i,
      /application\s+deadline\s+passed/i,
    ];
    const jobClosedSignal = closedSignals.some(pattern => pattern.test(html));

    // Check for apply button
    const applyButtonPatterns = [
      /apply\s+(now|for\s+this)/i,
      /submit\s+application/i,
      /<button[^>]*>apply/i,
      /<a[^>]*>apply/i,
      /class="[^"]*apply[^"]*"/i,
    ];
    const applyButtonFound = applyButtonPatterns.some(pattern => pattern.test(html));

    return {
      http_status: response.status,
      is_accessible: response.ok,
      page_title: pageTitle,
      apply_button_found: applyButtonFound,
      job_closed_signal: jobClosedSignal,
      redirect_detected: redirectDetected,
      redirect_url: redirectDetected ? finalUrl : null,
    };
  } catch (error) {
    log("warn", "URL verification failed", { url: applyUrl, error: String(error) });
    return {
      http_status: null,
      is_accessible: false,
      page_title: null,
      apply_button_found: false,
      job_closed_signal: false,
      redirect_detected: false,
      redirect_url: null,
    };
  }
}

// =============================================
// DETERMINE VERIFICATION STATUS
// =============================================
function determineVerificationStatus(
  verification: {
    is_accessible: boolean;
    job_closed_signal: boolean;
    apply_button_found: boolean;
    http_status: number | null;
  },
  lastVerifiedAt: string | null
): "verified_active" | "stale" | "expired" | "removed" {
  // Not accessible = removed
  if (!verification.is_accessible || (verification.http_status && verification.http_status >= 400)) {
    return "removed";
  }

  // Job closed signal = expired
  if (verification.job_closed_signal) {
    return "expired";
  }

  // Apply button found = verified active
  if (verification.apply_button_found) {
    return "verified_active";
  }

  // No apply button but accessible - might be stale
  if (lastVerifiedAt) {
    const lastVerified = new Date(lastVerifiedAt);
    const hoursSinceVerified = (Date.now() - lastVerified.getTime()) / (1000 * 60 * 60);
    if (hoursSinceVerified > 72) {
      return "stale";
    }
  }

  return "verified_active";
}

// =============================================
// AUTH VALIDATION (CRON_SECRET or ANON_KEY for pg_cron)
// =============================================
function validateAuth(req: Request): boolean {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  
  const token = authHeader.replace("Bearer ", "");
  
  // Check CRON_SECRET
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && token === cronSecret) {
    return true;
  }
  
  // Check service role key
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRoleKey && token === serviceRoleKey) {
    return true;
  }
  
  // Check anon key (for pg_cron internal calls)
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (anonKey && token === anonKey) {
    log("info", "Authenticated via anon key (pg_cron)");
    return true;
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

  // Validate auth for automated calls
  if (!validateAuth(req)) {
    log("warn", "Unauthorized request");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    log("info", "Job verification pipeline started");

    const body = await req.json().catch(() => ({}));
    const { job_id, limit = 20, max_age_hours = 24 } = body;

    // Build query for jobs to verify
    let query = supabase
      .from("jobs")
      .select("id, apply_url, last_verified_at, verification_status")
      .not("apply_url", "is", null)
      .order("last_verified_at", { ascending: true, nullsFirst: true })
      .limit(limit);

    if (job_id) {
      query = supabase
        .from("jobs")
        .select("id, apply_url, last_verified_at, verification_status")
        .eq("id", job_id);
    } else {
      // Only verify jobs that haven't been verified recently
      const cutoff = new Date(Date.now() - max_age_hours * 60 * 60 * 1000).toISOString();
      query = query.or(`last_verified_at.is.null,last_verified_at.lt.${cutoff}`);
    }

    const { data: jobs, error: jobsError } = await query;

    if (jobsError) {
      throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
    }

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No jobs to verify",
        verified: 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    log("info", "Verifying jobs", { count: jobs.length });

    let verifiedCount = 0;
    let expiredCount = 0;
    let removedCount = 0;

    for (const job of jobs) {
      if (!job.apply_url) continue;

      const verification = await verifyJobUrl(job.apply_url);
      const newStatus = determineVerificationStatus(verification, job.last_verified_at);

      // Record verification
      await supabase.from("job_verifications").insert({
        job_id: job.id,
        ...verification,
      });

      // Update job status
      await supabase
        .from("jobs")
        .update({
          verification_status: newStatus,
          last_verified_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      verifiedCount++;
      if (newStatus === "expired") expiredCount++;
      if (newStatus === "removed") removedCount++;

      log("info", "Job verified", { 
        job_id: job.id, 
        status: newStatus,
        accessible: verification.is_accessible 
      });

      // Rate limiting - be respectful to target servers
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    log("info", "Job verification complete", { 
      verified: verifiedCount, 
      expired: expiredCount, 
      removed: removedCount 
    });

    return new Response(JSON.stringify({
      success: true,
      verified: verifiedCount,
      expired: expiredCount,
      removed: removedCount,
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
