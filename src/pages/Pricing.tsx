import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Zap, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PricingCard } from "@/components/pricing/PricingCard";
import { PricingToggle } from "@/components/pricing/PricingToggle";
import { useJobSeekerPlans, useRecruiterPlans } from "@/hooks/useSubscriptionPlans";
import type { SubscriptionPlan } from "@/hooks/useSubscriptionPlans";
import { toast } from "sonner";

type PlanCategory = "seeker" | "recruiter";

export default function Pricing() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<PlanCategory>("seeker");
  
  const { data: seekerPlans, isLoading: seekerLoading } = useJobSeekerPlans();
  const { data: recruiterPlans, isLoading: recruiterLoading } = useRecruiterPlans();

  const plans = category === "seeker" ? seekerPlans : recruiterPlans;
  const isLoading = category === "seeker" ? seekerLoading : recruiterLoading;

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan.price_monthly === 0) {
      navigate("/auth");
    } else {
      // TODO: Integrate Stripe checkout
      toast.info("Stripe checkout coming soon!", {
        description: `Selected: ${plan.name} - $${plan.price_monthly / 100}/month`,
      });
    }
  };

  const popularPlanSlug = category === "seeker" ? "pro" : "recruiter-growth";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 apple-blur border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Pricing</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Accelerate Your Career Journey
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Choose the perfect plan to unlock your full potential. Start free, upgrade when you're ready.
          </p>
          <PricingToggle value={category} onChange={setCategory} />
        </div>

        {/* Plans Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[500px] rounded-3xl bg-secondary/50 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div
            className={`grid gap-6 max-w-5xl mx-auto ${
              category === "seeker" ? "md:grid-cols-3" : "md:grid-cols-3"
            }`}
          >
            {plans?.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                isPopular={plan.slug === popularPlanSlug}
                onSelect={handleSelectPlan}
              />
            ))}
          </div>
        )}

        {/* Trust Badges */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[hsl(var(--color-green))]" />
            <span className="text-sm">Secure Payments</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[hsl(var(--color-orange))]" />
            <span className="text-sm">Cancel Anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <span className="text-sm">24/7 Support</span>
          </div>
        </div>

        {/* FAQ Teaser */}
        <div className="mt-20 text-center">
          <h3 className="text-xl font-semibold mb-2">Have questions?</h3>
          <p className="text-muted-foreground mb-4">
            We're here to help you choose the right plan.
          </p>
          <Button variant="outline" onClick={() => navigate("/settings")}>
            Contact Support
          </Button>
        </div>
      </main>
    </div>
  );
}
