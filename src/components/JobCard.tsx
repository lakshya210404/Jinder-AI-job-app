import { Building2, MapPin, DollarSign, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  logo: string;
  description: string;
  skills: string[];
  postedAt: string;
}

interface JobCardProps {
  job: Job;
  isAnimating?: "left" | "right" | null;
}

export const JobCard = ({ job, isAnimating }: JobCardProps) => {
  return (
    <div
      className={cn(
        "absolute inset-0 gradient-border rounded-2xl overflow-hidden transition-transform duration-100",
        isAnimating === "right" && "animate-swipe-right",
        isAnimating === "left" && "animate-swipe-left"
      )}
    >
      <div className="h-full bg-card p-6 flex flex-col">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-2xl flex-shrink-0">
            {job.logo}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-foreground truncate">{job.title}</h3>
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <Building2 className="w-4 h-4" />
              {job.company}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {job.location}
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {job.salary}
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {job.type}
          </span>
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
          {job.description}
        </p>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Required Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 rounded-full text-xs font-medium gradient-border bg-card"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Posted {job.postedAt}
        </p>
      </div>
    </div>
  );
};
