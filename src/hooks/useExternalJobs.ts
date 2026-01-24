import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { JobData } from "@/components/jobs/JobListCard";

interface FetchJobsOptions {
  query?: string;
  location?: string;
}

export function useExternalJobs() {
  const [loading, setLoading] = useState(false);
  const [externalJobs, setExternalJobs] = useState<JobData[]>([]);

  const fetchExternalJobs = async (options: FetchJobsOptions = {}) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-jobs", {
        body: {
          query: options.query || "software engineer internship",
          location: options.location || "",
        },
      });

      if (error) {
        console.error("Error fetching external jobs:", error);
        toast({
          title: "Error fetching jobs",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }

      if (!data.success) {
        console.error("Firecrawl error:", data.error);
        toast({
          title: "Error fetching jobs",
          description: data.error || "Failed to fetch jobs from external sources",
          variant: "destructive",
        });
        return [];
      }

      // Convert external jobs to JobData format
      const jobs: JobData[] = (data.jobs || []).map((job: any, index: number) => ({
        id: `external-${Date.now()}-${index}`,
        title: job.title,
        company: job.company,
        location: job.location,
        work_type: job.work_type,
        salary_min: null,
        salary_max: null,
        description: job.description,
        requirements: job.requirements || [],
        logo_url: job.logo_url || null,
        created_at: job.posted_date || new Date().toISOString(),
        apply_url: job.apply_url,
        source: "external",
        posted_date: job.posted_date,
      }));

      setExternalJobs(jobs);
      return jobs;
    } catch (err) {
      console.error("Failed to fetch external jobs:", err);
      toast({
        title: "Error",
        description: "Failed to connect to job search service",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    externalJobs,
    loading,
    fetchExternalJobs,
  };
}