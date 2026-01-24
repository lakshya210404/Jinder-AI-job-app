import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { JobFilters, JobFiltersState } from "@/components/jobs/JobFilters";
import { JobListCard, JobData } from "@/components/jobs/JobListCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const initialFilters: JobFiltersState = {
  search: "",
  jobType: "all",
  location: "all",
  workMode: "all",
  salaryMin: "all",
  datePosted: "all",
};

export default function Jobs() {
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<JobFiltersState>(initialFilters);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchJobs();
      fetchSavedJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading jobs", description: error.message, variant: "destructive" });
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  };

  const fetchSavedJobs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_job_interactions")
      .select("job_id")
      .eq("user_id", user.id)
      .eq("action", "saved");

    if (data) {
      setSavedJobs(new Set(data.map((d) => d.job_id)));
    }
  };

  const handleSaveJob = async (jobId: string) => {
    if (!user) return;

    const isSaved = savedJobs.has(jobId);

    if (isSaved) {
      await supabase
        .from("user_job_interactions")
        .delete()
        .eq("user_id", user.id)
        .eq("job_id", jobId)
        .eq("action", "saved");

      setSavedJobs((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
      toast({ title: "Job removed from saved" });
    } else {
      await supabase.from("user_job_interactions").insert({
        user_id: user.id,
        job_id: jobId,
        action: "saved",
      });

      setSavedJobs((prev) => new Set(prev).add(jobId));
      toast({ title: "Job saved!" });
    }
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

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  // Apply filters
  const filteredJobs = jobs.filter((job) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (filters.jobType !== "all" && job.work_type.toLowerCase() !== filters.jobType) {
      return false;
    }

    if (filters.salaryMin !== "all" && job.salary_min) {
      if (job.salary_min < parseInt(filters.salaryMin)) return false;
    }

    return true;
  });

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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Browse Jobs</h1>
          <p className="text-muted-foreground mt-1">
            Find your perfect role from {jobs.length} available positions
          </p>
        </div>

        {/* Filters */}
        <JobFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
        />

        {/* Job List */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="apple-card p-5">
                <div className="flex gap-4">
                  <Skeleton className="w-14 h-14 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No jobs found matching your criteria.</p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <JobListCard
                key={job.id}
                job={job}
                isSaved={savedJobs.has(job.id)}
                onSave={handleSaveJob}
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