import { Search, X, MapPin, Clock, DollarSign, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const getFilterLabel = (key: string, values: string[]) => {
    if (values.length === 0) return "";
    const optionsMap: Record<string, { value: string; label: string }[]> = {
      jobType: jobTypes,
      workMode: workModes,
      salaryMin: salaryRanges,
      datePosted: datePostedOptions,
    };
    const options = optionsMap[key];
    if (!options) return values.join(", ");
    
    const labels = values.map((v) => options.find((o) => o.value === v)?.label ?? v);
    if (labels.length === 1) return labels[0];
    return `${labels.length} selected`;
  };

  const activeFilters = Object.entries(filters)
    .filter(([, v]) => isActive(v))
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
          placeholder="Work Mode"
          searchPlaceholder="Search modes..."
          icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
          className="w-[160px]"
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
          placeholder="Date Posted"
          searchPlaceholder="Search dates..."
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          className="w-[160px]"
        />
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilters.map(({ key, value }) => {
            if (key === "search" && typeof value === "string") {
              return (
                <Badge
                  key={key}
                  variant="secondary"
                  className="rounded-full px-3 py-1 gap-1"
                >
                  "{value}"
                  <button
                    onClick={() => updateFilter("search", "")}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            }
            if (key === "location" && Array.isArray(value) && value.length > 0) {
              return (
                <Badge
                  key={key}
                  variant="secondary"
                  className="rounded-full px-3 py-1 gap-1"
                >
                  {value.length === 1 ? value[0] : `${value.length} locations`}
                  <button
                    onClick={() => updateFilter("location", [])}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            }
            if (Array.isArray(value) && value.length > 0) {
              return (
                <Badge
                  key={key}
                  variant="secondary"
                  className="rounded-full px-3 py-1 gap-1"
                >
                  {getFilterLabel(key, value)}
                  <button
                    onClick={() => updateFilter(key as keyof JobFiltersState, [])}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            }
            return null;
          })}
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
