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

  const fetchExternalJobs = async (options: FetchJobsOptions = {}, retryCount = 0) => {
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
        // Retry on cold start timeout (up to 2 retries)
        if (retryCount < 2 && error.message?.includes("Failed to fetch")) {
          console.log(`Retrying fetch (attempt ${retryCount + 2})...`);
          return fetchExternalJobs(options, retryCount + 1);
        }
        toast({
          title: "Error fetching jobs",
          description: "Could not load external jobs. Try clicking 'Search Web' again.",
          variant: "destructive",
        });
        setLoading(false);
        return [];
      }

      if (!data.success) {
        console.error("Firecrawl error:", data.error);
        toast({
          title: "Error fetching jobs",
          description: data.error || "Failed to fetch jobs from external sources",
          variant: "destructive",
        });
        setLoading(false);
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
      if (jobs.length > 0) {
        toast({
          title: `Found ${jobs.length} jobs`,
          description: "Real job postings from the web",
        });
      }
      setLoading(false);
      return jobs;
    } catch (err) {
      console.error("Failed to fetch external jobs:", err);
      // Retry on network errors
      if (retryCount < 2) {
        console.log(`Retrying fetch (attempt ${retryCount + 2})...`);
        return fetchExternalJobs(options, retryCount + 1);
      }
      toast({
        title: "Error",
        description: "Failed to connect to job search service. Try again.",
        variant: "destructive",
      });
      setLoading(false);
      return [];
    }
  };

  return {
    externalJobs,
    loading,
    fetchExternalJobs,
  };
}