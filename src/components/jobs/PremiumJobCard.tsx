import { useState } from "react";
import { Building2, MapPin, Calendar, Bookmark, BookmarkCheck, ExternalLink, Sparkles, CheckCircle2, TrendingUp, Zap, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

// Tech stack tag colors with gradients
const tagColors = [
  "bg-gradient-to-r from-orange/20 to-orange/10 text-orange border-orange/30",
  "bg-gradient-to-r from-purple/20 to-purple/10 text-purple border-purple/30",
  "bg-gradient-to-r from-teal/20 to-teal/10 text-teal border-teal/30",
  "bg-gradient-to-r from-blue/20 to-blue/10 text-blue border-blue/30",
  "bg-gradient-to-r from-pink/20 to-pink/10 text-pink border-pink/30",
  "bg-gradient-to-r from-green/20 to-green/10 text-green border-green/30",
];

// Known company domain mappings for reliable logo resolution
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
  "snap": "snap.com",
  "pinterest": "pinterest.com",
  "reddit": "reddit.com",
  "shopify": "shopify.com",
  "plaid": "plaid.com",
  "brex": "brex.com",
  "ramp": "ramp.com",
  "datadog": "datadoghq.com",
  "cloudflare": "cloudflare.com",
  "airtable": "airtable.com",
  "supabase": "supabase.com",
  "netlify": "netlify.com",
  "linear": "linear.app",
  "twilio": "twilio.com",
  "mongodb": "mongodb.com",
  "snowflake": "snowflake.com",
  "databricks": "databricks.com",
  "zoom": "zoom.us",
  "hubspot": "hubspot.com",
  "amplitude": "amplitude.com",
  "mixpanel": "mixpanel.com",
};

// Get domain from company name
function getDomainFromCompany(company: string): string | null {
  const companyLower = company.toLowerCase().trim();
  
  // Check known domains first
  for (const [key, domain] of Object.entries(knownDomains)) {
    if (companyLower.includes(key) || key.includes(companyLower.replace(/\s+/g, ""))) {
      return domain;
    }
  }
  
  // Generate a guess
  const cleaned = company
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+(inc|llc|corp|ltd|co|labs|technologies)$/i, "")
    .trim()
    .replace(/\s+/g, "");
  
  return cleaned ? `${cleaned}.com` : null;
}

// Company logo component with robust fallback chain
function CompanyLogo({ 
  logoUrl, 
  companyLogoUrl,
  companyDomain,
  company, 
  size = "md",
  className 
}: { 
  logoUrl?: string | null; 
  companyLogoUrl?: string | null;
  companyDomain?: string | null;
  company: string; 
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  
  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-lg",
    lg: "w-16 h-16 text-xl",
  };
  
  // Build list of logo URLs to try in order
  const resolvedDomain = companyDomain || getDomainFromCompany(company);
  
  const logoSources: string[] = [];
  
  // 1. Stored company_logo_url
  if (companyLogoUrl) logoSources.push(companyLogoUrl);
  
  // 2. Stored logo_url
  if (logoUrl) logoSources.push(logoUrl);
  
  // 3. Clearbit with resolved domain
  if (resolvedDomain) {
    logoSources.push(`https://logo.clearbit.com/${resolvedDomain}`);
  }
  
  // 4. Google Favicon (high-res)
  if (resolvedDomain) {
    logoSources.push(`https://www.google.com/s2/favicons?domain=${resolvedDomain}&sz=128`);
  }
  
  const currentUrl = logoSources[currentSourceIndex];
  const showFallback = hasError || !currentUrl;
  
  // Generate initials from company name
  const initials = company
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join("");
  
  // Generate a consistent color based on company name
  const colors = [
    "bg-gradient-to-br from-purple to-purple/70",
    "bg-gradient-to-br from-blue to-blue/70",
    "bg-gradient-to-br from-teal to-teal/70",
    "bg-gradient-to-br from-orange to-orange/70",
    "bg-gradient-to-br from-pink to-pink/70",
    "bg-gradient-to-br from-green to-green/70",
  ];
  const colorIndex = company.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  
  const handleImageError = () => {
    // Try next source in the chain
    if (currentSourceIndex < logoSources.length - 1) {
      setCurrentSourceIndex(prev => prev + 1);
    } else {
      setHasError(true);
    }
  };
  
  return (
    <div 
      className={cn(
        "rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-border shadow-sm",
        sizeClasses[size],
        showFallback ? colors[colorIndex] : "bg-card",
        className
      )}
    >
      {!showFallback && currentUrl ? (
        <img 
          src={currentUrl} 
          alt={`${company} logo`}
          className="w-full h-full object-contain p-1.5"
          onError={handleImageError}
          loading="lazy"
        />
      ) : (
        <span className="font-bold text-white drop-shadow-sm">
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

  const isVeryNew = () => {
    const postedDate = job.posted_date ? new Date(job.posted_date) : new Date(job.created_at);
    return differenceInHours(new Date(), postedDate) <= 6;
  };

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return null;
    if (job.salary_min && job.salary_max) {
      return `$${(job.salary_min / 1000).toFixed(0)}K - $${(job.salary_max / 1000).toFixed(0)}K`;
    }
    if (job.salary_min) return `$${(job.salary_min / 1000).toFixed(0)}K+`;
    if (job.salary_max) return `Up to $${(job.salary_max / 1000).toFixed(0)}K`;
    return null;
  };

  // Combine AI tech stack and requirements for display
  const displayTechStack = job.ai_tech_stack?.slice(0, 4) || job.requirements?.slice(0, 4) || [];
  const salary = formatSalary();
  const isVerified = job.is_verified || job.verification_status === "verified_active";

  return (
    <div
      className={cn(
        "group relative bg-card border border-border rounded-2xl p-5 transition-all duration-300 cursor-pointer flex flex-col h-full",
        "hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5",
        isVeryNew() && "ring-2 ring-green/20 border-green/30"
      )}
      onClick={onClick}
    >
      {/* Match Score Overlay (Pro Feature) */}
      {showMatchScore && matchScore !== undefined && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg",
            matchScore >= 80 ? "bg-gradient-to-br from-green to-teal" :
            matchScore >= 60 ? "bg-gradient-to-br from-blue to-purple" :
            "bg-gradient-to-br from-orange to-pink"
          )}>
            {matchScore}%
          </div>
        </div>
      )}

      {/* Header: Logo + Badges */}
      <div className="flex items-start justify-between mb-4">
        <CompanyLogo 
          logoUrl={job.logo_url}
          companyLogoUrl={job.company_logo_url}
          companyDomain={job.company_domain}
          company={job.company}
          size="md"
        />
        <div className="flex flex-wrap items-center gap-1.5 justify-end">
          {isVerified && (
            <Badge className="bg-blue/15 text-blue border-blue/30 rounded-full text-xs font-medium gap-1">
              <Shield className="h-3 w-3" />
              Verified
            </Badge>
          )}
          {job.is_trending && (
            <Badge className="bg-orange/15 text-orange border-orange/30 rounded-full text-xs font-medium gap-1">
              <TrendingUp className="h-3 w-3" />
              Hot
            </Badge>
          )}
          {isVeryNew() ? (
            <Badge className="bg-gradient-to-r from-green/20 to-teal/20 text-green border-green/30 rounded-full text-xs font-medium gap-1 animate-pulse">
              <Zap className="h-3 w-3" />
              Just Posted
            </Badge>
          ) : isNew() && (
            <Badge className="bg-green/15 text-green border-green/30 rounded-full text-xs font-medium">
              New
            </Badge>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-foreground text-lg leading-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors">
        {job.title}
      </h3>

      {/* Company */}
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        <Building2 className="h-4 w-4 text-purple" />
        <span className="text-sm font-medium">{job.company}</span>
        {isVerified && (
          <CheckCircle2 className="h-3.5 w-3.5 text-blue" />
        )}
      </div>

      {/* Location + Work Type */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">{job.location}</span>
        </div>
        {job.work_type && (
          <Badge variant="secondary" className="rounded-full text-xs">
            {job.work_type}
          </Badge>
        )}
        {job.role_type && job.role_type !== "unknown" && (
          <Badge variant="outline" className="rounded-full text-xs bg-purple/10 text-purple border-purple/30">
            {job.role_type.replace("_", " ")}
          </Badge>
        )}
      </div>

      {/* Salary (if available) */}
      {salary && (
        <div className="flex items-center gap-1.5 text-sm font-medium text-green mb-3">
          <span>{salary}</span>
        </div>
      )}

      {/* AI Summary or Description Preview */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow">
        {job.ai_summary || job.description.slice(0, 150)}...
      </p>

      {/* Tech Stack Tags */}
      {displayTechStack.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {displayTechStack.map((tech, index) => (
            <Badge
              key={index}
              variant="outline"
              className={cn("rounded-full text-xs font-medium border", tagColors[index % tagColors.length])}
            >
              {tech}
            </Badge>
          ))}
          {(job.ai_tech_stack?.length || job.requirements?.length || 0) > 4 && (
            <Badge variant="outline" className="rounded-full text-xs bg-secondary">
              +{Math.max((job.ai_tech_stack?.length || 0), (job.requirements?.length || 0)) - 4}
            </Badge>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{getPostedLabel()}</span>
        </div>
        
        <div className="flex-1" />
        
        {job.apply_url ? (
          <Button asChild size="sm" className="rounded-full h-9 px-4">
            <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
              Apply
              <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </a>
          </Button>
        ) : (
          <Button size="sm" className="rounded-full h-9 px-4">
            View Details
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full shrink-0 h-9 w-9"
          onClick={() => onSave?.(job.id)}
        >
          {isSaved ? (
            <BookmarkCheck className="h-5 w-5 text-pink" />
          ) : (
            <Bookmark className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Source Attribution */}
      {job.source && (
        <div className="absolute bottom-1 left-5 text-[10px] text-muted-foreground/60">
          via {job.source === "greenhouse" ? "Greenhouse" : job.source === "lever" ? "Lever" : job.source}
        </div>
      )}
    </div>
  );
}

// Loading skeleton for the premium card
export function PremiumJobCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-14 h-14 rounded-xl" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-6 w-4/5 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-1" />
      <Skeleton className="h-4 w-2/3 mb-3" />
      <Skeleton className="h-12 w-full mb-4" />
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <Skeleton className="h-4 w-20" />
        <div className="flex-1" />
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </div>
  );
}

export { CompanyLogo };
