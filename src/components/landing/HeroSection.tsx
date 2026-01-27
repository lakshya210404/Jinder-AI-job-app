import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        {/* Main headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-foreground leading-[1.1] mb-6">
          Find your next role,
          <br />
          <span className="text-primary">effortlessly.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
          AI-powered job matching. One-click resume tailoring. 
          Thousands of opportunities from top companies.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <Button asChild size="lg" className="h-11 px-6 rounded-lg gap-2">
            <Link to="/auth">
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11 px-6 rounded-lg">
            <Link to="/jobs">
              Browse jobs
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-12 text-center">
          <div>
            <div className="text-2xl font-semibold text-foreground">10K+</div>
            <div className="text-sm text-muted-foreground">Active jobs</div>
          </div>
          <div className="w-px h-10 bg-border" />
          <div>
            <div className="text-2xl font-semibold text-foreground">50K+</div>
            <div className="text-sm text-muted-foreground">Users</div>
          </div>
          <div className="w-px h-10 bg-border" />
          <div>
            <div className="text-2xl font-semibold text-foreground">85%</div>
            <div className="text-sm text-muted-foreground">Match rate</div>
          </div>
        </div>
      </div>
    </section>
  );
}
