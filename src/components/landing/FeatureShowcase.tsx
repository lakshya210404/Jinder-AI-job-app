import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  FileText, 
  Sparkles,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    id: "jobs",
    icon: Briefcase,
    title: "Smart Job Board",
    description: "Curated listings from top companies with AI-powered matching.",
    highlights: [
      "10,000+ verified listings",
      "Real-time salary data",
      "AI match scores",
    ],
  },
  {
    id: "resume",
    icon: FileText,
    title: "AI Resume Builder",
    description: "Create ATS-optimized resumes tailored to any job in seconds.",
    highlights: [
      "One-click tailoring",
      "ATS score checker",
      "Multiple formats",
    ],
  },
  {
    id: "ai",
    icon: Sparkles,
    title: "Career AI",
    description: "Get personalized insights and recommendations for your job search.",
    highlights: [
      "Interview prep",
      "Salary insights",
      "Application tracking",
    ],
  },
];

export function FeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState(features[0].id);
  const active = features.find(f => f.id === activeFeature)!;

  return (
    <section className="py-24 px-4 sm:px-6 bg-secondary/30">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            Everything you need
          </h2>
          <p className="text-muted-foreground">
            From discovery to offer, we've got you covered.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-1 p-1 bg-secondary rounded-lg mb-10 max-w-md mx-auto">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => setActiveFeature(feature.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm transition-all",
                activeFeature === feature.id
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <feature.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{feature.title.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <active.icon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{active.title}</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">{active.description}</p>
          
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {active.highlights.map((highlight, i) => (
              <span key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {highlight}
              </span>
            ))}
          </div>
          
          <Button className="rounded-lg gap-2">
            Get started
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
