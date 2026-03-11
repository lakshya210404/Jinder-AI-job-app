-- Create jobs table with detailed fields
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  salary_min INTEGER,
  salary_max INTEGER,
  description TEXT NOT NULL,
  requirements TEXT[],
  work_type TEXT NOT NULL DEFAULT 'hybrid',
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Jobs are public (anyone can view)
CREATE POLICY "Jobs are viewable by everyone" 
ON public.jobs 
FOR SELECT 
USING (true);

-- Create user_job_interactions table to track likes/passes
CREATE TABLE public.user_job_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('liked', 'passed', 'saved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- Enable RLS
ALTER TABLE public.user_job_interactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own interactions
CREATE POLICY "Users can view their own interactions" 
ON public.user_job_interactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interactions" 
ON public.user_job_interactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions" 
ON public.user_job_interactions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions" 
ON public.user_job_interactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert seed data for demo jobs
INSERT INTO public.jobs (title, company, location, salary_min, salary_max, description, requirements, work_type, logo_url) VALUES
('Senior Frontend Developer', 'TechCorp', 'San Francisco, CA', 150000, 200000, 'Join our team to build cutting-edge web applications using React and TypeScript. You''ll work on products used by millions.', ARRAY['5+ years React experience', 'TypeScript proficiency', 'CSS/Tailwind expertise'], 'hybrid', null),
('Full Stack Engineer', 'StartupXYZ', 'Remote', 120000, 160000, 'Be part of a fast-growing startup disrupting the fintech space. Full ownership of features from design to deployment.', ARRAY['Node.js/Express', 'React or Vue', 'PostgreSQL experience'], 'remote', null),
('Product Designer', 'DesignHub', 'New York, NY', 130000, 170000, 'Create beautiful, intuitive user experiences for our enterprise clients. Lead design systems and mentor junior designers.', ARRAY['Figma expertise', '4+ years UX design', 'Design systems experience'], 'onsite', null),
('Backend Engineer', 'DataFlow', 'Austin, TX', 140000, 180000, 'Build scalable APIs and data pipelines processing billions of events daily. Work with cutting-edge cloud technologies.', ARRAY['Python or Go', 'Kubernetes', 'AWS/GCP experience'], 'hybrid', null),
('Mobile Developer', 'AppWorks', 'Seattle, WA', 135000, 175000, 'Develop native iOS and Android apps for our growing user base. Focus on performance and delightful user experiences.', ARRAY['React Native or Flutter', 'iOS/Android native exp', 'App Store deployment'], 'remote', null),
('DevOps Engineer', 'CloudNine', 'Denver, CO', 145000, 185000, 'Manage and optimize our cloud infrastructure. Implement CI/CD pipelines and ensure 99.99% uptime for critical services.', ARRAY['Terraform/Pulumi', 'Docker & Kubernetes', 'CI/CD expertise'], 'hybrid', null),
('Data Scientist', 'AI Labs', 'Boston, MA', 160000, 210000, 'Apply machine learning to solve real-world problems. Work on recommendation systems and predictive analytics.', ARRAY['Python/ML frameworks', 'Statistics background', 'SQL proficiency'], 'onsite', null),
('Engineering Manager', 'ScaleUp', 'Chicago, IL', 180000, 240000, 'Lead a team of talented engineers building the next generation of SaaS tools. Strong technical and people skills required.', ARRAY['5+ years management', 'Technical background', 'Agile/Scrum experience'], 'hybrid', null);