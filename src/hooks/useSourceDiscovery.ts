import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DiscoveredSource {
  id: string;
  name: string;
  company_name: string;
  source_type: string;
  base_url: string;
  api_endpoint: string | null;
  domain: string | null;
  country_code: string;
  language: string;
  discovery_method: string;
  validation_status: string;
  validation_error: string | null;
  sample_job_count: number;
  sample_jobs: any;
  has_valid_apply_urls: boolean | null;
  quality_score: number;
  is_duplicate: boolean;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  submitted_by: string | null;
  submission_url: string | null;
  created_at: string;
}

export interface DiscoveryRun {
  id: string;
  run_type: string;
  country_code: string | null;
  target_ats: string | null;
  query_used: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  status: string;
  error_message: string | null;
  sources_discovered: number;
  sources_validated: number;
  sources_duplicate: number;
  sources_approved: number;
  created_at: string;
}

export interface CountrySeed {
  id: string;
  country_code: string;
  country_name: string;
  language: string;
  top_cities: string[];
  industries: string[];
  is_active: boolean;
  priority: number;
  last_seeded_at: string | null;
  sources_found: number;
}

export interface SourceSubmission {
  id: string;
  user_id: string;
  url: string;
  detected_ats_type: string | null;
  detected_company_name: string | null;
  status: string;
  credits_awarded: number;
  created_at: string;
}

export function useDiscoveredSources(status?: string) {
  return useQuery({
    queryKey: ["discovered-sources", status],
    queryFn: async () => {
      let query = supabase
        .from("discovered_sources")
        .select("*")
        .order("quality_score", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);

      if (status) {
        query = query.eq("validation_status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as DiscoveredSource[];
    },
    refetchInterval: 15000,
  });
}

export function useDiscoveryRuns() {
  return useQuery({
    queryKey: ["discovery-runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discovery_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as unknown as DiscoveryRun[];
    },
    refetchInterval: 15000,
  });
}

export function useCountrySeeds() {
  return useQuery({
    queryKey: ["country-seeds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("country_seeds")
        .select("*")
        .order("priority", { ascending: true })
        .order("country_name");

      if (error) throw error;
      return data as unknown as CountrySeed[];
    },
  });
}

export function useSourceSubmissions() {
  return useQuery({
    queryKey: ["source-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("source_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as unknown as SourceSubmission[];
    },
  });
}

export function useDiscoveryStats() {
  return useQuery({
    queryKey: ["discovery-stats"],
    queryFn: async () => {
      const [totalSources, activeSources, discoveredPending, discoveredValidated, countries] = await Promise.all([
        supabase.from("job_sources").select("id", { count: "exact", head: true }),
        supabase.from("job_sources").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("discovered_sources").select("id", { count: "exact", head: true }).eq("validation_status", "pending"),
        supabase.from("discovered_sources").select("id", { count: "exact", head: true }).eq("validation_status", "validated"),
        supabase.from("job_sources").select("country_code").not("country_code", "is", null),
      ]);

      const uniqueCountries = new Set(countries.data?.map((c: any) => c.country_code) || []);

      return {
        totalSources: totalSources.count || 0,
        activeSources: activeSources.count || 0,
        pendingReview: discoveredPending.count || 0,
        validatedReady: discoveredValidated.count || 0,
        countriesCovered: uniqueCountries.size,
      };
    },
    refetchInterval: 30000,
  });
}

export function useTriggerDiscovery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params?: { ats_types?: string[]; country_code?: string; auto_approve?: boolean; limit?: number }) => {
      const { data, error } = await supabase.functions.invoke("source-discovery", {
        body: { action: "discover", ...params },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discovered-sources"] });
      queryClient.invalidateQueries({ queryKey: ["discovery-runs"] });
      queryClient.invalidateQueries({ queryKey: ["discovery-stats"] });
      queryClient.invalidateQueries({ queryKey: ["job-sources"] });
    },
  });
}

export function useApproveSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sourceId, approve }: { sourceId: string; approve: boolean }) => {
      if (approve) {
        // Get the discovered source
        const { data: source, error: fetchError } = await supabase
          .from("discovered_sources")
          .select("*")
          .eq("id", sourceId)
          .single();

        if (fetchError || !source) throw new Error("Source not found");

        // Insert into job_sources
        const { error: insertError } = await supabase.from("job_sources").insert({
          name: source.name,
          company_name: source.company_name,
          source_type: source.source_type as any,
          base_url: source.base_url,
          api_endpoint: source.api_endpoint,
          status: "active" as any,
          poll_interval_minutes: 60,
        } as any);

        if (insertError) throw insertError;
      }

      // Update discovered source status
      const { error } = await supabase
        .from("discovered_sources")
        .update({
          validation_status: approve ? "approved" : "rejected",
          reviewed_at: new Date().toISOString(),
          review_notes: approve ? "Manually approved by admin" : "Rejected by admin",
        })
        .eq("id", sourceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discovered-sources"] });
      queryClient.invalidateQueries({ queryKey: ["discovery-stats"] });
      queryClient.invalidateQueries({ queryKey: ["job-sources"] });
    },
  });
}

export function useBulkApprove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ minQuality = 60, limit = 500 }: { minQuality?: number; limit?: number }) => {
      const { data: sources, error: fetchError } = await supabase
        .from("discovered_sources")
        .select("*")
        .eq("validation_status", "validated")
        .gte("quality_score", minQuality)
        .is("reviewed_at", null)
        .order("quality_score", { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;
      if (!sources || sources.length === 0) return { approved: 0 };

      let approved = 0;
      for (const source of sources) {
        const { error } = await supabase.from("job_sources").insert({
          name: source.name,
          company_name: source.company_name,
          source_type: source.source_type as any,
          base_url: source.base_url,
          api_endpoint: source.api_endpoint,
          status: "active" as any,
          poll_interval_minutes: 60,
        } as any);

        if (!error) {
          await supabase
            .from("discovered_sources")
            .update({
              validation_status: "approved",
              reviewed_at: new Date().toISOString(),
              review_notes: `Bulk approved (quality >= ${minQuality})`,
            })
            .eq("id", source.id);
          approved++;
        }
      }

      return { approved };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discovered-sources"] });
      queryClient.invalidateQueries({ queryKey: ["discovery-stats"] });
      queryClient.invalidateQueries({ queryKey: ["job-sources"] });
    },
  });
}

export function useSubmitSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (url: string) => {
      const { data, error } = await supabase.functions.invoke("source-discovery", {
        body: { action: "submit", url },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["source-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["discovered-sources"] });
    },
  });
}
