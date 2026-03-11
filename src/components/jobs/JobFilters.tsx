import { Search, X, MapPin, Clock, DollarSign, Calendar, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CountryCombobox } from "@/components/ui/country-combobox";
import { CheckboxSelect } from "@/components/ui/checkbox-select";

export interface JobFiltersState {
  search: string;
  jobType: string[];
  location: string[];
  workMode: string[];
  salaryMin: string[];
  datePosted: string[];
}

interface JobFiltersProps {
  filters: JobFiltersState;
  onFiltersChange: (filters: JobFiltersState) => void;
  onClearFilters: () => void;
}

const jobTypes = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
];

const workModes = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

const salaryRanges = [
  { value: "50000", label: "$50K+" },
  { value: "75000", label: "$75K+" },
  { value: "100000", label: "$100K+" },
  { value: "150000", label: "$150K+" },
];

const datePostedOptions = [
  { value: "24h", label: "Past 24 Hours" },
  { value: "3d", label: "Past 3 Days" },
  { value: "7d", label: "Past Week" },
  { value: "30d", label: "Past Month" },
];

export function JobFilters({ filters, onFiltersChange, onClearFilters }: JobFiltersProps) {
  const updateFilter = (
    key: keyof JobFiltersState,
    value: JobFiltersState[keyof JobFiltersState]
  ) => {
    onFiltersChange({ ...filters, [key]: value } as JobFiltersState);
  };

  const isActive = (value: unknown) => {
    if (typeof value === "string") return Boolean(value);
    if (Array.isArray(value)) return value.length > 0;
    return false;
  };

  const activeFiltersCount = Object.entries(filters).filter(([, v]) => isActive(v)).length;

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobs, companies..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="h-10 pl-9 pr-4 rounded-lg bg-secondary/50 border-0 text-sm placeholder:text-muted-foreground/60"
        />
        {filters.search && (
          <button
            onClick={() => updateFilter("search", "")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <CheckboxSelect
          value={filters.jobType}
          onChange={(value) => updateFilter("jobType", value)}
          options={jobTypes}
          placeholder="Type"
          searchPlaceholder="Search..."
          className="w-[110px]"
        />

        <div className="w-[180px]">
          <CountryCombobox
            value={filters.location}
            onChange={(value) => updateFilter("location", value)}
            placeholder="Location"
            multiSelect
          />
        </div>

        <CheckboxSelect
          value={filters.workMode}
          onChange={(value) => updateFilter("workMode", value)}
          options={workModes}
          placeholder="Mode"
          searchPlaceholder="Search..."
          className="w-[100px]"
        />

        <CheckboxSelect
          value={filters.salaryMin}
          onChange={(value) => updateFilter("salaryMin", value)}
          options={salaryRanges}
          placeholder="Salary"
          searchPlaceholder="Search..."
          className="w-[100px]"
        />

        <CheckboxSelect
          value={filters.datePosted}
          onChange={(value) => updateFilter("datePosted", value)}
          options={datePostedOptions}
          placeholder="Date"
          searchPlaceholder="Search..."
          className="w-[100px]"
        />

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-10 px-3 text-muted-foreground hover:text-foreground text-sm"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
