import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollReveal } from "@/components/animations";

const features = [
  {
    id: "jobs",
    icon: Briefcase,
    title: "Smart Job Board",
    description: "Curated listings from top companies with AI-powered matching that understands your unique strengths.",
    highlights: ["10,000+ verified listings", "Real-time salary data", "AI match scores"],
  },
  {
    id: "resume",
    icon: FileText,
    title: "AI Resume Builder",
    description: "Create ATS-optimized resumes tailored to any job in seconds — not hours.",
    highlights: ["One-click tailoring", "ATS score checker", "Multiple formats"],
  },
  {
    id: "ai",
    icon: Sparkles,
    title: "Career AI",
    description: "Get personalized insights and recommendations to supercharge your job search.",
    highlights: ["Interview prep", "Salary insights", "Application tracking"],
  },
];

export function FeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState(features[0].id);
  const active = features.find((f) => f.id === activeFeature)!;

  return (
    <section className="py-28 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-serif mb-4">
            Everything you need to land your next role
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            From discovery to offer — we've got you covered.
          </p>
        </ScrollReveal>

        {/* Feature cards as tabs */}
        <ScrollReveal delay={0.1}>
          <div className="grid grid-cols-3 gap-3 mb-10">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature.id)}
                className={cn(
                  "relative p-4 sm:p-5 rounded-2xl text-left transition-all duration-300 border",
                  activeFeature === feature.id
                    ? "bg-card border-primary/30 shadow-lg"
                    : "bg-transparent border-border hover:bg-card hover:border-border"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors",
                    activeFeature === feature.id ? "bg-primary/15 text-primary" : "bg-accent text-muted-foreground"
                  )}
                >
                  <feature.icon className="h-5 w-5" />
                </div>
                <span className={cn(
                  "text-sm font-semibold block",
                  activeFeature === feature.id ? "text-foreground" : "text-muted-foreground"
                )}>
                  {feature.title}
                </span>
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Active feature detail */}
        <ScrollReveal delay={0.2}>
          <div className="organic-card p-8 sm:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="text-center"
              >
                <h3 className="text-2xl font-serif mb-3">{active.title}</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">{active.description}</p>

                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  {active.highlights.map((highlight, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2 text-sm text-foreground bg-accent/60 px-4 py-2 rounded-full"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {highlight}
                    </motion.span>
                  ))}
                </div>

                <Button className="rounded-full gap-2 px-6 shadow-sm">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
