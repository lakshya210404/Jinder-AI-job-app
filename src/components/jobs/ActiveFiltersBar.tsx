import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ActiveFilter {
  key: string;
  value: string;
  label: string;
  color: string;
}

interface ActiveFiltersBarProps {
  filters: ActiveFilter[];
  onRemoveFilter: (key: string, value: string) => void;
  onClearAll: () => void;
  onSaveFilters?: () => void;
}

export function ActiveFiltersBar({
  filters,
  onRemoveFilter,
  onClearAll,
}: ActiveFiltersBarProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Filters:</span>
      
      {filters.map((filter, index) => (
        <span
          key={`${filter.key}-${filter.value}-${index}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-secondary rounded-md text-muted-foreground"
        >
          {filter.label}
          <button
            onClick={() => onRemoveFilter(filter.key, filter.value)}
            className="hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        Clear all
      </Button>
    </div>
  );
}
