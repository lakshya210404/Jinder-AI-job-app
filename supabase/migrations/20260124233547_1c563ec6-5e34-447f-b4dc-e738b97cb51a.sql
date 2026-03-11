-- Schedule job ingestion to run every 5 minutes
SELECT cron.schedule(
  'job-ingestion-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hdijrothlipwlosltiwl.supabase.co/functions/v1/job-ingestion',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkaWpyb3RobGlwd2xvc2x0aXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MjU5OTcsImV4cCI6MjA4MTQwMTk5N30.87Lbb7cesQqtxzTTo7YJkZOLCZfmvRkDnGTpDekPB0g"}'::jsonb,
    body := '{"source_type": "greenhouse", "limit": 10}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule job verification to run every 15 minutes
SELECT cron.schedule(
  'job-verify-every-15-min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hdijrothlipwlosltiwl.supabase.co/functions/v1/job-verify',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkaWpyb3RobGlwd2xvc2x0aXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MjU5OTcsImV4cCI6MjA4MTQwMTk5N30.87Lbb7cesQqtxzTTo7YJkZOLCZfmvRkDnGTpDekPB0g"}'::jsonb,
    body := '{"limit": 20}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule AI classification to run every 10 minutes
SELECT cron.schedule(
  'job-classify-every-10-min',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hdijrothlipwlosltiwl.supabase.co/functions/v1/job-classify',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkaWpyb3RobGlwd2xvc2x0aXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MjU5OTcsImV4cCI6MjA4MTQwMTk5N30.87Lbb7cesQqtxzTTo7YJkZOLCZfmvRkDnGTpDekPB0g"}'::jsonb,
    body := '{"limit": 5}'::jsonb
  ) AS request_id;
  $$
);