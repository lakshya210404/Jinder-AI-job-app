import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { JobFilters, JobFiltersState } from "@/components/jobs/JobFilters";
import { PremiumJobCard, PremiumJobCardSkeleton, EnhancedJobData } from "@/components/jobs/PremiumJobCard";
import { JobListCard, JobData } from "@/components/jobs/JobListCard";
import { PremiumJobDrawer } from "@/components/jobs/PremiumJobDrawer";
import { ActiveFiltersBar, ActiveFilter } from "@/components/jobs/ActiveFiltersBar";
import { JobFilterSettings } from "@/components/jobs/JobFilterSettings";
import { JobStatusActions } from "@/components/jobs/JobStatusActions";
import { useAuth } from "@/hooks/useAuth";
import { useJobPreferences } from "@/hooks/useJobPreferences";
import { useJobInteractions } from "@/hooks/useJobInteractions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LayoutGrid, List, Sparkles, TrendingUp, Clock, CheckCircle2, EyeOff } from "lucide-react";
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
  
  // Use the new hooks
  const { filterJobs, preferences } = useJobPreferences();
  const { 
    setJobStatus, 
    removeStatus, 
    getJobStatus, 
    isHidden, 
    isSaved,
    interactions 
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

  // Handle status changes
  const handleStatusChange = async (jobId: string, status: "saved" | "applied" | "rejected" | "interview" | "hidden") => {
    await setJobStatus(jobId, status);
  };

  const handleRemoveStatus = async (jobId: string) => {
    await removeStatus(jobId);
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

  // Build active filters for the bar
  const buildActiveFilters = (): ActiveFilter[] => {
    const activeFilters: ActiveFilter[] = [];
    const filterColors: Record<string, string> = {
      search: "bg-purple/15 text-purple border-purple/30",
      jobType: "bg-orange/15 text-orange border-orange/30",
      location: "bg-teal/15 text-teal border-teal/30",
      workMode: "bg-blue/15 text-blue border-blue/30",
      salaryMin: "bg-green/15 text-green border-green/30",
      datePosted: "bg-pink/15 text-pink border-pink/30",
    };

    if (filters.search) {
      activeFilters.push({
        key: "search",
        value: filters.search,
        label: `"${filters.search}"`,
        color: filterColors.search,
      });
    }

    filters.jobType.forEach((v) => {
      activeFilters.push({
        key: "jobType",
        value: v,
        label: v.charAt(0).toUpperCase() + v.slice(1),
        color: filterColors.jobType,
      });
    });

    filters.location.forEach((v) => {
      activeFilters.push({
        key: "location",
        value: v,
        label: v,
        color: filterColors.location,
      });
    });

    filters.workMode.forEach((v) => {
      activeFilters.push({
        key: "workMode",
        value: v,
        label: v.charAt(0).toUpperCase() + v.slice(1),
        color: filterColors.workMode,
      });
    });

    filters.datePosted.forEach((v) => {
      const labels: Record<string, string> = {
        "24h": "Past 24 hours",
        "3d": "Past 3 days",
        "7d": "Past week",
        "30d": "Past month",
      };
      activeFilters.push({
        key: "datePosted",
        value: v,
        label: labels[v] || v,
        color: filterColors.datePosted,
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

  // Apply filters + user preferences + hidden status
  const filteredJobs = useMemo(() => {
    // First apply user preference keyword filters
    let result = filterJobs(jobs);
    
    // Filter out hidden jobs unless showHidden is true
    if (!showHidden) {
      result = result.filter((job) => !isHidden(job.id));
    }
    
    // Then apply UI filters
    return result.filter((job) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          job.title.toLowerCase().includes(searchLower) ||
          job.company.toLowerCase().includes(searchLower) ||
          job.description.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Job type filter
      const jobTypeFilters = Array.isArray(filters.jobType) ? filters.jobType : [];
      if (jobTypeFilters.length > 0) {
        const jobWorkType = job.work_type.toLowerCase().replace("-", "").replace(" ", "");
        const matches = jobTypeFilters.some((t) => {
          const filterType = t.toLowerCase().replace("-", "").replace(" ", "");
          return jobWorkType.includes(filterType) || filterType.includes(jobWorkType);
        });
        if (!matches) return false;
      }

      // Work mode filter
      const workModeFilters = Array.isArray(filters.workMode) ? filters.workMode : [];
      if (workModeFilters.length > 0) {
        const jobWorkType = job.work_type.toLowerCase();
        const matches = workModeFilters.some((m) => jobWorkType.includes(m.toLowerCase()));
        if (!matches) return false;
      }

      // Salary filter
      const salaryFilters = Array.isArray(filters.salaryMin) ? filters.salaryMin : [];
      if (salaryFilters.length > 0 && job.salary_min) {
        const minRequired = Math.min(...salaryFilters.map((s) => parseInt(s)));
        if (job.salary_min < minRequired) return false;
      }

      // Date posted filter
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

      // Location filter
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

  // Stats for header
  const freshJobsCount = jobs.filter((j) => {
    const postedDate = j.posted_date ? new Date(j.posted_date) : new Date(j.created_at);
    return differenceInHours(new Date(), postedDate) <= 24;
  }).length;

  const verifiedJobsCount = jobs.filter((j) => (j as any).verification_status === "verified_active").length;

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Internships & Jobs</h1>
            <p className="text-muted-foreground mt-1">
              {loading ? "Loading..." : `${filteredJobs.length} opportunities from top companies`}
            </p>
          </div>

          {/* Stats badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1.5 rounded-full px-3 py-1.5 bg-green/10 text-green border-green/30">
              <Sparkles className="h-3.5 w-3.5" />
              {freshJobsCount} new today
            </Badge>
            <Badge variant="outline" className="gap-1.5 rounded-full px-3 py-1.5 bg-blue/10 text-blue border-blue/30">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {verifiedJobsCount} verified
            </Badge>
            <Badge variant="outline" className="gap-1.5 rounded-full px-3 py-1.5 bg-orange/10 text-orange border-orange/30">
              <TrendingUp className="h-3.5 w-3.5" />
              {jobs.length} total
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <JobFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={handleClearFilters}
            />
          </div>
          <JobFilterSettings />
        </div>

        {/* Active filters bar */}
        <ActiveFiltersBar
          filters={buildActiveFilters()}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearFilters}
        />

        {/* View toggle and show hidden */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredJobs.length} of {jobs.length} jobs
            </p>
            <div className="flex items-center gap-2">
              <Switch
                id="show-hidden"
                checked={showHidden}
                onCheckedChange={setShowHidden}
              />
              <Label htmlFor="show-hidden" className="text-sm text-muted-foreground flex items-center gap-1.5">
                <EyeOff className="h-3.5 w-3.5" />
                Show hidden
              </Label>
            </div>
          </div>
          <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-md h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-md h-8 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Job Grid/List */}
        {loading ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
            {Array.from({ length: 9 }).map((_, i) => (
              <PremiumJobCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your filters or search terms</p>
            <Button onClick={handleClearFilters} variant="outline" className="rounded-full">
              Clear all filters
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
          <div className="space-y-4">
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

      {/* Premium Job Detail Drawer */}
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
