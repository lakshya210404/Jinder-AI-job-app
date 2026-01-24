import { Search, X, MapPin, Clock, DollarSign, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface JobFiltersState {
  search: string;
  jobType: string;
  location: string;
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

const locations = [
  { value: "all", label: "All Locations" },
  { value: "remote", label: "Remote" },
  { value: "usa", label: "United States" },
  { value: "canada", label: "Canada" },
  { value: "uk", label: "United Kingdom" },
  { value: "europe", label: "Europe" },
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
  const updateFilter = (key: keyof JobFiltersState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value && value !== "all" && value !== ""
  ).length;

  const activeFilters = Object.entries(filters)
    .filter(([key, value]) => value && value !== "all" && value !== "")
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
        <Select value={filters.jobType} onValueChange={(value) => updateFilter("jobType", value)}>
          <SelectTrigger className="w-[140px] h-10 rounded-xl bg-secondary border-0">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Job Type" />
          </SelectTrigger>
          <SelectContent>
            {jobTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.location} onValueChange={(value) => updateFilter("location", value)}>
          <SelectTrigger className="w-[160px] h-10 rounded-xl bg-secondary border-0">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((loc) => (
              <SelectItem key={loc.value} value={loc.value}>
                {loc.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.workMode} onValueChange={(value) => updateFilter("workMode", value)}>
          <SelectTrigger className="w-[140px] h-10 rounded-xl bg-secondary border-0">
            <SelectValue placeholder="Work Mode" />
          </SelectTrigger>
          <SelectContent>
            {workModes.map((mode) => (
              <SelectItem key={mode.value} value={mode.value}>
                {mode.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.salaryMin} onValueChange={(value) => updateFilter("salaryMin", value)}>
          <SelectTrigger className="w-[130px] h-10 rounded-xl bg-secondary border-0">
            <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Salary" />
          </SelectTrigger>
          <SelectContent>
            {salaryRanges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.datePosted} onValueChange={(value) => updateFilter("datePosted", value)}>
          <SelectTrigger className="w-[140px] h-10 rounded-xl bg-secondary border-0">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            {datePostedOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
              {value}
              <button
                onClick={() => updateFilter(key as keyof JobFiltersState, key === "search" ? "" : "all")}
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