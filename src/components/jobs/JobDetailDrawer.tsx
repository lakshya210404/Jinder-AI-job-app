import { useEffect } from "react";
import { X, MapPin, Briefcase, DollarSign, Calendar, Building2, ExternalLink, Bookmark, BookmarkCheck, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useScrapeJob } from "@/hooks/useScrapeJob";
import type { JobData } from "./JobListCard";

interface JobDetailDrawerProps {
  job: JobData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaved?: boolean;
  onSave?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
  onGenerateResume?: (job: JobData) => void;
}

export function JobDetailDrawer({
  job,
  open,
  onOpenChange,
  isSaved = false,
  onSave,
  onApply,
  onGenerateResume,
}: JobDetailDrawerProps) {
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

  // Color map for requirement badges
  const getRequirementColor = (index: number) => {
    const colors = [
      "bg-purple/10 text-purple border-purple/20",
      "bg-blue/10 text-blue border-blue/20",
      "bg-teal/10 text-teal border-teal/20",
      "bg-green/10 text-green border-green/20",
      "bg-orange/10 text-orange border-orange/20",
      "bg-pink/10 text-pink border-pink/20",
    ];
    return colors[index % colors.length];
  };

  // Determine which description to show
  const isExternalJob = job.source === "external";
  const hasScrapedContent = scrapeResult?.content && scrapeResult.content.length > 50;
  const displayDescription = hasScrapedContent ? scrapeResult.content : job.description;

  // Simple markdown-to-text rendering (basic formatting)
  const renderDescription = (text: string) => {
    // Split by double newlines for paragraphs, handle markdown headers
    const sections = text.split(/\n{2,}/);
    return sections.map((section, index) => {
      // Handle headers
      if (section.startsWith('# ')) {
        return (
          <h2 key={index} className="text-lg font-semibold text-foreground mt-4 mb-2">
            {section.replace(/^#+ /, '')}
          </h2>
        );
      }
      if (section.startsWith('## ')) {
        return (
          <h3 key={index} className="text-base font-semibold text-foreground mt-3 mb-2">
            {section.replace(/^#+ /, '')}
          </h3>
        );
      }
      if (section.startsWith('### ')) {
        return (
          <h4 key={index} className="text-sm font-semibold text-foreground mt-2 mb-1">
            {section.replace(/^#+ /, '')}
          </h4>
        );
      }
      // Handle bullet points
      if (section.includes('\n- ') || section.startsWith('- ')) {
        const items = section.split('\n').filter(line => line.trim());
        return (
          <ul key={index} className="list-disc list-inside space-y-1 mb-3">
            {items.map((item, i) => (
              <li key={i} className="text-sm">
                {item.replace(/^[-*] /, '')}
              </li>
            ))}
          </ul>
        );
      }
      // Regular paragraph
      return (
        <p key={index} className="mb-3 last:mb-0 text-sm leading-relaxed">
          {section}
        </p>
      );
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center text-2xl shrink-0 overflow-hidden">
              {job.logo_url ? (
                <img src={job.logo_url} alt={job.company} className="w-full h-full object-cover" />
              ) : (
                <span className="text-muted-foreground font-semibold text-xl">
                  {job.company.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Building2 className="h-4 w-4 text-purple" />
                <span>{job.company}</span>
                {isExternalJob && (
                  <Badge variant="outline" className="rounded-full text-xs bg-secondary ml-1">
                    Web
                  </Badge>
                )}
              </div>
              <SheetTitle className="text-xl font-semibold text-foreground leading-tight">
                {job.title}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{postedAt}</span>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Actions Bar */}
        <div className="flex items-center gap-2 p-4 border-b border-border bg-secondary/30">
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
            <Button asChild className="rounded-full px-6">
              <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                Apply
                <ExternalLink className="h-4 w-4 ml-1.5" />
              </a>
            </Button>
          ) : (
            <Button onClick={() => onApply?.(job.id)} className="rounded-full px-6">
              Apply Now
            </Button>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <MapPin className="h-5 w-5 text-teal" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-medium">{job.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <Briefcase className="h-5 w-5 text-purple" />
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-medium">{job.work_type}</p>
                </div>
              </div>
              {salary && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 col-span-2">
                  <DollarSign className="h-5 w-5 text-green" />
                  <div>
                    <p className="text-xs text-muted-foreground">Compensation</p>
                    <p className="text-sm font-medium">{salary}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Requirements/Skills */}
            {job.requirements && job.requirements.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Skills & Requirements</h3>
                <div className="flex flex-wrap gap-2">
                  {job.requirements.map((req, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className={`rounded-full px-3 py-1 border ${getRequirementColor(index)}`}
                    >
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Job Description</h3>
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
                {renderDescription(displayDescription)}
              </div>
            </div>

            {/* Source & Apply Info */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <p>
                  Source: <span className="capitalize font-medium">{job.source || (isExternalJob ? 'Web Search' : 'Database')}</span>
                </p>
                {job.apply_url && (
                  <p className="text-right">
                    Apply via {job.apply_url.includes('greenhouse') ? 'Greenhouse' : 
                              job.apply_url.includes('lever') ? 'Lever' : 
                              job.apply_url.includes('workday') ? 'Workday' : 
                              job.apply_url.includes('ashby') ? 'Ashby' : 'Company Site'}
                  </p>
                )}
              </div>
              {scrapeResult?.cached && (
                <p className="text-xs text-muted-foreground mt-1">Cached</p>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
