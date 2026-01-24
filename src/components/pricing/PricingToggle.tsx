import { cn } from "@/lib/utils";

type PlanCategory = "seeker" | "recruiter";

interface PricingToggleProps {
  value: PlanCategory;
  onChange: (value: PlanCategory) => void;
}

export function PricingToggle({ value, onChange }: PricingToggleProps) {
  return (
    <div className="inline-flex items-center rounded-full bg-secondary p-1">
      <button
        onClick={() => onChange("seeker")}
        className={cn(
          "rounded-full px-6 py-2 text-sm font-medium transition-all duration-200",
          value === "seeker"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Job Seekers
      </button>
      <button
        onClick={() => onChange("recruiter")}
        className={cn(
          "rounded-full px-6 py-2 text-sm font-medium transition-all duration-200",
          value === "recruiter"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Recruiters
      </button>
    </div>
  );
}
