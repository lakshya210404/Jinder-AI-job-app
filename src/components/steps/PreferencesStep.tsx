import { MapPin, DollarSign, Clock, Briefcase } from "lucide-react";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";
import { CountryCombobox } from "../ui/country-combobox";
import { InterestsCombobox } from "../ui/interests-combobox";

interface PreferencesStepProps {
  data: {
    locations: string[];
    interests: string[];
    salary: string;
    workType: string;
  };
  onChange: (data: { locations: string[]; interests: string[]; salary: string; workType: string }) => void;
}

const salaries = ["$50K-80K", "$80K-120K", "$120K-150K", "$150K+"];
const workTypes = ["Full-time", "Part-time", "Contract", "Freelance"];

export const PreferencesStep = ({ data, onChange }: PreferencesStepProps) => {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6">
        <MapPin className="w-8 h-8 text-primary" />
      </div>
      
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
        Your Preferences
      </h2>
      
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Tell us what you're looking for in your next role.
      </p>
      
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            Preferred Locations
          </Label>
          <CountryCombobox
            value={data.locations}
            onChange={(locations) => onChange({ ...data, locations })}
            placeholder="Select your preferred countries..."
            multiSelect
          />
        </div>

        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-foreground">
            <Briefcase className="w-4 h-4 text-primary" />
            Job Interests
          </Label>
          <InterestsCombobox
            value={data.interests}
            onChange={(interests) => onChange({ ...data, interests })}
            placeholder="Select your interests..."
          />
        </div>
        
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-foreground">
            <DollarSign className="w-4 h-4 text-primary" />
            Salary Range
          </Label>
          <div className="flex flex-wrap gap-2">
            {salaries.map((sal) => (
              <button
                key={sal}
                onClick={() => onChange({ ...data, salary: sal })}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  data.salary === sal
                    ? "gradient-button text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-muted"
                )}
              >
                {sal}
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-foreground">
            <Clock className="w-4 h-4 text-primary" />
            Work Type
          </Label>
          <div className="flex flex-wrap gap-2">
            {workTypes.map((type) => (
              <button
                key={type}
                onClick={() => onChange({ ...data, workType: type })}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  data.workType === type
                    ? "gradient-button text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-muted"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
