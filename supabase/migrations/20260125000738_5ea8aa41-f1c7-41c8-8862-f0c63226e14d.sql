-- Add company logo fields to jobs table
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS company_domain TEXT,
ADD COLUMN IF NOT EXISTS company_logo_url TEXT,
ADD COLUMN IF NOT EXISTS logo_source TEXT DEFAULT 'fallback',
ADD COLUMN IF NOT EXISTS logo_last_verified_at TIMESTAMP WITH TIME ZONE;

-- Create index for company domain lookups
CREATE INDEX IF NOT EXISTS idx_jobs_company_domain ON public.jobs(company_domain);

-- Add AI enrichment fields for job description intelligence
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS ai_responsibilities TEXT[],
ADD COLUMN IF NOT EXISTS ai_qualifications TEXT[],
ADD COLUMN IF NOT EXISTS ai_tech_stack TEXT[],
ADD COLUMN IF NOT EXISTS ai_benefits TEXT[],
ADD COLUMN IF NOT EXISTS ai_visa_info TEXT,
ADD COLUMN IF NOT EXISTS ai_enriched_at TIMESTAMP WITH TIME ZONE;

-- Add verification and badge fields
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS application_count INTEGER DEFAULT 0;

-- Create company_logos table for caching logos by domain
CREATE TABLE IF NOT EXISTS public.company_logos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  company_name TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  source TEXT DEFAULT 'fallback',
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on company_logos
ALTER TABLE public.company_logos ENABLE ROW LEVEL SECURITY;

-- Anyone can read logos
CREATE POLICY "Logos are publicly readable"
ON public.company_logos
FOR SELECT
USING (true);

-- Only admins can manage logos
CREATE POLICY "Admins can manage logos"
ON public.company_logos
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_company_logos_updated_at
BEFORE UPDATE ON public.company_logos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  1048576, -- 1MB max
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/x-icon']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for company logos
CREATE POLICY "Company logos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'company-logos');

CREATE POLICY "Admins can upload company logos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'company-logos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can upload company logos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'company-logos');

CREATE POLICY "Admins can update company logos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'company-logos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete company logos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'company-logos' AND public.has_role(auth.uid(), 'admin'));