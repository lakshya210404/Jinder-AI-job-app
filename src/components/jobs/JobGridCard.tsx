import { Building2, MapPin, Calendar, Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, isToday, isYesterday, differenceInDays } from "date-fns";
import { JobData } from "./JobListCard";

interface JobGridCardProps {
  job: JobData;
  isSaved?: boolean;
  onSave?: (jobId: string) => void;
  onClick?: () => void;
}

// Vibrant colors for tech stack badges
const tagColors = [
  "bg-orange/15 text-orange border-orange/30",
  "bg-purple/15 text-purple border-purple/30",
  "bg-teal/15 text-teal border-teal/30",
  "bg-blue/15 text-blue border-blue/30",
  "bg-pink/15 text-pink border-pink/30",
  "bg-green/15 text-green border-green/30",
];

export function JobGridCard({ job, isSaved = false, onSave, onClick }: JobGridCardProps) {
  const getPostedLabel = () => {
    const postedDate = job.posted_date ? new Date(job.posted_date) : new Date(job.created_at);
    if (isToday(postedDate)) return "Today";
    if (isYesterday(postedDate)) return "Yesterday";
    const days = differenceInDays(new Date(), postedDate);
    if (days <= 7) return `${days}d ago`;
    return format(postedDate, "MMM d");
  };

  const isNew = () => {
    const postedDate = job.posted_date ? new Date(job.posted_date) : new Date(job.created_at);
    return differenceInDays(new Date(), postedDate) <= 1;
  };

  // Get tech stack from requirements or parse from description
  const techStack = job.requirements?.slice(0, 5) || [];

  return (
    <div
      className="group relative bg-card border border-border rounded-2xl p-5 hover:border-primary/50 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col h-full"
      onClick={onClick}
    >
      {/* Header: Logo + Date */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center overflow-hidden border border-border">
          {job.logo_url ? (
            <img src={job.logo_url} alt={job.company} className="w-full h-full object-contain p-2" />
          ) : (
            <span className="text-xl font-bold text-muted-foreground">
              {job.company.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isNew() && (
            <Badge className="bg-green/15 text-green border-green/30 rounded-full text-xs font-medium">
              New
            </Badge>
          )}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{getPostedLabel()}</span>
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-foreground text-lg leading-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors">
        {job.title}
      </h3>

      {/* Company */}
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        <Building2 className="h-4 w-4" />
        <span className="text-sm font-medium">{job.company}</span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
        <MapPin className="h-4 w-4" />
        <span className="text-sm">{job.location}</span>
      </div>

      {/* Description Preview */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow">
        {job.description.slice(0, 150)}...
      </p>

      {/* Tech Stack Tags */}
      {techStack.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {techStack.map((tech, index) => (
            <Badge
              key={index}
              variant="outline"
              className={`rounded-full text-xs font-medium ${tagColors[index % tagColors.length]}`}
            >
              {tech}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
        {job.apply_url ? (
          <Button asChild size="sm" className="rounded-full flex-1">
            <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
              Apply
              <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </a>
          </Button>
        ) : (
          <Button size="sm" className="rounded-full flex-1">
            View Details
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full shrink-0"
          onClick={() => onSave?.(job.id)}
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
