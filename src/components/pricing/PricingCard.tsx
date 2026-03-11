import { Check, Sparkles, Zap, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SubscriptionPlan } from "@/hooks/useSubscriptionPlans";

interface PricingCardProps {
  plan: SubscriptionPlan;
  isPopular?: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
  isCurrentPlan?: boolean;
  isLoading?: boolean;
}

const roleIcons = {
  free: Sparkles,
  pro: Zap,
  power: Crown,
  recruiter: Sparkles,
  admin: Crown,
};

const roleColors = {
  free: "from-muted to-secondary",
  pro: "from-primary/20 to-primary/5",
  power: "from-[hsl(var(--color-orange))]/20 to-[hsl(var(--color-pink))]/10",
  recruiter: "from-[hsl(var(--color-teal))]/20 to-[hsl(var(--color-blue))]/10",
  admin: "from-[hsl(var(--color-purple))]/20 to-[hsl(var(--color-pink))]/10",
};

export function PricingCard({ plan, isPopular, onSelect, isCurrentPlan, isLoading }: PricingCardProps) {
  const Icon = roleIcons[plan.role] || Sparkles;
  const features = (plan.features as string[]) || [];
  const priceInDollars = plan.price_monthly / 100;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-3xl border p-6 transition-all duration-300",
        isPopular
          ? "border-primary shadow-xl shadow-primary/10 scale-105 bg-gradient-to-b"
          : "border-border bg-card hover:border-primary/50 hover:shadow-lg",
        roleColors[plan.role]
      )}
    >
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1">
          Most Popular
        </Badge>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              isPopular ? "bg-primary text-primary-foreground" : "bg-secondary"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">{plan.name}</h3>
            {isCurrentPlan && (
              <Badge variant="outline" className="text-xs">
                Current Plan
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">
            {priceInDollars === 0 ? "Free" : `$${priceInDollars}`}
          </span>
          {priceInDollars > 0 && (
            <span className="text-muted-foreground">/month</span>
          )}
        </div>
      </div>

      {/* Features */}
      <ul className="mb-8 flex-1 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <div
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                isPopular
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary text-foreground"
              )}
            >
              <Check className="h-3 w-3" />
            </div>
            <span className="text-sm text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        onClick={() => onSelect(plan)}
        variant={isPopular ? "gradient" : "outline"}
        size="lg"
        className="w-full"
        disabled={isCurrentPlan || isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isCurrentPlan ? (
          "Current Plan"
        ) : priceInDollars === 0 ? (
          "Get Started"
        ) : (
          "Upgrade Now"
        )}
      </Button>
    </div>
  );
}
