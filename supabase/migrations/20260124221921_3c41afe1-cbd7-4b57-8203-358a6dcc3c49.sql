-- Add apply_url column to jobs table for external job applications
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS apply_url TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS posted_date TIMESTAMP WITH TIME ZONE;