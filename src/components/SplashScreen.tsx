import { useEffect, useState } from "react";
import { JinderLogo } from "./JinderLogo";
import { cn } from "@/lib/utils";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export const SplashScreen = ({ onComplete, duration = 2000 }: SplashScreenProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 500);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500",
        isExiting ? "opacity-0" : "opacity-100"
      )}
    >
      <div className="animate-scale-in">
        <JinderLogo size="lg" className="scale-150" />
      </div>
      <p className="mt-8 text-muted-foreground animate-fade-in text-sm tracking-wider">
        Swipe your way to your dream job
      </p>
      <div className="absolute bottom-12 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-primary/50 animate-pulse"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  );
};
