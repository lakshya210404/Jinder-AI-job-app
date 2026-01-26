import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bookmark,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  EyeOff,
  MoreHorizontal,
  Undo2,
} from "lucide-react";
import { JobAction } from "@/hooks/useJobInteractions";
import { cn } from "@/lib/utils";

interface JobStatusActionsProps {
  jobId: string;
  currentStatus: JobAction | null;
  onStatusChange: (jobId: string, status: JobAction) => void;
  onRemoveStatus: (jobId: string) => void;
  compact?: boolean;
}

const statusConfig: Record<
  JobAction,
  { label: string; icon: typeof Bookmark; color: string; bgColor: string }
> = {
  saved: {
    label: "Saved",
    icon: Bookmark,
    color: "text-blue",
    bgColor: "bg-blue/10",
  },
  applied: {
    label: "Applied",
    icon: CheckCircle2,
    color: "text-purple",
    bgColor: "bg-purple/10",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  interview: {
    label: "Interview",
    icon: CalendarCheck,
    color: "text-green",
    bgColor: "bg-green/10",
  },
  hidden: {
    label: "Hidden",
    icon: EyeOff,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
};

export function JobStatusActions({
  jobId,
  currentStatus,
  onStatusChange,
  onRemoveStatus,
  compact = false,
}: JobStatusActionsProps) {
  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full",
              currentStatus && statusConfig[currentStatus]?.bgColor
            )}
          >
            {currentStatus ? (
              (() => {
                const Icon = statusConfig[currentStatus].icon;
                return (
                  <Icon
                    className={cn("h-4 w-4", statusConfig[currentStatus].color)}
                  />
                );
              })()
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {(Object.keys(statusConfig) as JobAction[]).map((action) => {
            const config = statusConfig[action];
            const Icon = config.icon;
            const isActive = currentStatus === action;

            return (
              <DropdownMenuItem
                key={action}
                onClick={() => onStatusChange(jobId, action)}
                className={cn(isActive && "bg-accent")}
              >
                <Icon className={cn("mr-2 h-4 w-4", config.color)} />
                {config.label}
                {isActive && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
            );
          })}
          {currentStatus && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onRemoveStatus(jobId)}>
                <Undo2 className="mr-2 h-4 w-4" />
                Remove Status
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Full button bar for drawer/detail view
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(statusConfig) as JobAction[])
        .filter((a) => a !== "hidden")
        .map((action) => {
          const config = statusConfig[action];
          const Icon = config.icon;
          const isActive = currentStatus === action;

          return (
            <Button
              key={action}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusChange(jobId, action)}
              className={cn(
                "gap-1.5 rounded-full",
                isActive && config.bgColor,
                isActive && config.color,
                isActive && "border-transparent"
              )}
            >
              <Icon className="h-4 w-4" />
              {config.label}
            </Button>
          );
        })}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onStatusChange(jobId, "hidden")}
        className="gap-1.5 rounded-full text-muted-foreground"
      >
        <EyeOff className="h-4 w-4" />
        Hide
      </Button>
    </div>
  );
}
