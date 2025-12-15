import { useState } from "react";
import { X, Heart, Undo2, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { JobCard, Job } from "./JobCard";
import { toast } from "@/hooks/use-toast";

const sampleJobs: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Developer",
    company: "TechCorp",
    location: "Remote",
    salary: "$120K-150K",
    type: "Full-time",
    logo: "🚀",
    description: "Join our team to build next-generation web applications using React, TypeScript, and modern tooling. Lead technical decisions and mentor junior developers.",
    skills: ["React", "TypeScript", "Node.js", "GraphQL"],
    postedAt: "2 hours ago",
  },
  {
    id: "2",
    title: "Full Stack Engineer",
    company: "StartupX",
    location: "San Francisco",
    salary: "$130K-160K",
    type: "Full-time",
    logo: "⚡",
    description: "Work on our core product that serves millions of users. You'll have ownership over entire features from database to UI.",
    skills: ["Python", "React", "AWS", "PostgreSQL"],
    postedAt: "5 hours ago",
  },
  {
    id: "3",
    title: "UI/UX Engineer",
    company: "DesignLab",
    location: "New York",
    salary: "$110K-140K",
    type: "Full-time",
    logo: "🎨",
    description: "Bridge the gap between design and engineering. Create beautiful, accessible interfaces that delight users.",
    skills: ["Figma", "React", "CSS", "Motion Design"],
    postedAt: "1 day ago",
  },
  {
    id: "4",
    title: "DevOps Engineer",
    company: "CloudNine",
    location: "Remote",
    salary: "$140K-170K",
    type: "Contract",
    logo: "☁️",
    description: "Design and maintain our cloud infrastructure. Implement CI/CD pipelines and ensure system reliability.",
    skills: ["AWS", "Kubernetes", "Terraform", "Docker"],
    postedAt: "3 days ago",
  },
];

export const SwipeInterface = () => {
  const [jobs, setJobs] = useState(sampleJobs);
  const [history, setHistory] = useState<Job[]>([]);
  const [animating, setAnimating] = useState<"left" | "right" | null>(null);
  const [applied, setApplied] = useState(0);

  const currentJob = jobs[0];

  const handleSwipe = (direction: "left" | "right") => {
    if (!currentJob || animating) return;

    setAnimating(direction);

    setTimeout(() => {
      if (direction === "right") {
        setApplied((prev) => prev + 1);
        toast({
          title: "Application Sent! 🎉",
          description: `Your AI-optimized resume has been sent to ${currentJob.company}.`,
        });
      }

      setHistory([currentJob, ...history]);
      setJobs(jobs.slice(1));
      setAnimating(null);
    }, 400);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastJob = history[0];
    setJobs([lastJob, ...jobs]);
    setHistory(history.slice(1));
    if (lastJob.id === sampleJobs.find(j => history.some(h => h.id === j.id))?.id) {
      setApplied((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold gradient-text">Jinder</h1>
          <p className="text-xs text-muted-foreground">{applied} applications sent</p>
        </div>
        <Button variant="icon" size="icon">
          <Sparkles className="w-5 h-5 text-primary" />
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {currentJob ? (
          <div className="relative w-full max-w-sm h-[500px]">
            <JobCard job={currentJob} isAnimating={animating} />
          </div>
        ) : (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No More Jobs</h2>
            <p className="text-muted-foreground">
              You've seen all available jobs. Check back later for more!
            </p>
          </div>
        )}
      </main>

      {currentJob && (
        <footer className="p-6 pb-8">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="icon"
              size="icon"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="w-12 h-12"
            >
              <Undo2 className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleSwipe("left")}
              className="w-16 h-16 rounded-full border-destructive/50 hover:bg-destructive/10 hover:border-destructive"
            >
              <X className="w-7 h-7 text-destructive" />
            </Button>
            <Button
              variant="gradient"
              size="icon"
              onClick={() => handleSwipe("right")}
              className="w-16 h-16 rounded-full"
            >
              <Heart className="w-7 h-7" />
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Swipe right to apply • Swipe left to skip
          </p>
        </footer>
      )}
    </div>
  );
};
