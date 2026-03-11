-- Fix recruiter_profiles RLS: restrict SELECT to owner and admins only
-- Currently any authenticated user can view other recruiters' contact info

-- First drop the existing permissive SELECT policy if it exists (checking conditions)
DO $$ 
BEGIN
  -- Drop any SELECT policy that might allow broad access
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recruiter_profiles' 
    AND policyname = 'Recruiters can view their own profile'
  ) THEN
    DROP POLICY "Recruiters can view their own profile" ON public.recruiter_profiles;
  END IF;
END $$;

-- Create new restrictive SELECT policy: only owner or admin can view
CREATE POLICY "Recruiters can view own profile or admins can view all"
ON public.recruiter_profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- Fix subscription_plans RLS: restrict to authenticated users only
-- Currently allows anonymous users to see pricing/Stripe IDs

-- Drop the existing public SELECT policy
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscription_plans' 
    AND policyname = 'Anyone can view active plans'
  ) THEN
    DROP POLICY "Anyone can view active plans" ON public.subscription_plans;
  END IF;
END $$;

-- Create new policy: only authenticated users can view active plans
-- This prevents anonymous scraping while still allowing logged-in users to see pricing
CREATE POLICY "Authenticated users can view active plans"
ON public.subscription_plans
FOR SELECT
USING (
  is_active = true 
  AND auth.uid() IS NOT NULL
);

-- Also ensure admins can still manage all plans
-- This policy should already exist but we'll ensure it's there
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscription_plans' 
    AND policyname = 'Admins can manage plans'
  ) THEN
    CREATE POLICY "Admins can manage plans"
    ON public.subscription_plans
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;