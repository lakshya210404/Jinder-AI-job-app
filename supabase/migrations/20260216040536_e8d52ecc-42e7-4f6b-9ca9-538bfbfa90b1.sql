
-- Schedule job ingestion every 4 hours (polls all 20 sources)
SELECT cron.schedule(
  'job-ingestion-pipeline',
  '0 */4 * * *',
  $$
  SELECT net.http_post(
    url := 'https://hdijrothlipwlosltiwl.supabase.co/functions/v1/job-ingestion',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkaWpyb3RobGlwd2xvc2x0aXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MjU5OTcsImV4cCI6MjA4MTQwMTk5N30.87Lbb7cesQqtxzTTo7YJkZOLCZfmvRkDnGTpDekPB0g"}'::jsonb,
    body := '{"limit": 20, "run_type": "scheduled"}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);

-- Quick refresh every hour (5 sources at a time, prioritizing oldest polled)
SELECT cron.schedule(
  'job-ingestion-hourly',
  '30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://hdijrothlipwlosltiwl.supabase.co/functions/v1/job-ingestion',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkaWpyb3RobGlwd2xvc2x0aXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MjU5OTcsImV4cCI6MjA4MTQwMTk5N30.87Lbb7cesQqtxzTTo7YJkZOLCZfmvRkDnGTpDekPB0g"}'::jsonb,
    body := '{"limit": 5, "run_type": "scheduled"}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
