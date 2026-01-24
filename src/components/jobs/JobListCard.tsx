import { MapPin, Clock, DollarSign, Bookmark, BookmarkCheck, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export interface JobData {
  id: string;
  title: string;
  company: string;
  location: string;
  work_type: string;
  salary_min: number | null;
  salary_max: number | null;
  description: string;
  requirements: string[] | null;
  logo_url: string | null;
  created_at: string;
  apply_url?: string | null;
  source?: string | null;
  posted_date?: string | null;
}

interface JobListCardProps {
  job: JobData;
  isSaved?: boolean;
  onSave?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
  onGenerateResume?: (job: JobData) => void;
}

export function JobListCard({
  job,
  isSaved = false,
  onSave,
  onApply,
  onGenerateResume,
}: JobListCardProps) {
  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `$${(min / 1000).toFixed(0)}K - $${(max / 1000).toFixed(0)}K`;
    if (min) return `$${(min / 1000).toFixed(0)}K+`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}K`;
  };

  const salary = formatSalary(job.salary_min, job.salary_max);
  const postedAt = formatDistanceToNow(new Date(job.created_at), { addSuffix: true });

  return (
    <div className="apple-card p-5 group">
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-2xl shrink-0 overflow-hidden">
          {job.logo_url ? (
            <img src={job.logo_url} alt={job.company} className="w-full h-full object-cover" />
          ) : (
            <span className="text-muted-foreground font-semibold">
              {job.company.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground text-lg leading-tight">
                {job.title}
              </h3>
              <p className="text-muted-foreground mt-0.5">{job.company}</p>
            </div>
            <span className="text-sm text-muted-foreground shrink-0">{postedAt}</span>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
            <Badge variant="secondary" className="rounded-full text-xs font-medium">
              {job.work_type}
            </Badge>
            {salary && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>{salary}</span>
              </div>
            )}
          </div>

          {/* Requirements/Skills */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {job.requirements.slice(0, 4).map((req, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="rounded-full text-xs bg-background"
                >
                  {req}
                </Badge>
              ))}
              {job.requirements.length > 4 && (
                <Badge variant="outline" className="rounded-full text-xs bg-background">
                  +{job.requirements.length - 4} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
        {job.apply_url ? (
          <Button
            asChild
            className="rounded-full px-6"
          >
            <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
              Apply
              <ExternalLink className="h-4 w-4 ml-1.5" />
            </a>
          </Button>
        ) : (
          <Button
            onClick={() => onApply?.(job.id)}
            className="rounded-full px-6"
          >
            Apply Now
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={() => onGenerateResume?.(job)}
          title="Generate tailored resume"
        >
          <Sparkles className="h-4 w-4 text-orange" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full ml-auto"
          onClick={() => onSave?.(job.id)}
          title={isSaved ? "Remove from saved" : "Save job"}
        >
          {isSaved ? (
            <BookmarkCheck className="h-5 w-5 text-pink" />
          ) : (
            <Bookmark className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}