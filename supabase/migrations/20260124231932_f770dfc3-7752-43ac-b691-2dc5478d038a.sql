-- Fix search_path for generate_job_hash
CREATE OR REPLACE FUNCTION public.generate_job_hash(
  p_title TEXT,
  p_company TEXT,
  p_location TEXT,
  p_apply_url TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path TO public
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

-- Fix search_path for calculate_freshness_rank
CREATE OR REPLACE FUNCTION public.calculate_freshness_rank(posted TIMESTAMP WITH TIME ZONE)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
SET search_path TO public
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