import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface JobSource {
  id: string;
  name: string;
  source_type: string;
  company_name: string;
  company_slug: string | null;
  base_url: string;
  api_endpoint: string | null;
  logo_url: string | null;
  poll_interval_minutes: number;
  last_poll_at: string | null;
  next_poll_at: string | null;
  status: "active" | "paused" | "failing" | "disabled";
  consecutive_failures: number;
  last_success_at: string | null;
  last_failure_at: string | null;
  last_error_message: string | null;
  total_jobs_ingested: number;
  active_job_count: number;
  reliability_score: number;
  is_priority_source: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  // 24h stats
  success_count_24h: number;
  failure_count_24h: number;
  jobs_seen_24h: number;
  jobs_added_24h: number;
  jobs_updated_24h: number;
  jobs_expired_24h: number;
  last_stats_computed_at: string | null;
}

export interface IngestionLog {
  id: string;
  source_id: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  jobs_fetched: number;
  jobs_new: number;
  jobs_updated: number;
  jobs_deduplicated: number;
  jobs_expired: number;
  jobs_seen: number;
  jobs_stale: number;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export interface IngestionRun {
  id: string;
  source_id: string | null;
  run_type: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  status: string;
  error_message: string | null;
  jobs_fetched: number;
  jobs_new: number;
  jobs_updated: number;
  jobs_unchanged: number;
  jobs_seen: number;
  jobs_stale: number;
  jobs_expired: number;
  jobs_deduplicated: number;
  error_count: number;
  sample_new_job_ids: string[];
  sample_updated_job_ids: string[];
  sample_expired_job_ids: string[];
  created_at: string;
}

export function useJobSources() {
  return useQuery({
    queryKey: ["job-sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_sources")
        .select("*")
        .order("is_priority_source", { ascending: false })
        .order("company_name");

      if (error) throw error;
      return data as unknown as JobSource[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useIngestionLogs(sourceId?: string, limit = 50) {
  return useQuery({
    queryKey: ["ingestion-logs", sourceId, limit],
    queryFn: async () => {
      let query = supabase
        .from("ingestion_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(limit);

      if (sourceId) {
        query = query.eq("source_id", sourceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as IngestionLog[];
    },
  });
}

export function useIngestionRuns(limit = 50) {
  return useQuery({
    queryKey: ["ingestion-runs", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ingestion_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as unknown as IngestionRun[];
    },
    refetchInterval: 30000,
  });
}

export function useFreshnessStats() {
  return useQuery({
    queryKey: ["freshness-stats"],
    queryFn: async () => {
      // Get source refresh stats
      const { data: sources } = await supabase
        .from("job_sources")
        .select("id, last_success_at, status")
        .eq("status", "active");

      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const sourcesRefreshed = sources?.filter(s => s.last_success_at && s.last_success_at > twoHoursAgo).length || 0;
      const totalActiveSources = sources?.length || 0;

      // Get job age percentiles (approximate using posted_date)
      const { data: recentJobs } = await supabase
        .from("jobs")
        .select("first_seen_at")
        .not("first_seen_at", "is", null)
        .order("first_seen_at", { ascending: false })
        .limit(1000);

      let p50AgeMinutes = 0;
      let p90AgeMinutes = 0;
      
      if (recentJobs && recentJobs.length > 0) {
        const ages = recentJobs.map(j => {
          const age = Date.now() - new Date(j.first_seen_at).getTime();
          return age / (1000 * 60); // Convert to minutes
        });
        ages.sort((a, b) => a - b);
        
        const p50Index = Math.floor(ages.length * 0.5);
        const p90Index = Math.floor(ages.length * 0.9);
        p50AgeMinutes = Math.round(ages[p50Index] || 0);
        p90AgeMinutes = Math.round(ages[p90Index] || 0);
      }

      // Get verification status counts
      const { count: activeCount } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("verification_status", "verified_active");

      const { count: staleCount } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("verification_status", "stale");

      const { count: expiredCount } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("verification_status", "expired");

      return {
        sourcesRefreshedPct: totalActiveSources > 0 ? Math.round((sourcesRefreshed / totalActiveSources) * 100) : 0,
        sourcesRefreshed,
        totalActiveSources,
        p50AgeMinutes,
        p90AgeMinutes,
        activeJobs: activeCount || 0,
        staleJobs: staleCount || 0,
        expiredJobs: expiredCount || 0,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useTriggerIngestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params?: { source_id?: string; source_type?: string; limit?: number }) => {
      const { data, error } = await supabase.functions.invoke("job-ingestion", {
        body: params || {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-sources"] });
      queryClient.invalidateQueries({ queryKey: ["ingestion-logs"] });
      queryClient.invalidateQueries({ queryKey: ["ingestion-runs"] });
      queryClient.invalidateQueries({ queryKey: ["freshness-stats"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useTriggerClassification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params?: { job_id?: string; limit?: number }) => {
      const { data, error } = await supabase.functions.invoke("job-classify", {
        body: params || {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useTriggerVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params?: { job_id?: string; limit?: number }) => {
      const { data, error } = await supabase.functions.invoke("job-verify", {
        body: params || {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["freshness-stats"] });
    },
  });
}

export function useTriggerLogoResolver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params?: { job_id?: string; batch_size?: number; check_broken?: boolean }) => {
      const { data, error } = await supabase.functions.invoke("logo-resolver", {
        body: params || { batch_size: 200 },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useUpdateSourceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "paused" | "failing" | "disabled" }) => {
      const { error } = await supabase
        .from("job_sources")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-sources"] });
    },
  });
}

export function useJobStats() {
  return useQuery({
    queryKey: ["job-stats"],
    queryFn: async () => {
      const [totalResult, pendingAiResult, verifiedResult, freshResult, logoResult] = await Promise.all([
        supabase.from("jobs").select("id", { count: "exact", head: true }),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("ai_classification_done", false),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("verification_status", "verified_active"),
        supabase.from("jobs").select("id", { count: "exact", head: true }).gte("first_seen_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from("jobs").select("id", { count: "exact", head: true }).not("company_logo_url", "is", null),
      ]);

      return {
        total: totalResult.count || 0,
        pendingAi: pendingAiResult.count || 0,
        verified: verifiedResult.count || 0,
        freshToday: freshResult.count || 0,
        withLogos: logoResult.count || 0,
        logoPercentage: totalResult.count ? Math.round(((logoResult.count || 0) / totalResult.count) * 100) : 0,
      };
    },
    refetchInterval: 30000,
  });
}
