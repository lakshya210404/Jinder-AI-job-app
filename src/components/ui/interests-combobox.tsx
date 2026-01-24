import * as React from "react";
import { ChevronsUpDown, Briefcase, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

const interests = [
  { value: "software-engineering", label: "Software Engineering" },
  { value: "data-science", label: "Data Science" },
  { value: "machine-learning", label: "Machine Learning / AI" },
  { value: "web-development", label: "Web Development" },
  { value: "mobile-development", label: "Mobile Development" },
  { value: "devops", label: "DevOps / Cloud" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "product-management", label: "Product Management" },
  { value: "ui-ux-design", label: "UI/UX Design" },
  { value: "graphic-design", label: "Graphic Design" },
  { value: "marketing", label: "Marketing" },
  { value: "digital-marketing", label: "Digital Marketing" },
  { value: "sales", label: "Sales" },
  { value: "business-development", label: "Business Development" },
  { value: "finance", label: "Finance" },
  { value: "accounting", label: "Accounting" },
  { value: "human-resources", label: "Human Resources" },
  { value: "recruiting", label: "Recruiting" },
  { value: "operations", label: "Operations" },
  { value: "project-management", label: "Project Management" },
  { value: "consulting", label: "Consulting" },
  { value: "legal", label: "Legal" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "research", label: "Research" },
  { value: "engineering", label: "Engineering (General)" },
  { value: "mechanical-engineering", label: "Mechanical Engineering" },
  { value: "electrical-engineering", label: "Electrical Engineering" },
  { value: "civil-engineering", label: "Civil Engineering" },
  { value: "architecture", label: "Architecture" },
  { value: "media-entertainment", label: "Media & Entertainment" },
  { value: "journalism", label: "Journalism" },
  { value: "content-writing", label: "Content Writing" },
  { value: "customer-support", label: "Customer Support" },
  { value: "real-estate", label: "Real Estate" },
  { value: "hospitality", label: "Hospitality" },
  { value: "retail", label: "Retail" },
  { value: "supply-chain", label: "Supply Chain / Logistics" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "nonprofit", label: "Nonprofit / NGO" },
  { value: "government", label: "Government" },
  { value: "entrepreneurship", label: "Entrepreneurship / Startups" },
  { value: "blockchain", label: "Blockchain / Web3" },
  { value: "gaming", label: "Gaming" },
  { value: "environmental", label: "Environmental / Sustainability" },
];

interface InterestsComboboxProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function InterestsCombobox({
  value,
  onChange,
  placeholder = "Select interests...",
  className,
}: InterestsComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filteredInterests = interests.filter((interest) =>
    interest.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedInterests = interests.filter((interest) =>
    value.some(
      (v) =>
        interest.label.toLowerCase() === v.toLowerCase() ||
        interest.value === v.toLowerCase()
    )
  );

  const toggleInterest = (interestLabel: string) => {
    const isSelected = value.some(
      (v) => v.toLowerCase() === interestLabel.toLowerCase()
    );
    if (isSelected) {
      onChange(value.filter((v) => v.toLowerCase() !== interestLabel.toLowerCase()));
    } else {
      onChange([...value, interestLabel]);
    }
  };

  const removeInterest = (interestLabel: string) => {
    onChange(value.filter((v) => v.toLowerCase() !== interestLabel.toLowerCase()));
  };

  const isSelected = (interestLabel: string) =>
    value.some((v) => v.toLowerCase() === interestLabel.toLowerCase());

  const getDisplayText = () => {
    if (selectedInterests.length === 0) return placeholder;
    if (selectedInterests.length === 1) return selectedInterests[0].label;
    return `${selectedInterests.length} interests selected`;
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between bg-background border border-border hover:bg-muted/50 text-left font-normal h-10 rounded-lg",
              selectedInterests.length === 0 && "text-muted-foreground",
              className
            )}
          >
            <span className="flex items-center gap-2 truncate">
              <Briefcase className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{getDisplayText()}</span>
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[--radix-popover-trigger-width] p-0 bg-popover border border-border shadow-lg rounded-lg z-50" 
          align="start"
        >
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search interests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 bg-muted/50 border-0"
              />
            </div>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="p-1">
              {filteredInterests.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No interest found.
                </div>
              ) : (
                filteredInterests.map((interest) => (
                  <label
                    key={interest.value}
                    className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={isSelected(interest.label)}
                      onCheckedChange={() => toggleInterest(interest.label)}
                      className="border-muted-foreground/50"
                    />
                    <span className="text-sm">{interest.label}</span>
                  </label>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {selectedInterests.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedInterests.map((interest) => (
            <Badge
              key={interest.value}
              variant="secondary"
              className="rounded-full px-2.5 py-0.5 text-xs gap-1"
            >
              {interest.label}
              <button
                onClick={() => removeInterest(interest.label)}
                className="ml-0.5 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
