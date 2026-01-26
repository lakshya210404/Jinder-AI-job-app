import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface JobPreferences {
  id?: string;
  user_id: string;
  title_exclude: string[];
  title_include: string[];
  desc_exclude: string[];
  company_exclude: string[];
  preferred_locations: string[];
  work_type_filter: string[];
}

const defaultPreferences: Omit<JobPreferences, "user_id"> = {
  title_exclude: [],
  title_include: [],
  desc_exclude: [],
  company_exclude: [],
  preferred_locations: [],
  work_type_filter: [],
};

export function useJobPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<JobPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_job_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences(data as JobPreferences);
      } else {
        // Return default empty preferences if none exist
        setPreferences({
          ...defaultPreferences,
          user_id: user.id,
        });
      }
    } catch (err) {
      console.error("Error fetching job preferences:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const savePreferences = useCallback(
    async (newPreferences: Partial<JobPreferences>) => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("user_job_preferences")
          .upsert(
            {
              user_id: user.id,
              ...preferences,
              ...newPreferences,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          )
          .select()
          .single();

        if (error) throw error;

        setPreferences(data as JobPreferences);
        toast({ title: "Preferences saved" });
      } catch (err) {
        console.error("Error saving preferences:", err);
        toast({
          title: "Error saving preferences",
          variant: "destructive",
        });
      }
    },
    [user, preferences]
  );

  // Add a keyword to exclusion list
  const addExclusion = useCallback(
    async (type: "title" | "desc" | "company", keyword: string) => {
      if (!preferences) return;

      const key =
        type === "title"
          ? "title_exclude"
          : type === "desc"
          ? "desc_exclude"
          : "company_exclude";
      const current = preferences[key] || [];

      if (current.includes(keyword.toLowerCase())) {
        toast({ title: `"${keyword}" already excluded` });
        return;
      }

      await savePreferences({
        [key]: [...current, keyword.toLowerCase()],
      });
    },
    [preferences, savePreferences]
  );

  // Remove a keyword from exclusion list
  const removeExclusion = useCallback(
    async (type: "title" | "desc" | "company", keyword: string) => {
      if (!preferences) return;

      const key =
        type === "title"
          ? "title_exclude"
          : type === "desc"
          ? "desc_exclude"
          : "company_exclude";
      const current = preferences[key] || [];

      await savePreferences({
        [key]: current.filter((k) => k !== keyword.toLowerCase()),
      });
    },
    [preferences, savePreferences]
  );

  // Filter jobs based on preferences
  const filterJobs = useCallback(
    <T extends { title: string; company: string; description: string }>(
      jobs: T[]
    ): T[] => {
      if (!preferences) return jobs;

      return jobs.filter((job) => {
        const titleLower = job.title.toLowerCase();
        const descLower = job.description.toLowerCase();
        const companyLower = job.company.toLowerCase();

        // Check title exclusions
        if (preferences.title_exclude.length > 0) {
          const hasExcludedTitle = preferences.title_exclude.some((kw) =>
            titleLower.includes(kw)
          );
          if (hasExcludedTitle) return false;
        }

        // Check title inclusions (if set, at least one must match)
        if (preferences.title_include.length > 0) {
          const hasRequiredTitle = preferences.title_include.some((kw) =>
            titleLower.includes(kw)
          );
          if (!hasRequiredTitle) return false;
        }

        // Check description exclusions
        if (preferences.desc_exclude.length > 0) {
          const hasExcludedDesc = preferences.desc_exclude.some((kw) =>
            descLower.includes(kw)
          );
          if (hasExcludedDesc) return false;
        }

        // Check company exclusions
        if (preferences.company_exclude.length > 0) {
          const isExcludedCompany = preferences.company_exclude.some(
            (kw) => companyLower.includes(kw) || kw.includes(companyLower)
          );
          if (isExcludedCompany) return false;
        }

        return true;
      });
    },
    [preferences]
  );

  return {
    preferences,
    loading,
    savePreferences,
    addExclusion,
    removeExclusion,
    filterJobs,
    refetch: fetchPreferences,
  };
}
