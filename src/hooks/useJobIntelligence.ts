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
  success: boolean;
  error_message: string | null;
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
      const [totalResult, pendingAiResult, verifiedResult, freshResult] = await Promise.all([
        supabase.from("jobs").select("id", { count: "exact", head: true }),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("ai_classification_done", false),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("verification_status", "verified_active"),
        supabase.from("jobs").select("id", { count: "exact", head: true }).gte("first_seen_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);

      return {
        total: totalResult.count || 0,
        pendingAi: pendingAiResult.count || 0,
        verified: verifiedResult.count || 0,
        freshToday: freshResult.count || 0,
      };
    },
  });
}
