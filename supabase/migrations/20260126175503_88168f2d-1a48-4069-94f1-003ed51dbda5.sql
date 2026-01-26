-- Create user_job_preferences table for keyword exclusions and company blocklist
CREATE TABLE public.user_job_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Keyword filters (like the LinkedIn scraper)
  title_exclude TEXT[] DEFAULT '{}'::text[],  -- Keywords to exclude from titles
  title_include TEXT[] DEFAULT '{}'::text[],  -- Keywords to require in titles
  desc_exclude TEXT[] DEFAULT '{}'::text[],   -- Keywords to exclude from descriptions
  company_exclude TEXT[] DEFAULT '{}'::text[], -- Companies to block entirely
  
  -- Location preferences
  preferred_locations TEXT[] DEFAULT '{}'::text[],
  
  -- Work type preferences
  work_type_filter TEXT[] DEFAULT '{}'::text[], -- remote, hybrid, onsite
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.user_job_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own preferences
CREATE POLICY "Users can manage their own preferences"
ON public.user_job_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index for fast lookups
CREATE INDEX idx_user_job_preferences_user_id ON public.user_job_preferences(user_id);

-- Add timestamp trigger
CREATE TRIGGER update_user_job_preferences_updated_at
BEFORE UPDATE ON public.user_job_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();