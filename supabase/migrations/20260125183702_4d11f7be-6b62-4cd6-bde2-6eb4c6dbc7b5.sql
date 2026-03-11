-- Add more global job sources
INSERT INTO job_sources (
  name, source_type, company_name, company_slug, base_url, api_endpoint, 
  status, poll_interval_minutes, is_priority_source, tags
) 
SELECT * FROM (VALUES
  ('Plaid Careers', 'greenhouse'::job_source_type, 'Plaid', 'plaid', 'https://plaid.com/careers', 'https://boards-api.greenhouse.io/v1/boards/plaid/jobs', 'active'::source_status, 30, true, ARRAY['fintech']),
  ('Brex Careers', 'greenhouse'::job_source_type, 'Brex', 'brex', 'https://brex.com/careers', 'https://boards-api.greenhouse.io/v1/boards/brex/jobs', 'active'::source_status, 30, true, ARRAY['fintech']),
  ('Datadog Careers', 'greenhouse'::job_source_type, 'Datadog', 'datadog', 'https://datadoghq.com/careers', 'https://boards-api.greenhouse.io/v1/boards/datadog/jobs', 'active'::source_status, 30, true, ARRAY['devtools']),
  ('Cloudflare Careers', 'greenhouse'::job_source_type, 'Cloudflare', 'cloudflare', 'https://cloudflare.com/careers', 'https://boards-api.greenhouse.io/v1/boards/cloudflare/jobs', 'active'::source_status, 30, true, ARRAY['infrastructure']),
  ('Airtable Careers', 'greenhouse'::job_source_type, 'Airtable', 'airtable', 'https://airtable.com/careers', 'https://boards-api.greenhouse.io/v1/boards/airtable/jobs', 'active'::source_status, 30, true, ARRAY['productivity']),
  ('MongoDB Careers', 'greenhouse'::job_source_type, 'MongoDB', 'mongodb', 'https://mongodb.com/careers', 'https://boards-api.greenhouse.io/v1/boards/mongodb/jobs', 'active'::source_status, 30, true, ARRAY['database']),
  ('Twilio Careers', 'greenhouse'::job_source_type, 'Twilio', 'twilio', 'https://twilio.com/careers', 'https://boards-api.greenhouse.io/v1/boards/twilio/jobs', 'active'::source_status, 30, true, ARRAY['communications']),
  ('DoorDash Careers', 'greenhouse'::job_source_type, 'DoorDash', 'doordash', 'https://doordash.com/careers', 'https://boards-api.greenhouse.io/v1/boards/doordash/jobs', 'active'::source_status, 30, true, ARRAY['delivery']),
  ('Instacart Careers', 'greenhouse'::job_source_type, 'Instacart', 'instacart', 'https://instacart.com/careers', 'https://boards-api.greenhouse.io/v1/boards/instacart/jobs', 'active'::source_status, 30, true, ARRAY['delivery']),
  ('Lyft Careers', 'greenhouse'::job_source_type, 'Lyft', 'lyft', 'https://lyft.com/careers', 'https://boards-api.greenhouse.io/v1/boards/lyft/jobs', 'active'::source_status, 30, true, ARRAY['transportation']),
  ('Pinterest Careers', 'greenhouse'::job_source_type, 'Pinterest', 'pinterest', 'https://pinterest.com/careers', 'https://boards-api.greenhouse.io/v1/boards/pinterest/jobs', 'active'::source_status, 30, true, ARRAY['social']),
  ('Snap Careers', 'greenhouse'::job_source_type, 'Snap', 'snap', 'https://snap.com/careers', 'https://boards-api.greenhouse.io/v1/boards/snap/jobs', 'active'::source_status, 30, true, ARRAY['social']),
  ('Discord Careers', 'greenhouse'::job_source_type, 'Discord', 'discord', 'https://discord.com/careers', 'https://boards-api.greenhouse.io/v1/boards/discord/jobs', 'active'::source_status, 30, true, ARRAY['communication']),
  ('Robinhood Careers', 'greenhouse'::job_source_type, 'Robinhood', 'robinhood', 'https://robinhood.com/careers', 'https://boards-api.greenhouse.io/v1/boards/robinhood/jobs', 'active'::source_status, 30, true, ARRAY['fintech']),
  ('Spotify Careers', 'greenhouse'::job_source_type, 'Spotify', 'spotify', 'https://spotify.com/careers', 'https://boards-api.greenhouse.io/v1/boards/spotify/jobs', 'active'::source_status, 30, true, ARRAY['music']),
  ('Netflix Careers', 'greenhouse'::job_source_type, 'Netflix', 'netflix', 'https://netflix.com/jobs', 'https://boards-api.greenhouse.io/v1/boards/netflix/jobs', 'active'::source_status, 30, true, ARRAY['entertainment']),
  ('Uber Careers', 'greenhouse'::job_source_type, 'Uber', 'uber', 'https://uber.com/careers', 'https://boards-api.greenhouse.io/v1/boards/uber/jobs', 'active'::source_status, 30, true, ARRAY['transportation']),
  ('Dropbox Careers', 'greenhouse'::job_source_type, 'Dropbox', 'dropbox', 'https://dropbox.com/jobs', 'https://boards-api.greenhouse.io/v1/boards/dropbox/jobs', 'active'::source_status, 30, true, ARRAY['storage']),
  ('GitLab Careers', 'greenhouse'::job_source_type, 'GitLab', 'gitlab', 'https://gitlab.com/jobs', 'https://boards-api.greenhouse.io/v1/boards/gitlab/jobs', 'active'::source_status, 30, true, ARRAY['devtools']),
  ('Snowflake Careers', 'greenhouse'::job_source_type, 'Snowflake', 'snowflake', 'https://snowflake.com/careers', 'https://boards-api.greenhouse.io/v1/boards/snowflakecomputing/jobs', 'active'::source_status, 30, true, ARRAY['data']),
  ('Asana Careers', 'greenhouse'::job_source_type, 'Asana', 'asana', 'https://asana.com/careers', 'https://boards-api.greenhouse.io/v1/boards/asana/jobs', 'active'::source_status, 30, false, ARRAY['productivity']),
  ('HubSpot Careers', 'greenhouse'::job_source_type, 'HubSpot', 'hubspot', 'https://hubspot.com/careers', 'https://boards-api.greenhouse.io/v1/boards/hubspot/jobs', 'active'::source_status, 30, false, ARRAY['marketing']),
  ('Squarespace Careers', 'greenhouse'::job_source_type, 'Squarespace', 'squarespace', 'https://squarespace.com/careers', 'https://boards-api.greenhouse.io/v1/boards/squarespace/jobs', 'active'::source_status, 30, false, ARRAY['web']),
  ('Elastic Careers', 'greenhouse'::job_source_type, 'Elastic', 'elastic', 'https://elastic.co/careers', 'https://boards-api.greenhouse.io/v1/boards/elastic/jobs', 'active'::source_status, 30, false, ARRAY['search']),
  ('Databricks Careers', 'greenhouse'::job_source_type, 'Databricks', 'databricks', 'https://databricks.com/careers', 'https://boards-api.greenhouse.io/v1/boards/databricks/jobs', 'active'::source_status, 30, true, ARRAY['data']),
  -- More Lever companies
  ('Retool Careers', 'lever'::job_source_type, 'Retool', 'retool', 'https://retool.com/careers', 'https://api.lever.co/v0/postings/retool', 'active'::source_status, 30, true, ARRAY['devtools']),
  ('Supabase Careers', 'lever'::job_source_type, 'Supabase', 'supabase', 'https://supabase.com/careers', 'https://api.lever.co/v0/postings/supabase', 'active'::source_status, 30, true, ARRAY['database']),
  ('Vercel Careers Alt', 'lever'::job_source_type, 'Vercel', 'vercel-lever', 'https://vercel.com/careers', 'https://api.lever.co/v0/postings/vercel', 'active'::source_status, 30, false, ARRAY['infrastructure']),
  ('Rippling Careers', 'lever'::job_source_type, 'Rippling', 'rippling', 'https://rippling.com/careers', 'https://api.lever.co/v0/postings/rippling', 'active'::source_status, 30, true, ARRAY['hr']),
  ('Anduril Careers', 'lever'::job_source_type, 'Anduril', 'anduril', 'https://anduril.com/careers', 'https://api.lever.co/v0/postings/anduril', 'active'::source_status, 30, true, ARRAY['defense']),
  ('Scale AI Careers', 'lever'::job_source_type, 'Scale AI', 'scaleai', 'https://scale.com/careers', 'https://api.lever.co/v0/postings/scaleai', 'active'::source_status, 30, true, ARRAY['ai']),
  ('Cruise Careers', 'lever'::job_source_type, 'Cruise', 'cruise', 'https://getcruise.com/careers', 'https://api.lever.co/v0/postings/cruise', 'active'::source_status, 30, true, ARRAY['autonomous']),
  ('Ramp Lever', 'lever'::job_source_type, 'Ramp', 'ramp-lever', 'https://ramp.com/careers', 'https://api.lever.co/v0/postings/ramp', 'active'::source_status, 30, true, ARRAY['fintech']),
  ('Mercury Careers', 'lever'::job_source_type, 'Mercury', 'mercury', 'https://mercury.com/careers', 'https://api.lever.co/v0/postings/mercury', 'active'::source_status, 30, true, ARRAY['fintech']),
  ('Weights & Biases', 'lever'::job_source_type, 'Weights & Biases', 'wandb', 'https://wandb.ai/careers', 'https://api.lever.co/v0/postings/wandb', 'active'::source_status, 30, true, ARRAY['ml'])
) AS new_sources(name, source_type, company_name, company_slug, base_url, api_endpoint, status, poll_interval_minutes, is_priority_source, tags)
WHERE NOT EXISTS (
  SELECT 1 FROM job_sources WHERE company_slug = new_sources.company_slug
);

-- Update existing Notion and OpenAI sources if they don't have api_endpoint
UPDATE job_sources 
SET api_endpoint = 'https://boards-api.greenhouse.io/v1/boards/notion/jobs'
WHERE company_slug = 'notion' AND api_endpoint IS NULL;

UPDATE job_sources 
SET api_endpoint = 'https://boards-api.greenhouse.io/v1/boards/openai/jobs'
WHERE company_slug = 'openai' AND api_endpoint IS NULL;