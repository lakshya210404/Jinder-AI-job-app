import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { JobListCard, JobData } from "@/components/jobs/JobListCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { BookmarkX } from "lucide-react";

export default function SavedJobs() {
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSavedJobs();
    }
  }, [user]);

  const fetchSavedJobs = async () => {
    if (!user) return;
    setLoading(true);

    const { data: interactions, error: interactionsError } = await supabase
      .from("user_job_interactions")
      .select("job_id")
      .eq("user_id", user.id)
      .eq("action", "saved");

    if (interactionsError) {
      toast({ title: "Error loading saved jobs", variant: "destructive" });
      setLoading(false);
      return;
    }

    if (!interactions || interactions.length === 0) {
      setJobs([]);
      setLoading(false);
      return;
    }

    const jobIds = interactions.map((i) => i.job_id);

    const { data: jobsData, error: jobsError } = await supabase
      .from("jobs")
      .select("*")
      .in("id", jobIds);

    if (jobsError) {
      toast({ title: "Error loading jobs", variant: "destructive" });
    } else {
      setJobs(jobsData || []);
    }
    setLoading(false);
  };

  const handleUnsaveJob = async (jobId: string) => {
    if (!user) return;

    await supabase
      .from("user_job_interactions")
      .delete()
      .eq("user_id", user.id)
      .eq("job_id", jobId)
      .eq("action", "saved");

    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    toast({ title: "Job removed from saved" });
  };

  const handleApplyJob = async (jobId: string) => {
    if (!user) return;

    await supabase.from("user_job_interactions").insert({
      user_id: user.id,
      job_id: jobId,
      action: "applied",
    });

    toast({
      title: "Application submitted!",
      description: "Good luck with your application.",
    });
  };

  const handleGenerateResume = (job: JobData) => {
    navigate("/resume", { state: { job } });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Saved Jobs</h1>
          <p className="text-muted-foreground mt-1">
            {jobs.length} job{jobs.length !== 1 ? "s" : ""} saved for later
          </p>
        </div>

        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="apple-card p-5">
                <div className="flex gap-4">
                  <Skeleton className="w-14 h-14 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              </div>
            ))
          ) : jobs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto bg-secondary rounded-full flex items-center justify-center mb-4">
                <BookmarkX className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No saved jobs yet</h3>
              <p className="text-muted-foreground">
                Browse jobs and save the ones you're interested in.
              </p>
            </div>
          ) : (
            jobs.map((job) => (
              <JobListCard
                key={job.id}
                job={job}
                isSaved
                onSave={handleUnsaveJob}
                onApply={handleApplyJob}
                onGenerateResume={handleGenerateResume}
              />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}