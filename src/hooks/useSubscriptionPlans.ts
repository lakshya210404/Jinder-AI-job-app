import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type SubscriptionPlan = Tables<"subscription_plans">;

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });
}

export function useJobSeekerPlans() {
  const { data: plans, ...rest } = useSubscriptionPlans();
  
  const jobSeekerPlans = plans?.filter(
    (plan) => ["free", "pro", "power"].includes(plan.role)
  );
  
  return { data: jobSeekerPlans, ...rest };
}

export function useRecruiterPlans() {
  const { data: plans, ...rest } = useSubscriptionPlans();
  
  const recruiterPlans = plans?.filter(
    (plan) => plan.role === "recruiter"
  );
  
  return { data: recruiterPlans, ...rest };
}
