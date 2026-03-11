import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Shield, Zap, MessageCircle, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PricingCard } from "@/components/pricing/PricingCard";
import { PricingToggle } from "@/components/pricing/PricingToggle";
import { useJobSeekerPlans, useRecruiterPlans } from "@/hooks/useSubscriptionPlans";
import { useSubscription, STRIPE_PRICES } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import type { SubscriptionPlan } from "@/hooks/useSubscriptionPlans";
import { toast } from "sonner";

type PlanCategory = "seeker" | "recruiter";

export default function Pricing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [category, setCategory] = useState<PlanCategory>("seeker");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  
  const { data: seekerPlans, isLoading: seekerLoading } = useJobSeekerPlans();
  const { data: recruiterPlans, isLoading: recruiterLoading } = useRecruiterPlans();
  const { planSlug, subscribed, createCheckout, openCustomerPortal, checkSubscription, isLoading: subLoading } = useSubscription();

  const plans = category === "seeker" ? seekerPlans : recruiterPlans;
  const isLoading = category === "seeker" ? seekerLoading : recruiterLoading;

  // Handle success/cancel URL params
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Subscription activated! 🎉", {
        description: "Welcome to your new plan. Enjoy the premium features!",
      });
      checkSubscription();
    } else if (searchParams.get("canceled") === "true") {
      toast.info("Checkout canceled", {
        description: "No changes were made to your subscription.",
      });
    }
  }, [searchParams, checkSubscription]);

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    // Free plan - just navigate to signup
    if (plan.price_monthly === 0) {
      if (!user) {
        navigate("/auth");
      }
      return;
    }

    // Check if plan is available for Stripe checkout
    const stripePlan = STRIPE_PRICES[plan.slug as keyof typeof STRIPE_PRICES];
    if (!stripePlan) {
      toast.info("Coming soon!", {
        description: `${plan.name} plan checkout will be available soon.`,
      });
      return;
    }

    // Require auth for paid plans
    if (!user) {
      toast.info("Please sign in first", {
        description: "You need to be logged in to upgrade your plan.",
      });
      navigate("/auth");
      return;
    }

    setLoadingPlan(plan.slug);
    try {
      const url = await createCheckout(plan.slug);
      window.open(url, "_blank");
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Failed to start checkout", {
        description: err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPlan("manage");
    try {
      const url = await openCustomerPortal();
      window.open(url, "_blank");
    } catch (err) {
      console.error("Portal error:", err);
      toast.error("Failed to open billing portal", {
        description: err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setLoadingPlan(null);
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
          {subscribed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleManageSubscription}
              disabled={loadingPlan === "manage"}
              className="rounded-full"
            >
              {loadingPlan === "manage" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Settings className="h-5 w-5" />
              )}
            </Button>
          )}
          {!subscribed && <div className="w-10" />}
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
          
          {user && (
            <div className="mt-4 text-sm text-muted-foreground">
              Current plan: <span className="font-medium text-foreground capitalize">{planSlug}</span>
              {subLoading && <Loader2 className="inline ml-2 h-3 w-3 animate-spin" />}
            </div>
          )}
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
                isCurrentPlan={plan.slug === planSlug}
                isLoading={loadingPlan === plan.slug}
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

        {/* Manage Subscription CTA */}
        {subscribed && (
          <div className="mt-12 text-center">
            <Button 
              variant="outline" 
              onClick={handleManageSubscription}
              disabled={loadingPlan === "manage"}
            >
              {loadingPlan === "manage" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Manage Subscription
            </Button>
          </div>
        )}

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
