import { Search, X, MapPin, Clock, DollarSign, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CountryCombobox } from "@/components/ui/country-combobox";
import { CheckboxSelect } from "@/components/ui/checkbox-select";

export interface JobFiltersState {
  search: string;
  jobType: string;
  location: string[];
  workMode: string;
  salaryMin: string;
  datePosted: string;
}

interface JobFiltersProps {
  filters: JobFiltersState;
  onFiltersChange: (filters: JobFiltersState) => void;
  onClearFilters: () => void;
}

const jobTypes = [
  { value: "all", label: "All Types" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
];

const workModes = [
  { value: "all", label: "All Modes" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

const salaryRanges = [
  { value: "all", label: "Any Salary" },
  { value: "50000", label: "$50K+" },
  { value: "75000", label: "$75K+" },
  { value: "100000", label: "$100K+" },
  { value: "150000", label: "$150K+" },
];

const datePostedOptions = [
  { value: "all", label: "Any Time" },
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

  const isActive = (key: string, value: unknown) => {
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value) && value !== "all";
  };

  const activeFiltersCount = Object.entries(filters).filter(([k, v]) => isActive(k, v)).length;

  const labelFor = (key: string, value: unknown) => {
    if (key === "location" && Array.isArray(value)) {
      if (value.length === 1) return value[0];
      return `${value.length} locations selected`;
    }
    if (typeof value !== "string") return "";
    if (key === "jobType") return jobTypes.find((o) => o.value === value)?.label ?? value;
    if (key === "workMode") return workModes.find((o) => o.value === value)?.label ?? value;
    if (key === "salaryMin") return salaryRanges.find((o) => o.value === value)?.label ?? value;
    if (key === "datePosted") return datePostedOptions.find((o) => o.value === value)?.label ?? value;
    return value;
  };

  const activeFilters = Object.entries(filters)
    .filter(([k, v]) => isActive(k, v))
    .map(([key, value]) => ({ key, value }));

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search jobs, companies, or keywords..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="h-12 pl-12 pr-4 rounded-xl bg-secondary border-0 text-base"
        />
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3">
        <CheckboxSelect
          value={filters.jobType}
          onChange={(value) => updateFilter("jobType", value)}
          options={jobTypes}
          placeholder="Job Type"
          searchPlaceholder="Search job types..."
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          className="w-[150px]"
        />

        <div className="w-[220px]">
          <CountryCombobox
            value={filters.location}
            onChange={(value) => updateFilter("location", value)}
            placeholder="Select locations..."
            multiSelect
          />
        </div>

        <CheckboxSelect
          value={filters.workMode}
          onChange={(value) => updateFilter("workMode", value)}
          options={workModes}
          placeholder="Work modality"
          searchPlaceholder="Search modalities..."
          icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
          className="w-[170px]"
        />

        <CheckboxSelect
          value={filters.salaryMin}
          onChange={(value) => updateFilter("salaryMin", value)}
          options={salaryRanges}
          placeholder="Salary"
          searchPlaceholder="Search salary..."
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          className="w-[140px]"
        />

        <CheckboxSelect
          value={filters.datePosted}
          onChange={(value) => updateFilter("datePosted", value)}
          options={datePostedOptions}
          placeholder="Date"
          searchPlaceholder="Search dates..."
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          className="w-[150px]"
        />
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilters.map(({ key, value }) => (
            <Badge
              key={key}
              variant="secondary"
              className="rounded-full px-3 py-1 gap-1"
            >
                {labelFor(key, value)}
              <button
                  onClick={() => {
                    if (key === "location") {
                      updateFilter("location", []);
                      return;
                    }
                    updateFilter(key as keyof JobFiltersState, key === "search" ? "" : "all");
                  }}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}