-- =============================================
-- JOB INTELLIGENCE PIPELINE SCHEMA
-- =============================================

-- Job Source Types
CREATE TYPE public.job_source_type AS ENUM (
  'greenhouse', 'lever', 'ashby', 'workday', 
  'career_page', 'rss_feed', 'sitemap', 'manual'
);

-- Job Source Status
CREATE TYPE public.source_status AS ENUM (
  'active', 'paused', 'failing', 'disabled'
);

-- Job Verification Status
CREATE TYPE public.job_verification_status AS ENUM (
  'pending', 'verified_active', 'stale', 'expired', 'removed'
);

-- Role Type Classification
CREATE TYPE public.role_type AS ENUM (
  'internship', 'new_grad', 'part_time', 'full_time', 'contract', 'unknown'
);

-- =============================================
-- JOB SOURCES TABLE
-- =============================================
CREATE TABLE public.job_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  source_type job_source_type NOT NULL,
  company_name TEXT NOT NULL,
  company_slug TEXT,
  base_url TEXT NOT NULL,
  api_endpoint TEXT,
  logo_url TEXT,
  
  -- Polling configuration
  poll_interval_minutes INTEGER NOT NULL DEFAULT 30,
  last_poll_at TIMESTAMP WITH TIME ZONE,
  next_poll_at TIMESTAMP WITH TIME ZONE,
  
  -- Health metrics
  status source_status NOT NULL DEFAULT 'active',
  consecutive_failures INTEGER DEFAULT 0,
  last_success_at TIMESTAMP WITH TIME ZONE,
  last_failure_at TIMESTAMP WITH TIME ZONE,
  last_error_message TEXT,
  
  -- Statistics
  total_jobs_ingested INTEGER DEFAULT 0,
  active_job_count INTEGER DEFAULT 0,
  reliability_score NUMERIC(3,2) DEFAULT 1.00,
  
  -- Metadata
  is_priority_source BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(source_type, company_slug)
);

-- =============================================
-- INGESTION LOGS TABLE
-- =============================================
CREATE TABLE public.ingestion_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES public.job_sources(id) ON DELETE CASCADE,
  
  -- Ingestion results
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  
  -- Counts
  jobs_fetched INTEGER DEFAULT 0,
  jobs_new INTEGER DEFAULT 0,
  jobs_updated INTEGER DEFAULT 0,
  jobs_deduplicated INTEGER DEFAULT 0,
  jobs_expired INTEGER DEFAULT 0,
  
  -- Status
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  error_details JSONB,
  
  -- Debug info
  raw_response_sample JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- ENHANCE JOBS TABLE
-- =============================================
ALTER TABLE public.jobs 
  ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES public.job_sources(id),
  ADD COLUMN IF NOT EXISTS external_job_id TEXT,
  ADD COLUMN IF NOT EXISTS job_hash TEXT,
  ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS verification_status job_verification_status DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS role_type role_type DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS experience_level_parsed TEXT,
  ADD COLUMN IF NOT EXISTS tech_stack TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS education_requirements TEXT,
  ADD COLUMN IF NOT EXISTS visa_sponsorship BOOLEAN,
  ADD COLUMN IF NOT EXISTS salary_currency TEXT,
  ADD COLUMN IF NOT EXISTS is_remote BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS hiring_urgency_score INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS student_relevance_score INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS competition_score INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS freshness_rank INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overall_rank_score INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS ai_classification_done BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_classification_at TIMESTAMP WITH TIME ZONE;

-- =============================================
-- JOB VERIFICATIONS TABLE
-- =============================================
CREATE TABLE public.job_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  
  verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  http_status INTEGER,
  is_accessible BOOLEAN,
  page_title TEXT,
  
  -- Detection signals
  apply_button_found BOOLEAN,
  job_closed_signal BOOLEAN,
  redirect_detected BOOLEAN,
  redirect_url TEXT,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_job_sources_status ON public.job_sources(status);
CREATE INDEX idx_job_sources_next_poll ON public.job_sources(next_poll_at) WHERE status = 'active';
CREATE INDEX idx_job_sources_type ON public.job_sources(source_type);

CREATE INDEX idx_ingestion_logs_source ON public.ingestion_logs(source_id);
CREATE INDEX idx_ingestion_logs_started ON public.ingestion_logs(started_at DESC);

CREATE INDEX idx_jobs_hash ON public.jobs(job_hash);
CREATE INDEX idx_jobs_external_id ON public.jobs(external_job_id);
CREATE INDEX idx_jobs_source ON public.jobs(source_id);
CREATE INDEX idx_jobs_verification ON public.jobs(verification_status);
CREATE INDEX idx_jobs_role_type ON public.jobs(role_type);
CREATE INDEX idx_jobs_first_seen ON public.jobs(first_seen_at DESC);
CREATE INDEX idx_jobs_overall_rank ON public.jobs(overall_rank_score DESC);
CREATE INDEX idx_jobs_freshness ON public.jobs(freshness_rank DESC);
CREATE INDEX idx_jobs_ai_pending ON public.jobs(ai_classification_done) WHERE ai_classification_done = false;

CREATE INDEX idx_job_verifications_job ON public.job_verifications(job_id);

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE public.job_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_verifications ENABLE ROW LEVEL SECURITY;

-- Job sources: Admins can manage, everyone can view
CREATE POLICY "Anyone can view job sources" ON public.job_sources
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage job sources" ON public.job_sources
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Ingestion logs: Admins only
CREATE POLICY "Admins can view ingestion logs" ON public.ingestion_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage ingestion logs" ON public.ingestion_logs
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Job verifications: Admins only
CREATE POLICY "Admins can view verifications" ON public.job_verifications
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage verifications" ON public.job_verifications
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_job_sources_updated_at
  BEFORE UPDATE ON public.job_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Generate job hash for deduplication
CREATE OR REPLACE FUNCTION public.generate_job_hash(
  p_title TEXT,
  p_company TEXT,
  p_location TEXT,
  p_apply_url TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(
    sha256(
      (lower(trim(coalesce(p_title, ''))) || '|' ||
       lower(trim(coalesce(p_company, ''))) || '|' ||
       lower(trim(coalesce(p_location, ''))) || '|' ||
       lower(trim(coalesce(p_apply_url, ''))))::bytea
    ),
    'hex'
  )
$$;

-- Calculate freshness rank based on posted date
CREATE OR REPLACE FUNCTION public.calculate_freshness_rank(posted TIMESTAMP WITH TIME ZONE)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN posted IS NULL THEN 0
    WHEN posted > now() - interval '6 hours' THEN 100
    WHEN posted > now() - interval '1 day' THEN 90
    WHEN posted > now() - interval '3 days' THEN 75
    WHEN posted > now() - interval '7 days' THEN 50
    WHEN posted > now() - interval '14 days' THEN 30
    WHEN posted > now() - interval '30 days' THEN 15
    ELSE 5
  END
$$;

-- Update overall rank score
CREATE OR REPLACE FUNCTION public.update_job_rank_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  NEW.freshness_rank := calculate_freshness_rank(NEW.posted_date);
  NEW.overall_rank_score := (
    (NEW.freshness_rank * 0.3) +
    (COALESCE(NEW.hiring_urgency_score, 50) * 0.25) +
    (COALESCE(NEW.student_relevance_score, 50) * 0.25) +
    (100 - COALESCE(NEW.competition_score, 50)) * 0.2
  )::INTEGER;
  RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_job_rank
  BEFORE INSERT OR UPDATE OF posted_date, hiring_urgency_score, student_relevance_score, competition_score
  ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_rank_score();

-- =============================================
-- SEED INITIAL JOB SOURCES
-- =============================================
INSERT INTO public.job_sources (name, source_type, company_name, company_slug, base_url, api_endpoint, is_priority_source, tags)
VALUES 
  ('Stripe Careers', 'greenhouse', 'Stripe', 'stripe', 'https://stripe.com/jobs', 'https://boards-api.greenhouse.io/v1/boards/stripe/jobs', true, ARRAY['fintech', 'payments']),
  ('Figma Careers', 'lever', 'Figma', 'figma', 'https://figma.com/careers', 'https://api.lever.co/v0/postings/figma', true, ARRAY['design', 'tools']),
  ('Notion Careers', 'greenhouse', 'Notion', 'notion', 'https://notion.so/careers', 'https://boards-api.greenhouse.io/v1/boards/notion/jobs', true, ARRAY['productivity', 'tools']),
  ('Linear Careers', 'lever', 'Linear', 'linear', 'https://linear.app/careers', 'https://api.lever.co/v0/postings/linear', true, ARRAY['devtools', 'productivity']),
  ('Vercel Careers', 'greenhouse', 'Vercel', 'vercel', 'https://vercel.com/careers', 'https://boards-api.greenhouse.io/v1/boards/vercel/jobs', true, ARRAY['devtools', 'infrastructure']),
  ('Anthropic Careers', 'greenhouse', 'Anthropic', 'anthropic', 'https://anthropic.com/careers', 'https://boards-api.greenhouse.io/v1/boards/anthropic/jobs', true, ARRAY['ai', 'ml']),
  ('OpenAI Careers', 'greenhouse', 'OpenAI', 'openai', 'https://openai.com/careers', 'https://boards-api.greenhouse.io/v1/boards/openai/jobs', true, ARRAY['ai', 'ml']),
  ('Airbnb Careers', 'greenhouse', 'Airbnb', 'airbnb', 'https://airbnb.com/careers', 'https://boards-api.greenhouse.io/v1/boards/airbnb/jobs', true, ARRAY['travel', 'marketplace']),
  ('Coinbase Careers', 'greenhouse', 'Coinbase', 'coinbase', 'https://coinbase.com/careers', 'https://boards-api.greenhouse.io/v1/boards/coinbase/jobs', true, ARRAY['crypto', 'fintech']),
  ('Ramp Careers', 'greenhouse', 'Ramp', 'ramp', 'https://ramp.com/careers', 'https://boards-api.greenhouse.io/v1/boards/ramp/jobs', true, ARRAY['fintech', 'b2b'])
ON CONFLICT DO NOTHING;