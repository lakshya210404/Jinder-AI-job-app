import { useEffect } from "react";
import { MapPin, Briefcase, DollarSign, Calendar, Building2, ExternalLink, Bookmark, BookmarkCheck, Sparkles, Loader2, AlertCircle, CheckCircle2, GraduationCap, Globe, Gift, FileText, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { useScrapeJob } from "@/hooks/useScrapeJob";
import { CompanyLogo } from "./PremiumJobCard";
import { cn } from "@/lib/utils";
import type { EnhancedJobData } from "./PremiumJobCard";

interface PremiumJobDrawerProps {
  job: EnhancedJobData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaved?: boolean;
  onSave?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
  onGenerateResume?: (job: EnhancedJobData) => void;
}

export function PremiumJobDrawer({
  job,
  open,
  onOpenChange,
  isSaved = false,
  onSave,
  onApply,
  onGenerateResume,
}: PremiumJobDrawerProps) {
  const { scrapeJob, loading: scraping, error: scrapeError, result: scrapeResult, reset: resetScrape } = useScrapeJob();

  useEffect(() => {
    if (open && job?.source === "external" && job?.apply_url) {
      scrapeJob(job.apply_url);
    } else if (!open) {
      resetScrape();
    }
  }, [open, job?.id, job?.source, job?.apply_url, scrapeJob, resetScrape]);

  if (!job) return null;

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `$${(min / 1000).toFixed(0)}K – $${(max / 1000).toFixed(0)}K`;
    if (min) return `$${(min / 1000).toFixed(0)}K+`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}K`;
  };

  const salary = formatSalary(job.salary_min, job.salary_max);
  const postedAt = formatDistanceToNow(new Date(job.created_at), { addSuffix: true });
  const isVerified = job.is_verified || job.verification_status === "verified_active";
  const isVeryNew = () => {
    const postedDate = job.posted_date ? new Date(job.posted_date) : new Date(job.created_at);
    return differenceInHours(new Date(), postedDate) <= 6;
  };

  const getSourceLabel = () => {
    if (job.source === "greenhouse") return "Greenhouse";
    if (job.source === "lever") return "Lever";
    if (job.source === "external") return "Web";
    return "Careers";
  };

  const isExternalJob = job.source === "external";
  const hasScrapedContent = scrapeResult?.content && scrapeResult.content.length > 50;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col border-l">
        {/* Header */}
        <SheetHeader className="p-5 pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            <CompanyLogo 
              logoUrl={job.logo_url}
              companyLogoUrl={job.company_logo_url}
              companyDomain={job.company_domain}
              company={job.company}
              className="w-12 h-12"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <span className="font-medium">{job.company}</span>
                {isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
              </div>
              <SheetTitle className="text-lg font-semibold text-foreground leading-tight">
                {job.title}
              </SheetTitle>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.location}
                </span>
                <span>{postedAt}</span>
                {isVeryNew() && (
                  <span className="text-primary font-medium">New</span>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Actions */}
        <div className="flex items-center gap-2 p-4 border-b border-border bg-secondary/30">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 rounded-lg gap-1.5"
            onClick={() => onSave?.(job.id)}
          >
            {isSaved ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
            <span className="text-sm">{isSaved ? "Saved" : "Save"}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 rounded-lg gap-1.5"
            onClick={() => onGenerateResume?.(job)}
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-sm">Resume</span>
          </Button>
          <div className="flex-1" />
          {job.apply_url ? (
            <Button asChild className="h-9 px-4 rounded-lg">
              <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                Apply
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </Button>
          ) : (
            <Button onClick={() => onApply?.(job.id)} className="h-9 px-4 rounded-lg">
              Apply
            </Button>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-5 space-y-5">
            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-0.5">Location</p>
                <p className="text-sm font-medium">{job.location}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-0.5">Type</p>
                <p className="text-sm font-medium">{job.work_type}</p>
              </div>
              {salary && (
                <div className="p-3 rounded-lg bg-secondary/50 col-span-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Salary</p>
                  <p className="text-sm font-semibold text-foreground">{salary}</p>
                </div>
              )}
              {job.role_type && job.role_type !== "unknown" && (
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-0.5">Role</p>
                  <p className="text-sm font-medium capitalize">{job.role_type.replace("_", " ")}</p>
                </div>
              )}
              {job.ai_visa_info && (
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-0.5">Visa</p>
                  <p className="text-sm font-medium">{job.ai_visa_info}</p>
                </div>
              )}
            </div>

            {/* AI Summary */}
            {job.ai_summary && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs font-medium text-primary mb-1.5">Summary</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {job.ai_summary}
                </p>
              </div>
            )}

            {/* Tech Stack */}
            {(job.ai_tech_stack?.length || job.requirements?.length) && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {(job.ai_tech_stack || job.requirements || []).slice(0, 8).map((tech, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 text-xs bg-secondary rounded-md text-muted-foreground"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Responsibilities */}
            {job.ai_responsibilities && job.ai_responsibilities.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Responsibilities</h3>
                <ul className="space-y-2">
                  {job.ai_responsibilities.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Qualifications */}
            {job.ai_qualifications && job.ai_qualifications.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Requirements</h3>
                <ul className="space-y-2">
                  {job.ai_qualifications.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Benefits */}
            {job.ai_benefits && job.ai_benefits.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Benefits</h3>
                <div className="flex flex-wrap gap-1.5">
                  {job.ai_benefits.map((benefit, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 text-xs bg-secondary rounded-md text-muted-foreground"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</h3>
                {isExternalJob && scraping && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading...
                  </span>
                )}
              </div>

              {isExternalJob && scraping && !hasScrapedContent && (
                <div className="space-y-2 mb-3">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              )}

              {isExternalJob && scrapeError && !hasScrapedContent && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs mb-3">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Couldn't load full details.</span>
                </div>
              )}

              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {hasScrapedContent ? scrapeResult.content : job.description}
              </p>
            </div>

            {/* Source */}
            <div className="pt-4 flex items-center gap-2 text-xs text-muted-foreground border-t border-border">
              <span>Source:</span>
              <span className="px-2 py-0.5 bg-secondary rounded text-muted-foreground">
                {getSourceLabel()}
              </span>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
