import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SubscriptionState {
  subscribed: boolean;
  planSlug: string;
  productId: string | null;
  subscriptionEnd: string | null;
  isLoading: boolean;
  error: string | null;
}

// Stripe price mapping
export const STRIPE_PRICES = {
  pro: {
    priceId: "price_1StFwPGN4iR7R5FfCneJYOSB",
    productId: "prod_TqxsqwBXUWh8e4",
  },
  power: {
    priceId: "price_1StFwbGN4iR7R5FfQjHUojun",
    productId: "prod_TqxsTKL0wXBhTp",
  },
} as const;

export function useSubscription() {
  const { user, session } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    planSlug: "free",
    productId: null,
    subscriptionEnd: null,
    isLoading: false,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    if (!session) {
      setState({
        subscribed: false,
        planSlug: "free",
        productId: null,
        subscriptionEnd: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");

      if (error) throw error;

      setState({
        subscribed: data.subscribed,
        planSlug: data.plan_slug || "free",
        productId: data.product_id,
        subscriptionEnd: data.subscription_end,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error("Error checking subscription:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to check subscription",
      }));
    }
  }, [session]);

  // Check on mount and when session changes
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh every minute
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [session, checkSubscription]);

  const createCheckout = async (planSlug: string) => {
    if (!session) {
      throw new Error("You must be logged in to upgrade");
    }

    const planConfig = STRIPE_PRICES[planSlug as keyof typeof STRIPE_PRICES];
    if (!planConfig) {
      throw new Error("Invalid plan selected");
    }

    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId: planConfig.priceId, planSlug },
    });

    if (error) throw error;
    if (!data?.url) throw new Error("Failed to create checkout session");

    return data.url;
  };

  const openCustomerPortal = async () => {
    if (!session) {
      throw new Error("You must be logged in to manage subscription");
    }

    const { data, error } = await supabase.functions.invoke("customer-portal");

    if (error) throw error;
    if (!data?.url) throw new Error("Failed to create portal session");

    return data.url;
  };

  return {
    ...state,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    isPro: state.planSlug === "pro" || state.planSlug === "power",
    isPower: state.planSlug === "power",
  };
}
