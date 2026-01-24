import * as React from "react";
import { Check, ChevronsUpDown, Briefcase, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

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

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between bg-secondary border-0 text-left font-normal",
              selectedInterests.length === 0 && "text-muted-foreground",
              className
            )}
          >
            <span className="flex items-center gap-2 truncate">
              <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
              {selectedInterests.length === 0
                ? placeholder
                : `${selectedInterests.length} ${selectedInterests.length === 1 ? "interest" : "interests"} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover z-50" align="start">
          <Command>
            <CommandInput placeholder="Search interests..." />
            <CommandList>
              <CommandEmpty>No interest found.</CommandEmpty>
              <CommandGroup>
                {interests.map((interest) => {
                  const isSelected = selectedInterests.some(
                    (i) => i.value === interest.value
                  );
                  return (
                    <CommandItem
                      key={interest.value}
                      value={interest.label}
                      onSelect={() => toggleInterest(interest.label)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {interest.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
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
