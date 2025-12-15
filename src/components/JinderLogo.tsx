import { cn } from "@/lib/utils";

interface JinderLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const JinderLogo = ({ className, size = "md", showText = true }: JinderLogoProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  const textSizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* Flame shape with briefcase and heart combined */}
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="flameGradient" x1="32" y1="64" x2="32" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="50%" stopColor="hsl(var(--chart-1))" />
              <stop offset="100%" stopColor="hsl(var(--chart-2))" />
            </linearGradient>
            <linearGradient id="innerGradient" x1="32" y1="48" x2="32" y2="16" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="hsl(var(--chart-2))" />
              <stop offset="100%" stopColor="hsl(var(--chart-1))" />
            </linearGradient>
          </defs>
          
          {/* Outer flame shape */}
          <path
            d="M32 4C32 4 18 18 18 32C18 38 20 44 24 48C22 44 21 40 21 36C21 28 28 20 32 16C36 20 43 28 43 36C43 40 42 44 40 48C44 44 46 38 46 32C46 18 32 4 32 4Z"
            fill="url(#flameGradient)"
          />
          
          {/* Inner heart-briefcase hybrid */}
          <g transform="translate(22, 24)">
            {/* Heart shape base */}
            <path
              d="M10 4C10 4 4 4 4 10C4 16 10 20 10 20C10 20 16 16 16 10C16 4 10 4 10 4Z"
              fill="url(#innerGradient)"
              opacity="0.9"
            />
            {/* Briefcase handle integrated into heart */}
            <rect
              x="7"
              y="2"
              width="6"
              height="3"
              rx="1"
              fill="hsl(var(--background))"
              opacity="0.8"
            />
            {/* Briefcase line */}
            <rect
              x="4"
              y="10"
              width="12"
              height="2"
              rx="0.5"
              fill="hsl(var(--background))"
              opacity="0.6"
            />
          </g>
        </svg>
      </div>
      
      {showText && (
        <span className={cn("font-bold gradient-text", textSizeClasses[size])}>
          Jinder
        </span>
      )}
    </div>
  );
};
