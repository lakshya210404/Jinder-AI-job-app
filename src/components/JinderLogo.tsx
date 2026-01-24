import { cn } from "@/lib/utils";
import { Briefcase } from "lucide-react";

interface JinderLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const JinderLogo = ({ className, size = "md", showText = true }: JinderLogoProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const textSizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn("relative flex items-center justify-center rounded-xl bg-primary", sizeClasses[size])}>
        <Briefcase className="w-1/2 h-1/2 text-primary-foreground" />
      </div>
      
      {showText && (
        <span className={cn("font-bold text-foreground tracking-tight", textSizeClasses[size])}>
          Jinder
        </span>
      )}
    </div>
  );
};