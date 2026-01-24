import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { JobFilters, JobFiltersState } from "@/components/jobs/JobFilters";
import { JobListCard, JobData } from "@/components/jobs/JobListCard";
import { JobDetailDrawer } from "@/components/jobs/JobDetailDrawer";
import { useAuth } from "@/hooks/useAuth";
import { useExternalJobs } from "@/hooks/useExternalJobs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const initialFilters: JobFiltersState = {
  search: "",
  jobType: [],
  location: [],
  workMode: [],
  salaryMin: [],
  datePosted: [],
};

export default function Jobs() {
  const [dbJobs, setDbJobs] = useState<JobData[]>([]);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<JobFiltersState>(initialFilters);
  const [selectedJob, setSelectedJob] = useState<JobData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { externalJobs, loading: externalLoading, fetchExternalJobs } = useExternalJobs();

  // Combine jobs (show web results first so they're immediately visible)
  const jobs = [...externalJobs, ...dbJobs];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDbJobs();
      fetchSavedJobs();
      // Auto-fetch external jobs on initial load
      fetchExternalJobs({ query: "software engineer internship" });
    }
  }, [user]);

  const fetchDbJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading jobs", description: error.message, variant: "destructive" });
    } else {
      setDbJobs((data as JobData[]) || []);
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

  // Apply filters with defensive guards for array types
  const filteredJobs = jobs.filter((job) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Job type filter (multi-select) - ensure array
    const jobTypeFilters = Array.isArray(filters.jobType) ? filters.jobType : [];
    if (jobTypeFilters.length > 0) {
      const jobWorkType = job.work_type.toLowerCase().replace("-", "").replace(" ", "");
      const matches = jobTypeFilters.some((t) => {
        const filterType = t.toLowerCase().replace("-", "").replace(" ", "");
        return jobWorkType.includes(filterType) || filterType.includes(jobWorkType);
      });
      if (!matches) return false;
    }

    // Work mode filter (multi-select) - ensure array
    const workModeFilters = Array.isArray(filters.workMode) ? filters.workMode : [];
    if (workModeFilters.length > 0) {
      const jobWorkType = job.work_type.toLowerCase();
      const matches = workModeFilters.some((m) => jobWorkType.includes(m.toLowerCase()));
      if (!matches) return false;
    }

    // Salary filter (multi-select) - ensure array
    const salaryFilters = Array.isArray(filters.salaryMin) ? filters.salaryMin : [];
    if (salaryFilters.length > 0 && job.salary_min) {
      const minRequired = Math.min(...salaryFilters.map((s) => parseInt(s)));
      if (job.salary_min < minRequired) return false;
    }

    // Location filter (multi-select) - ensure array
    const locationFilters = Array.isArray(filters.location) ? filters.location : [];
    if (locationFilters.length > 0) {
      const jobLocation = job.location.toLowerCase();
      const matches = locationFilters.some((loc) => {
        const locLower = loc.toLowerCase();
        return jobLocation.includes(locLower) || locLower.includes(jobLocation);
      });
      if (!matches) return false;
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

  const handleRefreshExternalJobs = () => {
    const searchQuery = filters.search || "software engineer internship";
    const locationQuery = Array.isArray(filters.location) ? filters.location.join(" ") : "";
    fetchExternalJobs({ query: searchQuery, location: locationQuery });
  };

  const filteredWebJobsCount = filteredJobs.filter((j) => j.source === "external").length;

  const isLoading = loading || externalLoading;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Browse Jobs</h1>
            <p className="text-muted-foreground mt-1">
              {isLoading ? "Searching for jobs..." : `Found ${filteredJobs.length} jobs from multiple sources`}
              {!isLoading && (
                <span className="block text-xs text-muted-foreground mt-1">
                  {filteredWebJobsCount} from the web • {filteredJobs.length - filteredWebJobsCount} from your database
                </span>
              )}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefreshExternalJobs}
            disabled={externalLoading}
            className="rounded-xl gap-2"
          >
            <Globe className={`h-4 w-4 text-blue ${externalLoading ? "animate-spin" : ""}`} />
            {externalLoading ? "Searching..." : "Search Web"}
          </Button>
        </div>

        {/* Filters */}
        <JobFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
        />

        {/* Job List */}
        <div className="space-y-4">
          {isLoading ? (
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
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No jobs found matching your criteria.</p>
              <Button onClick={handleRefreshExternalJobs} variant="outline" className="rounded-xl">
                Search for more jobs
              </Button>
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
                onClick={() => {
                  setSelectedJob(job);
                  setDrawerOpen(true);
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Job Detail Drawer */}
      <JobDetailDrawer
        job={selectedJob}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        isSaved={selectedJob ? savedJobs.has(selectedJob.id) : false}
        onSave={handleSaveJob}
        onApply={handleApplyJob}
        onGenerateResume={handleGenerateResume}
      />
    </DashboardLayout>
  );
}
