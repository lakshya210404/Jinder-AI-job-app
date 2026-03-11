import { cn } from "@/lib/utils";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressBar = ({ currentStep, totalSteps }: ProgressBarProps) => {
  return (
    <div className="flex gap-2 w-full max-w-2xl mx-auto px-4">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-1 flex-1 rounded-full transition-all duration-500",
            index < currentStep
              ? "gradient-button"
              : index === currentStep
              ? "gradient-button opacity-60"
              : "bg-border"
          )}
        />
      ))}
    </div>
  );
};
