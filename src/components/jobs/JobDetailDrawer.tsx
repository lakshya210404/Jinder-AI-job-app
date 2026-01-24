import { X, MapPin, Briefcase, DollarSign, Calendar, Building2, ExternalLink, Bookmark, BookmarkCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
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
              <h3 className="text-sm font-semibold text-foreground mb-3">Job Description</h3>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                {job.description.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-3 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Source */}
            {job.source && (
              <div className="pt-4">
                <p className="text-xs text-muted-foreground">
                  Source: {job.source === 'external' ? 'Web Search' : 'Database'}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}