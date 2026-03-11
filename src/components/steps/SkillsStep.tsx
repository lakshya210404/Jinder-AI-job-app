import { Code, X } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SkillsStepProps {
  data: {
    skills: string[];
  };
  onChange: (data: { skills: string[] }) => void;
}

const suggestedSkills = [
  "React", "TypeScript", "Python", "Node.js", "AWS", 
  "Docker", "SQL", "Git", "Figma", "GraphQL"
];

export const SkillsStep = ({ data, onChange }: SkillsStepProps) => {
  const [inputValue, setInputValue] = useState("");

  const addSkill = (skill: string) => {
    if (skill && !data.skills.includes(skill)) {
      onChange({ skills: [...data.skills, skill] });
    }
    setInputValue("");
  };

  const removeSkill = (skill: string) => {
    onChange({ skills: data.skills.filter((s) => s !== skill) });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill(inputValue);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6">
        <Code className="w-8 h-8 text-primary" />
      </div>
      
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
        Your Skills
      </h2>
      
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Add skills to help us match you with the right opportunities.
      </p>
      
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <Label className="text-foreground">Add Skills</Label>
          <Input
            placeholder="Type a skill and press Enter"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="bg-secondary border-border"
          />
        </div>

        {data.skills.length > 0 && (
          <div className="space-y-2">
            <Label className="text-foreground">Your Skills</Label>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill) => (
                <span
                  key={skill}
                  className="gradient-button text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="hover:bg-primary-foreground/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <Label className="text-muted-foreground">Suggested Skills</Label>
          <div className="flex flex-wrap gap-2">
            {suggestedSkills
              .filter((skill) => !data.skills.includes(skill))
              .map((skill) => (
                <button
                  key={skill}
                  onClick={() => addSkill(skill)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-muted transition-all"
                >
                  + {skill}
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
