import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 via-purple/10 to-pink/10 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-gradient-to-br from-primary/10 via-card to-orange/5 border border-primary/20 rounded-3xl p-8 sm:p-12 text-center shadow-2xl shadow-primary/10">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to find your perfect match?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Join 50,000+ job seekers who've already discovered smarter job hunting with Jinder.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {["No credit card required", "Free forever tier", "Cancel anytime"].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full h-14 px-8 text-lg gap-2 shadow-lg shadow-primary/25">
              <Link to="/auth">
                Get started for free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full h-14 px-8 text-lg">
              <Link to="/pricing">
                View pricing
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
