import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ScrollReveal } from "@/components/animations";

export function CTASection() {
  return (
    <section className="py-28 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-3xl sm:text-4xl font-serif mb-4">
            Ready to find your next role?
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            Join thousands of job seekers who've already made the switch. It's free to start.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="h-13 px-8 rounded-full gap-2 text-base shadow-lg warm-glow">
              <Link to="/auth">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-13 px-8 rounded-full text-base">
              <Link to="/pricing">View pricing</Link>
            </Button>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={0.3}>
          <p className="mt-8 text-sm text-muted-foreground">
            No credit card required · Free forever tier
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
