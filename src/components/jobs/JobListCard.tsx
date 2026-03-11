import { MapPin, Bookmark, BookmarkCheck, Sparkles, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  onClick?: () => void;
}

export function JobListCard({
  job,
  isSaved = false,
  onSave,
  onApply,
  onGenerateResume,
  onClick,
}: JobListCardProps) {
  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `$${(min / 1000).toFixed(0)}K – $${(max / 1000).toFixed(0)}K`;
    if (min) return `$${(min / 1000).toFixed(0)}K+`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}K`;
  };

  const salary = formatSalary(job.salary_min, job.salary_max);
  const postedAt = formatDistanceToNow(new Date(job.created_at), { addSuffix: true });

  return (
    <div 
      className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl cursor-pointer hover:shadow-elevated transition-all duration-200" 
      onClick={onClick}
    >
      {/* Logo */}
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
        {job.logo_url ? (
          <img src={job.logo_url} alt={job.company} className="w-full h-full object-contain p-1.5" />
        ) : (
          <span className="text-sm font-semibold text-muted-foreground">
            {job.company.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-foreground truncate">
            {job.title}
          </h3>
          <span className="text-sm text-muted-foreground shrink-0 hidden sm:block">
            {postedAt}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
          <span>{job.company}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {job.location}
          </span>
          {job.work_type && (
            <>
              <span>·</span>
              <span>{job.work_type}</span>
            </>
          )}
          {salary && (
            <>
              <span>·</span>
              <span className="font-medium text-foreground">{salary}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onGenerateResume?.(job)}
          title="Generate resume"
        >
          <Sparkles className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onSave?.(job.id)}
          title={isSaved ? "Remove from saved" : "Save job"}
        >
          {isSaved ? (
            <BookmarkCheck className="h-4 w-4 text-primary" />
          ) : (
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
        {job.apply_url ? (
          <Button asChild size="sm" className="h-8 px-3 rounded-lg text-xs">
            <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
              Apply
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </Button>
        ) : (
          <Button size="sm" className="h-8 px-3 rounded-lg text-xs" onClick={() => onApply?.(job.id)}>
            Apply
          </Button>
        )}
      </div>
    </div>
  );
}
