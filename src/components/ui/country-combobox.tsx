import * as React from "react";
import { ChevronsUpDown, MapPin, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

const locations = [
  // Remote
  { value: "remote", label: "Remote (Anywhere)", type: "remote" },
  
  // United States - Cities
  { value: "new-york-ny-usa", label: "New York, NY, USA", type: "city" },
  { value: "los-angeles-ca-usa", label: "Los Angeles, CA, USA", type: "city" },
  { value: "chicago-il-usa", label: "Chicago, IL, USA", type: "city" },
  { value: "houston-tx-usa", label: "Houston, TX, USA", type: "city" },
  { value: "phoenix-az-usa", label: "Phoenix, AZ, USA", type: "city" },
  { value: "san-francisco-ca-usa", label: "San Francisco, CA, USA", type: "city" },
  { value: "seattle-wa-usa", label: "Seattle, WA, USA", type: "city" },
  { value: "austin-tx-usa", label: "Austin, TX, USA", type: "city" },
  { value: "boston-ma-usa", label: "Boston, MA, USA", type: "city" },
  { value: "denver-co-usa", label: "Denver, CO, USA", type: "city" },
  { value: "miami-fl-usa", label: "Miami, FL, USA", type: "city" },
  { value: "atlanta-ga-usa", label: "Atlanta, GA, USA", type: "city" },
  { value: "dallas-tx-usa", label: "Dallas, TX, USA", type: "city" },
  { value: "san-diego-ca-usa", label: "San Diego, CA, USA", type: "city" },
  { value: "portland-or-usa", label: "Portland, OR, USA", type: "city" },
  
  // Canada - Cities
  { value: "toronto-on-canada", label: "Toronto, ON, Canada", type: "city" },
  { value: "vancouver-bc-canada", label: "Vancouver, BC, Canada", type: "city" },
  { value: "montreal-qc-canada", label: "Montreal, QC, Canada", type: "city" },
  { value: "calgary-ab-canada", label: "Calgary, AB, Canada", type: "city" },
  { value: "ottawa-on-canada", label: "Ottawa, ON, Canada", type: "city" },
  
  // United Kingdom - Cities
  { value: "london-uk", label: "London, UK", type: "city" },
  { value: "manchester-uk", label: "Manchester, UK", type: "city" },
  { value: "birmingham-uk", label: "Birmingham, UK", type: "city" },
  { value: "edinburgh-uk", label: "Edinburgh, UK", type: "city" },
  { value: "bristol-uk", label: "Bristol, UK", type: "city" },
  
  // Germany - Cities
  { value: "berlin-germany", label: "Berlin, Germany", type: "city" },
  { value: "munich-germany", label: "Munich, Germany", type: "city" },
  { value: "frankfurt-germany", label: "Frankfurt, Germany", type: "city" },
  { value: "hamburg-germany", label: "Hamburg, Germany", type: "city" },
  
  // France - Cities
  { value: "paris-france", label: "Paris, France", type: "city" },
  { value: "lyon-france", label: "Lyon, France", type: "city" },
  { value: "marseille-france", label: "Marseille, France", type: "city" },
  
  // Australia - Cities
  { value: "sydney-australia", label: "Sydney, Australia", type: "city" },
  { value: "melbourne-australia", label: "Melbourne, Australia", type: "city" },
  { value: "brisbane-australia", label: "Brisbane, Australia", type: "city" },
  
  // India - Cities
  { value: "bangalore-india", label: "Bangalore, India", type: "city" },
  { value: "mumbai-india", label: "Mumbai, India", type: "city" },
  { value: "delhi-india", label: "Delhi, India", type: "city" },
  { value: "hyderabad-india", label: "Hyderabad, India", type: "city" },
  { value: "pune-india", label: "Pune, India", type: "city" },
  
  // Singapore
  { value: "singapore", label: "Singapore", type: "city" },
  
  // Netherlands - Cities
  { value: "amsterdam-netherlands", label: "Amsterdam, Netherlands", type: "city" },
  
  // Ireland - Cities
  { value: "dublin-ireland", label: "Dublin, Ireland", type: "city" },
  
  // Japan - Cities
  { value: "tokyo-japan", label: "Tokyo, Japan", type: "city" },
  { value: "osaka-japan", label: "Osaka, Japan", type: "city" },
  
  // Brazil - Cities
  { value: "sao-paulo-brazil", label: "São Paulo, Brazil", type: "city" },
  { value: "rio-de-janeiro-brazil", label: "Rio de Janeiro, Brazil", type: "city" },
  
  // UAE - Cities
  { value: "dubai-uae", label: "Dubai, UAE", type: "city" },
  { value: "abu-dhabi-uae", label: "Abu Dhabi, UAE", type: "city" },
  
  // Other major cities
  { value: "tel-aviv-israel", label: "Tel Aviv, Israel", type: "city" },
  { value: "zurich-switzerland", label: "Zurich, Switzerland", type: "city" },
  { value: "stockholm-sweden", label: "Stockholm, Sweden", type: "city" },
  { value: "copenhagen-denmark", label: "Copenhagen, Denmark", type: "city" },
  { value: "barcelona-spain", label: "Barcelona, Spain", type: "city" },
  { value: "madrid-spain", label: "Madrid, Spain", type: "city" },
  { value: "lisbon-portugal", label: "Lisbon, Portugal", type: "city" },
  { value: "hong-kong", label: "Hong Kong", type: "city" },
  { value: "seoul-south-korea", label: "Seoul, South Korea", type: "city" },
  { value: "beijing-china", label: "Beijing, China", type: "city" },
  { value: "shanghai-china", label: "Shanghai, China", type: "city" },
];

// Single select props
interface SingleSelectProps {
  value: string;
  onChange: (value: string) => void;
  multiSelect?: false;
  placeholder?: string;
  className?: string;
}

// Multi select props
interface MultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  multiSelect: true;
  placeholder?: string;
  className?: string;
}

type CountryComboboxProps = SingleSelectProps | MultiSelectProps;

// Custom checkbox component matching the reference image
const CustomCheckbox = ({ checked }: { checked: boolean }) => (
  <div 
    className={cn(
      "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
      checked 
        ? "bg-primary border-primary" 
        : "border-muted-foreground/40 bg-transparent"
    )}
  >
    {checked && (
      <svg 
        className="h-3 w-3 text-primary-foreground" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={3}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )}
  </div>
);

export function CountryCombobox(props: CountryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const { placeholder = "Select location...", className, multiSelect } = props;

  const filteredLocations = locations.filter((location) =>
    location.label.toLowerCase().includes(search.toLowerCase())
  );

  if (multiSelect) {
    const { value, onChange } = props as MultiSelectProps;
    
    const selectedLocations = locations.filter((location) =>
      value.some(
        (v) =>
          location.label.toLowerCase() === v.toLowerCase() ||
          location.value === v.toLowerCase()
      )
    );

    const toggleLocation = (locationLabel: string) => {
      const isSelected = value.some(
        (v) => v.toLowerCase() === locationLabel.toLowerCase()
      );
      if (isSelected) {
        onChange(value.filter((v) => v.toLowerCase() !== locationLabel.toLowerCase()));
      } else {
        onChange([...value, locationLabel]);
      }
    };

    const removeLocation = (locationLabel: string) => {
      onChange(value.filter((v) => v.toLowerCase() !== locationLabel.toLowerCase()));
    };

    const isSelected = (locationLabel: string) => 
      value.some((v) => v.toLowerCase() === locationLabel.toLowerCase());

    const getDisplayText = () => {
      if (selectedLocations.length === 0) return placeholder;
      if (selectedLocations.length === 1) return selectedLocations[0].label;
      return `${selectedLocations.length} locations selected`;
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
                selectedLocations.length === 0 && "text-muted-foreground",
                className
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
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
                  placeholder="Search locations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 bg-muted/50 border-0"
                />
              </div>
            </div>
            <ScrollArea className="h-[220px]">
              <div className="py-1">
                {filteredLocations.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No location found.
                  </div>
                ) : (
                  filteredLocations.map((location) => (
                    <button
                      key={location.value}
                      type="button"
                      onClick={() => toggleLocation(location.label)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-muted/80 cursor-pointer transition-colors text-left"
                    >
                      <CustomCheckbox checked={isSelected(location.label)} />
                      <span className="text-sm">{location.label}</span>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
        
        {selectedLocations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedLocations.map((location) => (
              <Badge
                key={location.value}
                variant="secondary"
                className="rounded-full px-2.5 py-0.5 text-xs gap-1"
              >
                {location.label}
                <button
                  onClick={() => removeLocation(location.label)}
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

  // Single select mode
  const { value, onChange } = props as SingleSelectProps;
  
  const selectedLocation = locations.find(
    (location) =>
      location.label.toLowerCase() === value.toLowerCase() ||
      location.value === value.toLowerCase()
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-background border border-border hover:bg-muted/50 text-left font-normal h-10 rounded-lg",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{selectedLocation?.label || value || placeholder}</span>
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
              placeholder="Search locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 bg-muted/50 border-0"
            />
          </div>
        </div>
        <ScrollArea className="h-[220px]">
          <div className="py-1">
            {filteredLocations.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No location found.
              </div>
            ) : (
              filteredLocations.map((location) => (
                <button
                  key={location.value}
                  type="button"
                  onClick={() => {
                    onChange(location.label);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-muted/80 cursor-pointer transition-colors text-left"
                >
                  <CustomCheckbox checked={selectedLocation?.value === location.value} />
                  <span className="text-sm">{location.label}</span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
