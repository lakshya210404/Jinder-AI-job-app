import { User, Mail, Briefcase } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface ProfileStepProps {
  data: {
    name: string;
    email: string;
    title: string;
  };
  onChange: (data: { name: string; email: string; title: string }) => void;
}

export const ProfileStep = ({ data, onChange }: ProfileStepProps) => {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6">
        <User className="w-8 h-8 text-primary" />
      </div>
      
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
        Create Your Profile
      </h2>
      
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Let's get to know you better to find the perfect job matches.
      </p>
      
      <div className="w-full max-w-sm space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="name"
              placeholder="John Doe"
              value={data.name}
              onChange={(e) => onChange({ ...data, name: e.target.value })}
              className="pl-10 bg-secondary border-border"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={data.email}
              onChange={(e) => onChange({ ...data, email: e.target.value })}
              className="pl-10 bg-secondary border-border"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="title" className="text-foreground">Current Job Title</Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="title"
              placeholder="Software Engineer"
              value={data.title}
              onChange={(e) => onChange({ ...data, title: e.target.value })}
              className="pl-10 bg-secondary border-border"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
