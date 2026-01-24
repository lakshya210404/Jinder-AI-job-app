-- =====================================================
-- CAREER ACCELERATION SAAS - FOUNDATION SCHEMA (FIXED)
-- =====================================================

-- 1. USER ROLES ENUM & TABLE
-- =====================================================
CREATE TYPE public.app_role AS ENUM ('free', 'pro', 'power', 'recruiter', 'admin');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'recruiter' THEN 2 
      WHEN 'power' THEN 3 
      WHEN 'pro' THEN 4 
      ELSE 5 
    END
  LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 2. SUBSCRIPTION PLANS TABLE
-- =====================================================
CREATE TABLE public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    role app_role NOT NULL,
    price_monthly INTEGER NOT NULL DEFAULT 0,
    price_yearly INTEGER,
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    limits JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
ON public.subscription_plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage plans"
ON public.subscription_plans FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 3. USER SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TYPE public.subscription_status AS ENUM (
    'active', 'canceled', 'past_due', 'trialing', 'paused', 'incomplete'
);

CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT UNIQUE,
    status subscription_status NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    canceled_at TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage subscriptions"
ON public.user_subscriptions FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 4. ENHANCED JOB SEEKER PROFILES
-- =====================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS graduation_date DATE,
ADD COLUMN IF NOT EXISTS visa_status TEXT,
ADD COLUMN IF NOT EXISTS work_authorization TEXT,
ADD COLUMN IF NOT EXISTS experience_level TEXT DEFAULT 'entry',
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS headline TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_open_to_work BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS preferred_locations TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS remote_preference TEXT DEFAULT 'flexible',
ADD COLUMN IF NOT EXISTS salary_min INTEGER,
ADD COLUMN IF NOT EXISTS salary_max INTEGER,
ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 5. COMPANY PROFILES (FOR RECRUITERS) - Create table first, policies later
-- =====================================================
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    logo_url TEXT,
    website TEXT,
    industry TEXT,
    company_size TEXT,
    description TEXT,
    headquarters TEXT,
    founded_year INTEGER,
    tech_stack TEXT[] DEFAULT '{}',
    benefits JSONB DEFAULT '[]'::jsonb,
    culture_keywords TEXT[] DEFAULT '{}',
    is_verified BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 6. RECRUITER PROFILES - Create before company policies
-- =====================================================
CREATE TABLE public.recruiter_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    job_title TEXT,
    department TEXT,
    linkedin_url TEXT,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_primary_contact BOOLEAN DEFAULT false,
    hiring_for TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recruiter_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view their own profile"
ON public.recruiter_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Recruiters can update their own profile"
ON public.recruiter_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Recruiters can insert their own profile"
ON public.recruiter_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage recruiter profiles"
ON public.recruiter_profiles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Now add company policies (after recruiter_profiles exists)
CREATE POLICY "Anyone can view companies"
ON public.companies FOR SELECT
USING (true);

CREATE POLICY "Recruiters can manage their companies"
ON public.companies FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.recruiter_profiles rp
        WHERE rp.company_id = companies.id
        AND rp.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all companies"
ON public.companies FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 7. USER PROJECTS (PROOF OF SKILL)
-- =====================================================
CREATE TABLE public.user_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tech_stack TEXT[] DEFAULT '{}',
    github_url TEXT,
    demo_url TEXT,
    architecture_diagram_url TEXT,
    thumbnail_url TEXT,
    performance_metrics JSONB DEFAULT '{}'::jsonb,
    scale_metrics JSONB DEFAULT '{}'::jsonb,
    start_date DATE,
    end_date DATE,
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own projects"
ON public.user_projects FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Public projects are viewable by everyone"
ON public.user_projects FOR SELECT
USING (is_public = true);

-- 8. USER RESUMES
-- =====================================================
CREATE TABLE public.user_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL DEFAULT 'Default Resume',
    original_file_url TEXT,
    parsed_content JSONB,
    tailored_content JSONB,
    target_job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    ats_score INTEGER,
    keyword_matches TEXT[] DEFAULT '{}',
    improvement_suggestions JSONB DEFAULT '[]'::jsonb,
    version INTEGER DEFAULT 1,
    is_primary BOOLEAN DEFAULT false,
    interview_count INTEGER DEFAULT 0,
    offer_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own resumes"
ON public.user_resumes FOR ALL
USING (auth.uid() = user_id);

-- 9. MATCH SCORES (AI MATCHING HISTORY)
-- =====================================================
CREATE TABLE public.job_match_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    overall_score INTEGER NOT NULL,
    skill_score INTEGER,
    experience_score INTEGER,
    education_score INTEGER,
    location_score INTEGER,
    visa_score INTEGER,
    strengths TEXT[] DEFAULT '{}',
    gaps TEXT[] DEFAULT '{}',
    learning_roadmap JSONB,
    offer_probability INTEGER,
    computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, job_id)
);

ALTER TABLE public.job_match_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own match scores"
ON public.job_match_scores FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own match scores"
ON public.job_match_scores FOR ALL
USING (auth.uid() = user_id);

-- 10. APPLICATION TRACKING
-- =====================================================
CREATE TYPE public.application_status AS ENUM (
    'saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn', 'accepted'
);

CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    resume_id UUID REFERENCES public.user_resumes(id) ON DELETE SET NULL,
    status application_status NOT NULL DEFAULT 'saved',
    applied_at TIMESTAMP WITH TIME ZONE,
    response_at TIMESTAMP WITH TIME ZONE,
    interview_dates TIMESTAMP WITH TIME ZONE[] DEFAULT '{}',
    offer_details JSONB,
    notes TEXT,
    follow_up_date DATE,
    referral_contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, job_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own applications"
ON public.applications FOR ALL
USING (auth.uid() = user_id);

-- 11. USAGE TRACKING (FOR LIMITS)
-- =====================================================
CREATE TABLE public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    feature TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
ON public.usage_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert usage logs"
ON public.usage_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 12. TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recruiter_profiles_updated_at
    BEFORE UPDATE ON public.recruiter_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_projects_updated_at
    BEFORE UPDATE ON public.user_projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_resumes_updated_at
    BEFORE UPDATE ON public.user_resumes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 13. AUTO-ASSIGN FREE ROLE ON NEW USER
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'free');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_add_role
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_role();

-- 14. SEED SUBSCRIPTION PLANS
-- =====================================================
INSERT INTO public.subscription_plans (name, slug, description, role, price_monthly, features, limits, display_order) VALUES
('Free', 'free', 'Get started with basic job browsing and limited features', 'free', 0,
 '["Job browsing", "Basic match score", "Limited resume tailoring (3/month)", "Application tracking (basic)", "Offer probability preview"]'::jsonb,
 '{"resume_tailors": 3, "job_alerts": 5, "match_details": false, "early_access": false}'::jsonb, 1),
('Pro', 'pro', 'Unlock full career acceleration tools', 'pro', 2500,
 '["Everything in Free", "Early job access", "Unlimited ATS resume tailoring", "Full match breakdown", "Skill gap roadmap", "Referral tools", "Full analytics dashboard", "Proof-of-skill profile"]'::jsonb,
 '{"resume_tailors": -1, "job_alerts": 50, "match_details": true, "early_access": true, "referral_requests": 10}'::jsonb, 2),
('Power', 'power', 'Maximum visibility and priority support', 'power', 4900,
 '["Everything in Pro", "Priority job alerts", "Featured recruiter visibility", "Weekly AI career audit", "Resume & profile boosts", "Direct recruiter intro credits", "Priority support"]'::jsonb,
 '{"resume_tailors": -1, "job_alerts": -1, "match_details": true, "early_access": true, "referral_requests": -1, "profile_boosts": 5, "recruiter_intros": 3}'::jsonb, 3),
('Recruiter Starter', 'recruiter-starter', 'Start hiring top talent', 'recruiter', 9900,
 '["Job postings (5/month)", "Ranked candidates", "Basic filters", "Company profile"]'::jsonb,
 '{"job_postings": 5, "candidate_views": 50, "messages": 20}'::jsonb, 4),
('Recruiter Growth', 'recruiter-growth', 'Scale your hiring pipeline', 'recruiter', 19900,
 '["Everything in Starter", "Unlimited job postings", "Messaging system", "Campus targeting", "Featured job listings", "Hiring analytics"]'::jsonb,
 '{"job_postings": -1, "candidate_views": 200, "messages": 100, "featured_jobs": 3}'::jsonb, 5),
('Recruiter Pro', 'recruiter-pro', 'Enterprise-grade hiring tools', 'recruiter', 29900,
 '["Everything in Growth", "Top talent pool access", "Advanced filtering", "Priority candidate recommendations", "Employer branding page", "Unlimited messaging"]'::jsonb,
 '{"job_postings": -1, "candidate_views": -1, "messages": -1, "featured_jobs": 10, "priority_recommendations": true}'::jsonb, 6);

-- 15. HELPFUL INDEXES
-- =====================================================
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_applications_user_id ON public.applications(user_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_job_match_scores_user_id ON public.job_match_scores(user_id);
CREATE INDEX idx_job_match_scores_job_id ON public.job_match_scores(job_id);
CREATE INDEX idx_user_projects_user_id ON public.user_projects(user_id);
CREATE INDEX idx_user_resumes_user_id ON public.user_resumes(user_id);
CREATE INDEX idx_usage_logs_user_feature ON public.usage_logs(user_id, feature, period_start);