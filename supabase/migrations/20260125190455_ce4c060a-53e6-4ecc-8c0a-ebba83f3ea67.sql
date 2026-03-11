-- ============================================
-- Freshness SLA + Reconciliation Model
-- ============================================

-- 1. Add reconciliation columns to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS description_raw TEXT,
ADD COLUMN IF NOT EXISTS description_text TEXT,
ADD COLUMN IF NOT EXISTS logo_storage_url TEXT;

-- Update existing jobs to set last_seen_at to their creation date if null
UPDATE public.jobs SET last_seen_at = COALESCE(first_seen_at, created_at) WHERE last_seen_at IS NULL;

-- 2. Add stale_count and expired_count to ingestion_logs for tracking
ALTER TABLE public.ingestion_logs
ADD COLUMN IF NOT EXISTS jobs_seen INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS jobs_stale INTEGER DEFAULT 0;

-- 3. Create ingestion_runs table for detailed run tracking (separate from logs)
CREATE TABLE IF NOT EXISTS public.ingestion_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES public.job_sources(id),
  run_type TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'manual', 'backfill'
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'success', 'failed'
  error_message TEXT,
  
  -- Detailed counts
  jobs_fetched INTEGER DEFAULT 0,
  jobs_new INTEGER DEFAULT 0,
  jobs_updated INTEGER DEFAULT 0,
  jobs_unchanged INTEGER DEFAULT 0,
  jobs_seen INTEGER DEFAULT 0,
  jobs_stale INTEGER DEFAULT 0,
  jobs_expired INTEGER DEFAULT 0,
  jobs_deduplicated INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  
  -- Sample job IDs for debugging
  sample_new_job_ids TEXT[],
  sample_updated_job_ids TEXT[],
  sample_expired_job_ids TEXT[],
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ingestion_runs
ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;

-- Admin-only access to ingestion runs
CREATE POLICY "Admins can manage ingestion runs" ON public.ingestion_runs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view ingestion runs" ON public.ingestion_runs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Add freshness tracking columns to job_sources
ALTER TABLE public.job_sources
ADD COLUMN IF NOT EXISTS success_count_24h INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS failure_count_24h INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS jobs_seen_24h INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS jobs_added_24h INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS jobs_updated_24h INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS jobs_expired_24h INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_stats_computed_at TIMESTAMP WITH TIME ZONE;

-- 5. Create index for efficient reconciliation queries
CREATE INDEX IF NOT EXISTS idx_jobs_source_last_seen ON public.jobs(source_id, last_seen_at);
CREATE INDEX IF NOT EXISTS idx_jobs_last_seen ON public.jobs(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_jobs_verification_status ON public.jobs(verification_status);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_source ON public.ingestion_runs(source_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_started ON public.ingestion_runs(started_at DESC);

-- 6. Create function to compute source 24h stats
CREATE OR REPLACE FUNCTION public.compute_source_stats()
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.job_sources js SET
    success_count_24h = COALESCE((
      SELECT COUNT(*) FROM public.ingestion_logs il 
      WHERE il.source_id = js.id 
      AND il.success = true 
      AND il.started_at > now() - interval '24 hours'
    ), 0),
    failure_count_24h = COALESCE((
      SELECT COUNT(*) FROM public.ingestion_logs il 
      WHERE il.source_id = js.id 
      AND il.success = false 
      AND il.started_at > now() - interval '24 hours'
    ), 0),
    jobs_seen_24h = COALESCE((
      SELECT SUM(il.jobs_fetched) FROM public.ingestion_logs il 
      WHERE il.source_id = js.id 
      AND il.started_at > now() - interval '24 hours'
    ), 0),
    jobs_added_24h = COALESCE((
      SELECT SUM(il.jobs_new) FROM public.ingestion_logs il 
      WHERE il.source_id = js.id 
      AND il.started_at > now() - interval '24 hours'
    ), 0),
    jobs_updated_24h = COALESCE((
      SELECT SUM(il.jobs_updated) FROM public.ingestion_logs il 
      WHERE il.source_id = js.id 
      AND il.started_at > now() - interval '24 hours'
    ), 0),
    jobs_expired_24h = COALESCE((
      SELECT SUM(il.jobs_expired) FROM public.ingestion_logs il 
      WHERE il.source_id = js.id 
      AND il.started_at > now() - interval '24 hours'
    ), 0),
    last_stats_computed_at = now();
END;
$$;

-- 7. Update job-verify cron to run every 4 hours instead of 15 min
SELECT cron.unschedule('job-verify-every-15-min');

SELECT cron.schedule(
  'job-verify-every-4-hours',
  '0 */4 * * *',
  $$
  SELECT net.http_post(
    url:='https://hdijrothlipwlosltiwl.supabase.co/functions/v1/job-verify',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkaWpyb3RobGlwd2xvc2x0aXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MjU5OTcsImV4cCI6MjA4MTQwMTk5N30.87Lbb7cesQqtxzTTo7YJkZOLCZfmvRkDnGTpDekPB0g"}'::jsonb,
    body:='{"limit": 50, "max_age_hours": 24}'::jsonb
  ) AS request_id;
  $$
);

-- 8. Add cron job to compute source stats hourly
SELECT cron.schedule(
  'compute-source-stats-hourly',
  '5 * * * *',
  $$SELECT public.compute_source_stats();$$
);

-- 9. Add cron job for reconciliation (stale/expired transitions) every 2 hours
SELECT cron.schedule(
  'job-reconciliation-every-2-hours',
  '30 */2 * * *',
  $$
  -- Mark jobs as stale if not seen in 24 hours
  UPDATE public.jobs SET verification_status = 'stale'
  WHERE verification_status = 'verified_active'
  AND last_seen_at < now() - interval '24 hours'
  AND last_seen_at > now() - interval '72 hours';
  
  -- Mark jobs as expired if not seen in 72 hours
  UPDATE public.jobs SET verification_status = 'expired'
  WHERE verification_status IN ('verified_active', 'stale')
  AND last_seen_at < now() - interval '72 hours';
  $$
);

-- 10. Storage bucket for logos (if not exists) - handled by migration
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-logos', 'job-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for job logos
CREATE POLICY "Job logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'job-logos');

CREATE POLICY "Service role can upload job logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'job-logos');

CREATE POLICY "Service role can update job logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'job-logos');

-- 11. Add weekly cron to check broken logos
SELECT cron.schedule(
  'check-broken-logos-weekly',
  '0 3 * * 0',
  $$
  SELECT net.http_post(
    url:='https://hdijrothlipwlosltiwl.supabase.co/functions/v1/logo-resolver',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkaWpyb3RobGlwd2xvc2x0aXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MjU5OTcsImV4cCI6MjA4MTQwMTk5N30.87Lbb7cesQqtxzTTo7YJkZOLCZfmvRkDnGTpDekPB0g"}'::jsonb,
    body:='{"batch_size": 500, "check_broken": true}'::jsonb
  ) AS request_id;
  $$
);