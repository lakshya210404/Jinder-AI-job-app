import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Users, Briefcase, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { JinderLogo } from "@/components/JinderLogo";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-secondary/20">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-primary/20 to-purple/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-orange/15 to-pink/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-teal/10 to-blue/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Social proof badge */}
        <div className="flex justify-center mb-8">
          <Badge 
            variant="outline" 
            className="gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border-primary/20 text-muted-foreground hover:border-primary/40 transition-colors"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Join 50,000+ job seekers using Jinder</span>
            <div className="flex -space-x-2 ml-2">
              {["bg-purple", "bg-blue", "bg-teal", "bg-orange"].map((color, i) => (
                <div key={i} className={`w-5 h-5 rounded-full ${color} border-2 border-background`} />
              ))}
            </div>
          </Badge>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
          <span className="text-foreground">Your career's</span>
          <br />
          <span className="relative">
            <span className="bg-gradient-to-r from-primary via-orange to-pink bg-clip-text text-transparent">
              perfect match
            </span>
            <svg
              className="absolute -bottom-2 left-0 right-0 w-full h-3 text-primary/40"
              viewBox="0 0 200 8"
              preserveAspectRatio="none"
            >
              <path
                d="M0 7c50-7 100-7 200 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="text-foreground"> is waiting</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          AI-powered job matching, one-click resume tailoring, recruiter contacts, 
          and interview prep. <span className="text-foreground font-medium">We'll get you hired.</span>
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Button asChild size="lg" className="rounded-full h-14 px-8 text-lg gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
            <Link to="/auth">
              Get started for free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full h-14 px-8 text-lg">
            <Link to="/jobs">
              Browse jobs
            </Link>
          </Button>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-3xl font-bold text-foreground">
              <Briefcase className="h-6 w-6 text-primary" />
              10K+
            </div>
            <span className="text-sm text-muted-foreground">Active Jobs</span>
          </div>
          <div className="w-px h-12 bg-border hidden sm:block" />
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-3xl font-bold text-foreground">
              <Users className="h-6 w-6 text-teal" />
              50K+
            </div>
            <span className="text-sm text-muted-foreground">Users</span>
          </div>
          <div className="w-px h-12 bg-border hidden sm:block" />
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-3xl font-bold text-foreground">
              <Target className="h-6 w-6 text-orange" />
              85%
            </div>
            <span className="text-sm text-muted-foreground">Match Rate</span>
          </div>
        </div>
      </div>
    </section>
  );
}
