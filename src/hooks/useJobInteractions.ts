import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export type JobAction = "saved" | "applied" | "rejected" | "interview" | "hidden";

export interface JobInteraction {
  id: string;
  job_id: string;
  user_id: string;
  action: JobAction;
  created_at: string;
}

export function useJobInteractions() {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<Map<string, JobAction>>(new Map());
  const [loading, setLoading] = useState(true);

  const fetchInteractions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_job_interactions")
        .select("job_id, action")
        .eq("user_id", user.id);

      if (error) throw error;

      // Build a map of job_id -> most recent action
      const interactionMap = new Map<string, JobAction>();
      (data || []).forEach((item) => {
        // Only track certain actions (prioritize hidden > interview > rejected > applied > saved)
        const current = interactionMap.get(item.job_id);
        const priority: Record<JobAction, number> = {
          hidden: 5,
          interview: 4,
          rejected: 3,
          applied: 2,
          saved: 1,
        };
        
        if (!current || priority[item.action as JobAction] > priority[current]) {
          interactionMap.set(item.job_id, item.action as JobAction);
        }
      });

      setInteractions(interactionMap);
    } catch (err) {
      console.error("Error fetching interactions:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  const setJobStatus = useCallback(
    async (jobId: string, action: JobAction) => {
      if (!user) return;

      try {
        // First remove existing interactions for this job
        await supabase
          .from("user_job_interactions")
          .delete()
          .eq("user_id", user.id)
          .eq("job_id", jobId);

        // Insert new interaction
        const { error } = await supabase.from("user_job_interactions").insert({
          user_id: user.id,
          job_id: jobId,
          action,
        });

        if (error) throw error;

        setInteractions((prev) => new Map(prev).set(jobId, action));

        const messages: Record<JobAction, string> = {
          saved: "Job saved!",
          applied: "Marked as applied",
          rejected: "Marked as rejected",
          interview: "Marked as interview",
          hidden: "Job hidden",
        };
        toast({ title: messages[action] });
      } catch (err) {
        console.error("Error setting job status:", err);
        toast({
          title: "Error updating job status",
          variant: "destructive",
        });
      }
    },
    [user]
  );

  const removeStatus = useCallback(
    async (jobId: string) => {
      if (!user) return;

      try {
        await supabase
          .from("user_job_interactions")
          .delete()
          .eq("user_id", user.id)
          .eq("job_id", jobId);

        setInteractions((prev) => {
          const next = new Map(prev);
          next.delete(jobId);
          return next;
        });

        toast({ title: "Status removed" });
      } catch (err) {
        console.error("Error removing status:", err);
      }
    },
    [user]
  );

  const getJobStatus = useCallback(
    (jobId: string): JobAction | null => {
      return interactions.get(jobId) || null;
    },
    [interactions]
  );

  const isHidden = useCallback(
    (jobId: string): boolean => {
      return interactions.get(jobId) === "hidden";
    },
    [interactions]
  );

  const isSaved = useCallback(
    (jobId: string): boolean => {
      return interactions.get(jobId) === "saved";
    },
    [interactions]
  );

  // Get all jobs with a specific status
  const getJobsByStatus = useCallback(
    (status: JobAction): string[] => {
      return Array.from(interactions.entries())
        .filter(([_, action]) => action === status)
        .map(([jobId]) => jobId);
    },
    [interactions]
  );

  return {
    interactions,
    loading,
    setJobStatus,
    removeStatus,
    getJobStatus,
    isHidden,
    isSaved,
    getJobsByStatus,
    refetch: fetchInteractions,
  };
}
