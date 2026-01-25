import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  Mail, 
  FileText, 
  User, 
  Sparkles, 
  Target,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    id: "jobs",
    icon: Briefcase,
    iconColor: "text-primary",
    bgColor: "bg-primary/10",
    title: "Job Board",
    description: "Discover jobs from top companies, curated daily with AI-powered matching.",
    highlights: [
      "10,000+ verified listings",
      "Real-time salary insights",
      "AI match scores",
      "One-click apply"
    ],
    preview: (
      <div className="space-y-3">
        {[
          { company: "Google", role: "Software Engineer Intern", salary: "$100K - $120K", badge: "Today", match: 92 },
          { company: "Stripe", role: "Product Designer", salary: "$95K - $115K", badge: "Hot", match: 88 },
          { company: "Notion", role: "Full Stack Developer", salary: "$90K - $110K", badge: "New", match: 85 },
        ].map((job, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple to-blue flex items-center justify-center text-white font-bold text-sm">
              {job.company[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{job.role}</span>
                <Badge variant="outline" className="rounded-full text-[10px] bg-green/10 text-green border-green/30 shrink-0">
                  {job.badge}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{job.company}</span>
                <span>•</span>
                <span className="text-green">{job.salary}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green to-teal flex items-center justify-center text-white font-bold text-xs">
              {job.match}%
            </div>
          </div>
        ))}
      </div>
    )
  },
  {
    id: "contacts",
    icon: Mail,
    iconColor: "text-teal",
    bgColor: "bg-teal/10",
    title: "Contact Finder",
    description: "Find recruiter emails at any company. Cold outreach made easy.",
    highlights: [
      "Direct recruiter emails",
      "Verified contacts",
      "Email templates",
      "Response tracking"
    ],
    preview: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue to-purple flex items-center justify-center">
            <span className="text-white font-bold text-xs">G</span>
          </div>
          <span className="font-medium text-sm">Google</span>
          <Badge variant="outline" className="ml-auto rounded-full text-[10px]">3 contacts</Badge>
        </div>
        {[
          { name: "Sarah Chen", title: "Technical Recruiter", email: "s.chen@google.com" },
          { name: "Michael Torres", title: "University Recruiter", email: "m.torres@google.com" },
          { name: "Jessica Park", title: "Talent Acquisition", email: "Reveal" },
        ].map((contact, i) => (
          <div key={i} className="flex items-center gap-3 p-2 bg-card rounded-lg border border-border">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple to-pink flex items-center justify-center text-white font-bold text-xs">
              {contact.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{contact.name}</div>
              <div className="text-xs text-muted-foreground truncate">{contact.title}</div>
            </div>
            <Badge variant={contact.email === "Reveal" ? "default" : "outline"} className="text-[10px] rounded-full">
              {contact.email === "Reveal" ? "Reveal" : contact.email}
            </Badge>
          </div>
        ))}
        <div className="text-center text-xs text-muted-foreground">Credits: 47 remaining</div>
      </div>
    )
  },
  {
    id: "resume",
    icon: FileText,
    iconColor: "text-orange",
    bgColor: "bg-orange/10",
    title: "AI Resume Builder",
    description: "Create ATS-optimized resumes and tailor them to any job in one click.",
    highlights: [
      "AI-powered tailoring",
      "ATS score checker",
      "Multiple templates",
      "1-click export"
    ],
    preview: (
      <div className="space-y-3">
        <div className="p-3 bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">ATS Score</span>
            <Badge className="bg-green/15 text-green border-green/30 rounded-full">92%</Badge>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full w-[92%] bg-gradient-to-r from-green to-teal rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["[Targeted] SWE Intern", "Base Resume", "PM Resume", "New Draft"].map((name, i) => (
            <div key={i} className="p-2 bg-card rounded-lg border border-border hover:border-primary/30 transition-colors">
              <div className="h-16 bg-secondary rounded mb-2" />
              <div className="text-xs font-medium truncate">{name}</div>
              <div className="text-[10px] text-muted-foreground">Edited 3hrs ago</div>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: "interview",
    icon: MessageSquare,
    iconColor: "text-pink",
    bgColor: "bg-pink/10",
    title: "Interview Prep AI",
    description: "Get AI-generated practice questions and tips specific to each job.",
    highlights: [
      "Job-specific questions",
      "AI mock interviews",
      "Answer feedback",
      "Salary negotiation tips"
    ],
    preview: (
      <div className="space-y-3">
        <div className="p-3 bg-card rounded-xl border border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Practice Question</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            "Tell me about a time you optimized a system for scale..."
          </p>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-[10px] rounded-full">Behavioral</Badge>
            <Badge variant="outline" className="text-[10px] rounded-full">Senior Level</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-card rounded-lg border border-border text-center">
            <div className="text-2xl font-bold text-primary">24</div>
            <div className="text-[10px] text-muted-foreground">Questions Practiced</div>
          </div>
          <div className="p-2 bg-card rounded-lg border border-border text-center">
            <div className="text-2xl font-bold text-green">85%</div>
            <div className="text-[10px] text-muted-foreground">Avg. Score</div>
          </div>
        </div>
      </div>
    )
  }
];

export function FeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState(features[0].id);
  const active = features.find(f => f.id === activeFeature)!;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 rounded-full px-4 py-1">
            <Sparkles className="h-3 w-3 mr-1 text-primary" />
            All-in-one platform
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything you need to land your dream job
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From job discovery to offer negotiation, Jinder has you covered with AI-powered tools.
          </p>
        </div>

        {/* Feature tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => setActiveFeature(feature.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                activeFeature === feature.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
              )}
            >
              <feature.icon className="h-4 w-4" />
              <span className="font-medium text-sm">{feature.title}</span>
            </button>
          ))}
        </div>

        {/* Feature content */}
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left: Description */}
          <div className="space-y-6">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", active.bgColor)}>
              <active.icon className={cn("h-7 w-7", active.iconColor)} />
            </div>
            <h3 className="text-2xl font-bold">{active.title}</h3>
            <p className="text-lg text-muted-foreground">{active.description}</p>
            <ul className="space-y-3">
              {active.highlights.map((highlight, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green shrink-0" />
                  <span className="text-muted-foreground">{highlight}</span>
                </li>
              ))}
            </ul>
            <Button className="rounded-full gap-2">
              Learn more
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Right: Preview */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-orange/10 rounded-3xl blur-xl" />
            <div className="relative bg-card border border-border rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/80" />
                  <div className="w-3 h-3 rounded-full bg-orange/80" />
                  <div className="w-3 h-3 rounded-full bg-green/80" />
                </div>
                <span className="text-xs text-muted-foreground ml-2">Dashboard → {active.title}</span>
              </div>
              {active.preview}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
