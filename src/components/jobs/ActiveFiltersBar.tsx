import { X, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  onSaveFilters,
}: ActiveFiltersBarProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-3 px-4 bg-secondary/50 rounded-xl">
      <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
      
      {filters.map((filter, index) => (
        <Badge
          key={`${filter.key}-${filter.value}-${index}`}
          variant="outline"
          className={`rounded-full px-3 py-1.5 gap-1.5 border font-medium ${filter.color}`}
        >
          {filter.label}
          <button
            onClick={() => onRemoveFilter(filter.key, filter.value)}
            className="ml-0.5 hover:opacity-70 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      <div className="flex items-center gap-2 ml-auto">
        {onSaveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSaveFilters}
            className="rounded-full gap-1.5 text-primary border-primary/30 hover:bg-primary/10"
          >
            <Bookmark className="h-3.5 w-3.5" />
            Save filters
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      </div>
    </div>
  );
}
