import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { JobFilters, JobFiltersState } from "@/components/jobs/JobFilters";
import { PremiumJobCard, PremiumJobCardSkeleton, EnhancedJobData } from "@/components/jobs/PremiumJobCard";
import { JobListCard, JobData } from "@/components/jobs/JobListCard";
import { PremiumJobDrawer } from "@/components/jobs/PremiumJobDrawer";
import { ActiveFiltersBar, ActiveFilter } from "@/components/jobs/ActiveFiltersBar";
import { JobFilterSettings } from "@/components/jobs/JobFilterSettings";
import { useAuth } from "@/hooks/useAuth";
import { useJobPreferences } from "@/hooks/useJobPreferences";
import { useJobInteractions } from "@/hooks/useJobInteractions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LayoutGrid, List, Search, EyeOff } from "lucide-react";
import { differenceInDays, differenceInHours } from "date-fns";

const initialFilters: JobFiltersState = {
  search: "",
  jobType: [],
  location: [],
  workMode: [],
  salaryMin: [],
  datePosted: [],
};

type ViewMode = "grid" | "list";

export default function Jobs() {
  const [jobs, setJobs] = useState<EnhancedJobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<JobFiltersState>(initialFilters);
  const [selectedJob, setSelectedJob] = useState<EnhancedJobData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showHidden, setShowHidden] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const { filterJobs, preferences } = useJobPreferences();
  const { 
    setJobStatus, 
    removeStatus, 
    getJobStatus, 
    isHidden, 
    isSaved,
  } = useJobInteractions();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select("*, company_logo_url, company_domain, logo_source, ai_summary, ai_tech_stack, ai_responsibilities, ai_qualifications, ai_benefits, ai_visa_info, is_verified, is_trending")
      .order("freshness_rank", { ascending: false })
      .order("overall_rank_score", { ascending: false })
      .limit(100);

    if (error) {
      toast({ title: "Error loading jobs", description: error.message, variant: "destructive" });
    } else {
      setJobs((data as EnhancedJobData[]) || []);
    }
    setLoading(false);
  };

  const handleSaveJob = async (jobId: string) => {
    const currentStatus = getJobStatus(jobId);
    if (currentStatus === "saved") {
      await removeStatus(jobId);
    } else {
      await setJobStatus(jobId, "saved");
    }
  };

  const handleApplyJob = async (jobId: string) => {
    await setJobStatus(jobId, "applied");
  };

  const handleGenerateResume = (job: EnhancedJobData) => {
    navigate("/resume", { state: { job } });
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  const buildActiveFilters = (): ActiveFilter[] => {
    const activeFilters: ActiveFilter[] = [];

    if (filters.search) {
      activeFilters.push({
        key: "search",
        value: filters.search,
        label: `"${filters.search}"`,
        color: "",
      });
    }

    filters.jobType.forEach((v) => {
      activeFilters.push({
        key: "jobType",
        value: v,
        label: v.charAt(0).toUpperCase() + v.slice(1),
        color: "",
      });
    });

    filters.location.forEach((v) => {
      activeFilters.push({
        key: "location",
        value: v,
        label: v,
        color: "",
      });
    });

    filters.workMode.forEach((v) => {
      activeFilters.push({
        key: "workMode",
        value: v,
        label: v.charAt(0).toUpperCase() + v.slice(1),
        color: "",
      });
    });

    filters.datePosted.forEach((v) => {
      const labels: Record<string, string> = {
        "24h": "Past 24h",
        "3d": "Past 3d",
        "7d": "Past week",
        "30d": "Past month",
      };
      activeFilters.push({
        key: "datePosted",
        value: v,
        label: labels[v] || v,
        color: "",
      });
    });

    return activeFilters;
  };

  const handleRemoveFilter = (key: string, value: string) => {
    if (key === "search") {
      setFilters((prev) => ({ ...prev, search: "" }));
    } else {
      setFilters((prev) => ({
        ...prev,
        [key]: (prev[key as keyof JobFiltersState] as string[]).filter((v) => v !== value),
      }));
    }
  };

  const filteredJobs = useMemo(() => {
    let result = filterJobs(jobs);
    
    if (!showHidden) {
      result = result.filter((job) => !isHidden(job.id));
    }
    
    return result.filter((job) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          job.title.toLowerCase().includes(searchLower) ||
          job.company.toLowerCase().includes(searchLower) ||
          job.description.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      const jobTypeFilters = Array.isArray(filters.jobType) ? filters.jobType : [];
      if (jobTypeFilters.length > 0) {
        const jobWorkType = job.work_type.toLowerCase().replace("-", "").replace(" ", "");
        const matches = jobTypeFilters.some((t) => {
          const filterType = t.toLowerCase().replace("-", "").replace(" ", "");
          return jobWorkType.includes(filterType) || filterType.includes(jobWorkType);
        });
        if (!matches) return false;
      }

      const workModeFilters = Array.isArray(filters.workMode) ? filters.workMode : [];
      if (workModeFilters.length > 0) {
        const jobWorkType = job.work_type.toLowerCase();
        const matches = workModeFilters.some((m) => jobWorkType.includes(m.toLowerCase()));
        if (!matches) return false;
      }

      const salaryFilters = Array.isArray(filters.salaryMin) ? filters.salaryMin : [];
      if (salaryFilters.length > 0 && job.salary_min) {
        const minRequired = Math.min(...salaryFilters.map((s) => parseInt(s)));
        if (job.salary_min < minRequired) return false;
      }

      const dateFilters = Array.isArray(filters.datePosted) ? filters.datePosted : [];
      if (dateFilters.length > 0) {
        const postedDate = job.posted_date ? new Date(job.posted_date) : new Date(job.created_at);
        const now = new Date();
        const hoursAgo = differenceInHours(now, postedDate);
        const daysAgo = differenceInDays(now, postedDate);

        const matches = dateFilters.some((d) => {
          if (d === "24h") return hoursAgo <= 24;
          if (d === "3d") return daysAgo <= 3;
          if (d === "7d") return daysAgo <= 7;
          if (d === "30d") return daysAgo <= 30;
          return true;
        });
        if (!matches) return false;
      }

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
  }, [jobs, filters, filterJobs, isHidden, showHidden]);

  const newJobsCount = jobs.filter((j) => {
    const postedDate = j.posted_date ? new Date(j.posted_date) : new Date(j.created_at);
    return differenceInHours(new Date(), postedDate) <= 24;
  }).length;

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Jobs</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${filteredJobs.length} opportunities`}
            {!loading && newJobsCount > 0 && (
              <span className="text-primary ml-1">· {newJobsCount} new today</span>
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <JobFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={handleClearFilters}
            />
          </div>
          <JobFilterSettings />
        </div>

        {/* Active filters */}
        <ActiveFiltersBar
          filters={buildActiveFilters()}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearFilters}
        />

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {filteredJobs.length} of {jobs.length}
            </span>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch
                checked={showHidden}
                onCheckedChange={setShowHidden}
                className="scale-90"
              />
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <EyeOff className="h-3.5 w-3.5" />
                Hidden
              </span>
            </label>
          </div>
          <div className="flex items-center gap-1 p-0.5 bg-secondary rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid" 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list" 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Job Grid/List */}
        {loading ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
            {Array.from({ length: 9 }).map((_, i) => (
              <PremiumJobCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-base font-medium mb-1">No jobs found</h3>
            <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters</p>
            <Button onClick={handleClearFilters} variant="outline" size="sm" className="rounded-lg">
              Clear filters
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => (
              <PremiumJobCard
                key={job.id}
                job={job}
                isSaved={isSaved(job.id)}
                onSave={handleSaveJob}
                onClick={() => {
                  setSelectedJob(job);
                  setDrawerOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <JobListCard
                key={job.id}
                job={job}
                isSaved={isSaved(job.id)}
                onSave={handleSaveJob}
                onApply={handleApplyJob}
                onGenerateResume={handleGenerateResume}
                onClick={() => {
                  setSelectedJob(job);
                  setDrawerOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <PremiumJobDrawer
        job={selectedJob}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        isSaved={selectedJob ? isSaved(selectedJob.id) : false}
        onSave={handleSaveJob}
        onApply={handleApplyJob}
        onGenerateResume={handleGenerateResume}
      />
    </DashboardLayout>
  );
}
