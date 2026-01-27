import { useState } from "react";
import { MapPin, Calendar, Bookmark, BookmarkCheck, ExternalLink, CheckCircle2, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isToday, isYesterday, differenceInDays, differenceInHours } from "date-fns";
import { cn } from "@/lib/utils";

export interface EnhancedJobData {
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
  company_logo_url?: string | null;
  company_domain?: string | null;
  logo_source?: string | null;
  created_at: string;
  apply_url?: string | null;
  source?: string | null;
  posted_date?: string | null;
  is_verified?: boolean;
  is_trending?: boolean;
  verification_status?: string;
  ai_summary?: string | null;
  ai_tech_stack?: string[] | null;
  ai_responsibilities?: string[] | null;
  ai_qualifications?: string[] | null;
  ai_benefits?: string[] | null;
  ai_visa_info?: string | null;
  role_type?: string;
}

interface PremiumJobCardProps {
  job: EnhancedJobData;
  isSaved?: boolean;
  onSave?: (jobId: string) => void;
  onClick?: () => void;
  showMatchScore?: boolean;
  matchScore?: number;
}

// Known company domain mappings
const knownDomains: Record<string, string> = {
  "openai": "openai.com",
  "stripe": "stripe.com",
  "coinbase": "coinbase.com",
  "airbnb": "airbnb.com",
  "anthropic": "anthropic.com",
  "vercel": "vercel.com",
  "figma": "figma.com",
  "notion": "notion.so",
  "google": "google.com",
  "meta": "meta.com",
  "apple": "apple.com",
  "amazon": "amazon.com",
  "microsoft": "microsoft.com",
  "netflix": "netflix.com",
  "spotify": "spotify.com",
  "uber": "uber.com",
  "slack": "slack.com",
  "discord": "discord.com",
  "github": "github.com",
  "gitlab": "gitlab.com",
  "dropbox": "dropbox.com",
  "salesforce": "salesforce.com",
  "adobe": "adobe.com",
  "nvidia": "nvidia.com",
  "shopify": "shopify.com",
  "plaid": "plaid.com",
  "datadog": "datadoghq.com",
  "cloudflare": "cloudflare.com",
  "supabase": "supabase.com",
  "linear": "linear.app",
  "twilio": "twilio.com",
  "mongodb": "mongodb.com",
  "snowflake": "snowflake.com",
  "zoom": "zoom.us",
};

function getDomainFromCompany(company: string): string | null {
  const companyLower = company.toLowerCase().trim();
  
  for (const [key, domain] of Object.entries(knownDomains)) {
    if (companyLower.includes(key) || key.includes(companyLower.replace(/\s+/g, ""))) {
      return domain;
    }
  }
  
  const cleaned = company
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+(inc|llc|corp|ltd|co|labs|technologies)$/i, "")
    .trim()
    .replace(/\s+/g, "");
  
  return cleaned ? `${cleaned}.com` : null;
}

// Minimal company logo component
function CompanyLogo({ 
  logoUrl, 
  companyLogoUrl,
  companyDomain,
  company,
  className 
}: { 
  logoUrl?: string | null; 
  companyLogoUrl?: string | null;
  companyDomain?: string | null;
  company: string;
  className?: string;
}) {
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  
  const resolvedDomain = companyDomain || getDomainFromCompany(company);
  
  const logoSources: string[] = [];
  if (companyLogoUrl) logoSources.push(companyLogoUrl);
  if (logoUrl) logoSources.push(logoUrl);
  if (resolvedDomain) {
    logoSources.push(`https://logo.clearbit.com/${resolvedDomain}`);
    logoSources.push(`https://www.google.com/s2/favicons?domain=${resolvedDomain}&sz=128`);
  }
  
  const currentUrl = logoSources[currentSourceIndex];
  const showFallback = hasError || !currentUrl;
  
  const initials = company.split(/\s+/).slice(0, 2).map(word => word.charAt(0).toUpperCase()).join("");
  
  const handleImageError = () => {
    if (currentSourceIndex < logoSources.length - 1) {
      setCurrentSourceIndex(prev => prev + 1);
    } else {
      setHasError(true);
    }
  };
  
  return (
    <div className={cn(
      "w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden shrink-0 bg-secondary",
      className
    )}>
      {!showFallback && currentUrl ? (
        <img 
          src={currentUrl} 
          alt={`${company} logo`}
          className="w-full h-full object-contain p-1.5"
          onError={handleImageError}
          loading="lazy"
        />
      ) : (
        <span className="text-sm font-semibold text-muted-foreground">
          {initials}
        </span>
      )}
    </div>
  );
}

export function PremiumJobCard({ 
  job, 
  isSaved = false, 
  onSave, 
  onClick,
  showMatchScore = false,
  matchScore
}: PremiumJobCardProps) {
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
    return differenceInHours(new Date(), postedDate) <= 24;
  };

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return null;
    if (job.salary_min && job.salary_max) {
      return `$${(job.salary_min / 1000).toFixed(0)}K – $${(job.salary_max / 1000).toFixed(0)}K`;
    }
    if (job.salary_min) return `$${(job.salary_min / 1000).toFixed(0)}K+`;
    if (job.salary_max) return `Up to $${(job.salary_max / 1000).toFixed(0)}K`;
    return null;
  };

  const displayTechStack = job.ai_tech_stack?.slice(0, 3) || job.requirements?.slice(0, 3) || [];
  const salary = formatSalary();
  const isVerified = job.is_verified || job.verification_status === "verified_active";

  return (
    <div
      className={cn(
        "group relative bg-card border border-border rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col h-full",
        "hover:shadow-elevated hover:border-border/60",
        isNew() && "border-primary/20"
      )}
      onClick={onClick}
    >
      {/* Match Score */}
      {showMatchScore && matchScore !== undefined && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shadow-lg",
            matchScore >= 80 ? "bg-success" : matchScore >= 60 ? "bg-primary" : "bg-warning"
          )}>
            {matchScore}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <CompanyLogo 
          logoUrl={job.logo_url}
          companyLogoUrl={job.company_logo_url}
          companyDomain={job.company_domain}
          company={job.company}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground truncate">{job.company}</span>
            {isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
          </div>
          <h3 className="font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {job.title}
          </h3>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {job.location}
        </span>
        {job.work_type && (
          <span className="text-muted-foreground/70">{job.work_type}</span>
        )}
      </div>

      {/* Salary */}
      {salary && (
        <div className="text-sm font-medium text-foreground mb-3">
          {salary}
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow">
        {job.ai_summary || job.description.slice(0, 120)}...
      </p>

      {/* Skills */}
      {displayTechStack.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {displayTechStack.map((tech, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs text-muted-foreground bg-secondary rounded-md"
            >
              {tech}
            </span>
          ))}
          {(job.ai_tech_stack?.length || job.requirements?.length || 0) > 3 && (
            <span className="px-2 py-0.5 text-xs text-muted-foreground">
              +{Math.max((job.ai_tech_stack?.length || 0), (job.requirements?.length || 0)) - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {getPostedLabel()}
        </span>
        
        {isNew() && (
          <span className="text-xs font-medium text-primary">New</span>
        )}
        
        <div className="flex-1" />
        
        {job.apply_url ? (
          <Button asChild size="sm" variant="default" className="h-8 px-3 rounded-lg text-xs font-medium">
            <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
              Apply
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </Button>
        ) : (
          <Button size="sm" variant="default" className="h-8 px-3 rounded-lg text-xs font-medium">
            View
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg shrink-0"
          onClick={() => onSave?.(job.id)}
        >
          {isSaved ? (
            <BookmarkCheck className="h-4 w-4 text-primary" />
          ) : (
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
}

// Clean skeleton
export function PremiumJobCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-secondary" />
        <div className="flex-1">
          <div className="h-3 w-20 bg-secondary rounded mb-2" />
          <div className="h-4 w-32 bg-secondary rounded" />
        </div>
      </div>
      <div className="h-3 w-24 bg-secondary rounded mb-3" />
      <div className="h-4 w-full bg-secondary rounded mb-2" />
      <div className="h-4 w-3/4 bg-secondary rounded mb-4" />
      <div className="flex gap-1.5 mb-4">
        <div className="h-5 w-14 bg-secondary rounded" />
        <div className="h-5 w-16 bg-secondary rounded" />
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-border/50">
        <div className="h-3 w-16 bg-secondary rounded" />
        <div className="flex-1" />
        <div className="h-8 w-14 bg-secondary rounded-lg" />
        <div className="h-8 w-8 bg-secondary rounded-lg" />
      </div>
    </div>
  );
}

export { CompanyLogo };
