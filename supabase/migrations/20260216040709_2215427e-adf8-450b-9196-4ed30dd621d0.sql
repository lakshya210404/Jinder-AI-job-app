
-- Add more high-value Greenhouse sources
INSERT INTO public.job_sources (name, company_name, source_type, base_url, api_endpoint, status, poll_interval_minutes) VALUES
('Stripe Careers', 'Stripe', 'greenhouse', 'https://stripe.com/jobs', 'https://boards-api.greenhouse.io/v1/boards/stripe/jobs', 'active', 30),
('Coinbase Careers', 'Coinbase', 'greenhouse', 'https://coinbase.com/careers', 'https://boards-api.greenhouse.io/v1/boards/coinbase/jobs', 'active', 30),
('Figma Careers', 'Figma', 'greenhouse', 'https://figma.com/careers', 'https://boards-api.greenhouse.io/v1/boards/figma/jobs', 'active', 30),
('Pinterest Careers', 'Pinterest', 'greenhouse', 'https://pinterest.com/careers', 'https://boards-api.greenhouse.io/v1/boards/pinterest/jobs', 'active', 30),
('DoorDash Careers', 'DoorDash', 'greenhouse', 'https://doordash.com/careers', 'https://boards-api.greenhouse.io/v1/boards/doordash/jobs', 'active', 30),
('Palantir Careers', 'Palantir', 'greenhouse', 'https://palantir.com/careers', 'https://boards-api.greenhouse.io/v1/boards/palantir/jobs', 'active', 30),
('Duolingo Careers', 'Duolingo', 'greenhouse', 'https://duolingo.com/careers', 'https://boards-api.greenhouse.io/v1/boards/duolingo/jobs', 'active', 30)
ON CONFLICT DO NOTHING;

-- Add Lever sources
INSERT INTO public.job_sources (name, company_name, source_type, base_url, api_endpoint, status, poll_interval_minutes) VALUES
('Netflix Lever', 'Netflix', 'lever', 'https://netflix.com/jobs', 'https://api.lever.co/v0/postings/netflix', 'active', 30),
('Notion Careers', 'Notion', 'lever', 'https://notion.so/careers', 'https://api.lever.co/v0/postings/notion', 'active', 30),
('Figma Lever', 'Figma', 'lever', 'https://figma.com/careers', 'https://api.lever.co/v0/postings/figma', 'active', 30)
ON CONFLICT DO NOTHING;
