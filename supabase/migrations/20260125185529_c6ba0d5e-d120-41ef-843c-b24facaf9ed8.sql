-- Add logo resolver to run hourly
SELECT cron.schedule(
  'logo-resolver-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hdijrothlipwlosltiwl.supabase.co/functions/v1/logo-resolver',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkaWpyb3RobGlwd2xvc2x0aXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MjU5OTcsImV4cCI6MjA4MTQwMTk5N30.87Lbb7cesQqtxzTTo7YJkZOLCZfmvRkDnGTpDekPB0g"}'::jsonb,
    body := '{"batch_size": 200}'::jsonb
  ) AS request_id;
  $$
);

-- Update job-ingestion to run every 30 minutes instead of 5 for all sources
SELECT cron.unschedule('job-ingestion-every-5-min');

SELECT cron.schedule(
  'job-ingestion-every-30-min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hdijrothlipwlosltiwl.supabase.co/functions/v1/job-ingestion',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkaWpyb3RobGlwd2xvc2x0aXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MjU5OTcsImV4cCI6MjA4MTQwMTk5N30.87Lbb7cesQqtxzTTo7YJkZOLCZfmvRkDnGTpDekPB0g"}'::jsonb,
    body := '{"limit": 20}'::jsonb
  ) AS request_id;
  $$
);