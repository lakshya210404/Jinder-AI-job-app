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
    <Link to="/" className={cn("flex items-center", className)}>
      <span className={cn(
        "font-semibold tracking-tight text-foreground",
        textSizeClasses[size]
      )}>
        Jinder
      </span>
    </Link>
  );
};
