import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface JinderLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const JinderLogo = ({ className, size = "md", showText = true }: JinderLogoProps) => {
  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <Link to="/" className={cn("flex items-center gap-2", className)}>
      <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
        <span className="text-primary-foreground font-bold text-sm">J</span>
      </div>
      {showText && (
        <span className={cn(
          "font-serif tracking-tight text-foreground",
          textSizeClasses[size]
        )}>
          Jinder
        </span>
      )}
    </Link>
  );
};
