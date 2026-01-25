import { useEffect } from "react";
import { X, MapPin, Briefcase, DollarSign, Calendar, Building2, ExternalLink, Bookmark, BookmarkCheck, Sparkles, Loader2, AlertCircle, Shield, TrendingUp, Zap, CheckCircle2, Users, GraduationCap, Globe, Gift, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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

  // Scrape job details when drawer opens for external jobs
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
    if (min && max) return `$${(min / 1000).toFixed(0)}K - $${(max / 1000).toFixed(0)}K`;
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

  // Determine source label
  const getSourceLabel = () => {
    if (job.source === "greenhouse") return "Greenhouse ATS";
    if (job.source === "lever") return "Lever ATS";
    if (job.source === "external") return "Web";
    return "Company Careers";
  };

  // Tech stack colors
  const techColors = [
    "bg-purple/10 text-purple border-purple/20",
    "bg-blue/10 text-blue border-blue/20",
    "bg-teal/10 text-teal border-teal/20",
    "bg-green/10 text-green border-green/20",
    "bg-orange/10 text-orange border-orange/20",
    "bg-pink/10 text-pink border-pink/20",
  ];

  // Determine which content to show
  const isExternalJob = job.source === "external";
  const hasScrapedContent = scrapeResult?.content && scrapeResult.content.length > 50;
  const hasAIContent = job.ai_summary || job.ai_responsibilities?.length || job.ai_qualifications?.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
        {/* Premium Header */}
        <SheetHeader className="p-6 pb-4 border-b border-border bg-gradient-to-b from-secondary/50 to-transparent">
          <div className="flex items-start gap-4">
            <CompanyLogo 
              logoUrl={job.logo_url}
              companyLogoUrl={job.company_logo_url}
              company={job.company}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              {/* Company with badges */}
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-purple" />
                  <span className="font-medium">{job.company}</span>
                </div>
                {isVerified && (
                  <Badge className="bg-blue/15 text-blue border-blue/30 rounded-full text-xs gap-1">
                    <Shield className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
                {job.is_trending && (
                  <Badge className="bg-orange/15 text-orange border-orange/30 rounded-full text-xs gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Hot
                  </Badge>
                )}
              </div>
              
              {/* Title */}
              <SheetTitle className="text-xl font-bold text-foreground leading-tight pr-8">
                {job.title}
              </SheetTitle>
              
              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{postedAt}</span>
                </div>
                {isVeryNew() && (
                  <Badge className="bg-green/15 text-green border-green/30 rounded-full text-xs gap-1">
                    <Zap className="h-3 w-3" />
                    Just Posted
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Actions Bar */}
        <div className="flex items-center gap-2 p-4 border-b border-border bg-card/50">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => onSave?.(job.id)}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="h-4 w-4 text-pink" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4" />
                <span>Save</span>
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => onGenerateResume?.(job)}
          >
            <Sparkles className="h-4 w-4 text-orange" />
            <span>Build Resume</span>
          </Button>
          <div className="flex-1" />
          {job.apply_url ? (
            <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20">
              <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                Apply Now
                <ExternalLink className="h-4 w-4 ml-1.5" />
              </a>
            </Button>
          ) : (
            <Button onClick={() => onApply?.(job.id)} className="rounded-full px-6 shadow-lg shadow-primary/20">
              Apply Now
            </Button>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-teal" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-medium">{job.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                <div className="w-10 h-10 rounded-lg bg-purple/10 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-purple" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-medium">{job.work_type}</p>
                </div>
              </div>
              {salary && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green/10 to-teal/10 border border-green/20 col-span-2">
                  <div className="w-10 h-10 rounded-lg bg-green/20 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Compensation</p>
                    <p className="text-sm font-bold text-green">{salary}</p>
                  </div>
                </div>
              )}
              {job.role_type && job.role_type !== "unknown" && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                  <div className="w-10 h-10 rounded-lg bg-blue/10 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-blue" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Role Type</p>
                    <p className="text-sm font-medium capitalize">{job.role_type.replace("_", " ")}</p>
                  </div>
                </div>
              )}
              {job.ai_visa_info && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                  <div className="w-10 h-10 rounded-lg bg-orange/10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-orange" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Visa</p>
                    <p className="text-sm font-medium">{job.ai_visa_info}</p>
                  </div>
                </div>
              )}
            </div>

            {/* AI Summary */}
            {job.ai_summary && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple/10 via-blue/10 to-teal/10 border border-purple/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-purple" />
                  <h3 className="text-sm font-semibold text-foreground">TL;DR</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {job.ai_summary}
                </p>
              </div>
            )}

            {/* Tech Stack */}
            {(job.ai_tech_stack?.length || job.requirements?.length) && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple" />
                  Tech Stack & Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(job.ai_tech_stack || job.requirements || []).map((tech, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className={cn("rounded-full px-3 py-1 border", techColors[index % techColors.length])}
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* AI Responsibilities */}
            {job.ai_responsibilities && job.ai_responsibilities.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-teal" />
                  What You'll Do
                </h3>
                <ul className="space-y-2">
                  {job.ai_responsibilities.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-teal shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Qualifications */}
            {job.ai_qualifications && job.ai_qualifications.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-blue" />
                  What We're Looking For
                </h3>
                <ul className="space-y-2">
                  {job.ai_qualifications.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-blue shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Benefits */}
            {job.ai_benefits && job.ai_benefits.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Gift className="h-4 w-4 text-pink" />
                  Benefits & Perks
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.ai_benefits.map((benefit, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="rounded-full text-xs"
                    >
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Full Description */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Full Description</h3>
                {isExternalJob && scraping && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Loading full details...</span>
                  </div>
                )}
                {isExternalJob && hasScrapedContent && (
                  <Badge variant="secondary" className="text-xs rounded-full">
                    Full details loaded
                  </Badge>
                )}
              </div>

              {/* Loading skeleton for external jobs */}
              {isExternalJob && scraping && !hasScrapedContent && (
                <div className="space-y-3 mb-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              )}

              {/* Error state */}
              {isExternalJob && scrapeError && !hasScrapedContent && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <span>Couldn't load full details. Showing preview instead.</span>
                </div>
              )}

              {/* Description content */}
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p className="whitespace-pre-line text-sm leading-relaxed">
                  {hasScrapedContent ? scrapeResult.content : job.description}
                </p>
              </div>
            </div>

            {/* Source Attribution */}
            <div className="pt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border">
              <div className="flex items-center gap-2">
                <span>Source:</span>
                <Badge variant="outline" className="rounded-full text-xs">
                  {getSourceLabel()}
                </Badge>
              </div>
              {scrapeResult?.cached && (
                <span className="text-muted-foreground/60">Cached</span>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
