
-- ============================================================
-- GLOBAL SOURCE DISCOVERY SCHEMA
-- ============================================================

-- 1) Add country/language/quality fields to job_sources
ALTER TABLE public.job_sources
  ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS source_quality_score integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS auto_discovered boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS discovery_method text,
  ADD COLUMN IF NOT EXISTS jobs_yield_7d integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS adaptive_poll_minutes integer,
  ADD COLUMN IF NOT EXISTS last_job_found_at timestamptz,
  ADD COLUMN IF NOT EXISTS domain text,
  ADD COLUMN IF NOT EXISTS robots_txt_ok boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid;

-- 2) Add country/language to jobs table
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';

-- 3) Discovered sources queue (pre-approval staging)
CREATE TABLE IF NOT EXISTS public.discovered_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  company_name text NOT NULL,
  source_type text NOT NULL,
  base_url text NOT NULL,
  api_endpoint text,
  domain text,
  country_code text DEFAULT 'US',
  language text DEFAULT 'en',
  discovery_method text NOT NULL, -- 'ats_crawl', 'sitemap', 'web_search', 'community', 'career_page'
  discovery_run_id uuid,
  
  -- Validation results
  validation_status text DEFAULT 'pending', -- pending, validated, rejected, duplicate
  validation_error text,
  sample_job_count integer DEFAULT 0,
  sample_jobs jsonb,
  has_valid_apply_urls boolean,
  has_consistent_structure boolean,
  respects_robots_txt boolean DEFAULT true,
  quality_score integer DEFAULT 0,
  
  -- Duplicate detection
  is_duplicate boolean DEFAULT false,
  duplicate_of_source_id uuid,
  
  -- Admin review
  reviewed_at timestamptz,
  reviewed_by uuid,
  review_notes text,
  
  -- Community submission fields
  submitted_by uuid,
  submission_url text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discovered_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage discovered sources"
  ON public.discovered_sources FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can submit sources"
  ON public.discovered_sources FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users can view own submissions"
  ON public.discovered_sources FOR SELECT
  USING (auth.uid() = submitted_by OR public.has_role(auth.uid(), 'admin'));

-- 4) Discovery runs tracking
CREATE TABLE IF NOT EXISTS public.discovery_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_type text NOT NULL, -- 'ats_crawl', 'sitemap_scan', 'web_search', 'career_page_scan', 'country_seed'
  country_code text,
  target_ats text, -- 'greenhouse', 'lever', 'ashby', etc.
  query_used text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration_ms integer,
  status text DEFAULT 'running', -- running, completed, failed
  error_message text,
  sources_discovered integer DEFAULT 0,
  sources_validated integer DEFAULT 0,
  sources_duplicate integer DEFAULT 0,
  sources_approved integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discovery_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage discovery runs"
  ON public.discovery_runs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 5) Country seeds for systematic discovery
CREATE TABLE IF NOT EXISTS public.country_seeds (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code text NOT NULL,
  country_name text NOT NULL,
  language text DEFAULT 'en',
  timezone text,
  top_cities text[] DEFAULT '{}',
  industries text[] DEFAULT '{}',
  search_queries text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  priority integer DEFAULT 5, -- 1=highest
  last_seeded_at timestamptz,
  sources_found integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(country_code)
);

ALTER TABLE public.country_seeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage country seeds"
  ON public.country_seeds FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 6) Community submission credits
CREATE TABLE IF NOT EXISTS public.source_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  url text NOT NULL,
  detected_ats_type text,
  detected_company_name text,
  status text DEFAULT 'pending', -- pending, approved, rejected, duplicate
  discovered_source_id uuid REFERENCES public.discovered_sources(id),
  credits_awarded integer DEFAULT 0,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.source_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit"
  ON public.source_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own submissions"
  ON public.source_submissions FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage submissions"
  ON public.source_submissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 7) Indexes for performance at scale
CREATE INDEX IF NOT EXISTS idx_discovered_sources_status ON public.discovered_sources(validation_status);
CREATE INDEX IF NOT EXISTS idx_discovered_sources_method ON public.discovered_sources(discovery_method);
CREATE INDEX IF NOT EXISTS idx_discovered_sources_country ON public.discovered_sources(country_code);
CREATE INDEX IF NOT EXISTS idx_discovery_runs_status ON public.discovery_runs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_country_code ON public.jobs(country_code);
CREATE INDEX IF NOT EXISTS idx_job_sources_country ON public.job_sources(country_code);
CREATE INDEX IF NOT EXISTS idx_job_sources_quality ON public.job_sources(source_quality_score);
CREATE INDEX IF NOT EXISTS idx_job_sources_domain ON public.job_sources(domain);
CREATE INDEX IF NOT EXISTS idx_source_submissions_user ON public.source_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_source_submissions_status ON public.source_submissions(status);

-- 8) Seed initial country data (top 50+ countries)
INSERT INTO public.country_seeds (country_code, country_name, language, top_cities, industries, priority, search_queries) VALUES
('US', 'United States', 'en', ARRAY['New York','San Francisco','Seattle','Austin','Boston','Chicago','Los Angeles','Denver','Atlanta','Miami'], ARRAY['tech','finance','healthcare','retail','energy'], 1, ARRAY['software engineer jobs greenhouse','internship lever.co','new grad jobs ashby']),
('GB', 'United Kingdom', 'en', ARRAY['London','Manchester','Edinburgh','Birmingham','Cambridge','Bristol'], ARRAY['tech','finance','healthcare','media'], 2, ARRAY['software jobs UK greenhouse','graduate scheme lever.co']),
('CA', 'Canada', 'en', ARRAY['Toronto','Vancouver','Montreal','Ottawa','Calgary','Waterloo'], ARRAY['tech','finance','mining','energy'], 2, ARRAY['developer jobs Canada greenhouse','new grad jobs lever.co Canada']),
('DE', 'Germany', 'de', ARRAY['Berlin','Munich','Hamburg','Frankfurt','Stuttgart','Cologne'], ARRAY['tech','automotive','manufacturing','finance'], 2, ARRAY['software engineer jobs Germany greenhouse','entwickler jobs lever.co']),
('FR', 'France', 'fr', ARRAY['Paris','Lyon','Marseille','Toulouse','Bordeaux','Nantes'], ARRAY['tech','luxury','aerospace','finance'], 3, ARRAY['développeur jobs France greenhouse','stage ingénieur lever.co']),
('NL', 'Netherlands', 'nl', ARRAY['Amsterdam','Rotterdam','The Hague','Eindhoven','Utrecht'], ARRAY['tech','finance','logistics','energy'], 3, ARRAY['software jobs Netherlands greenhouse','developer jobs lever.co NL']),
('IE', 'Ireland', 'en', ARRAY['Dublin','Cork','Galway','Limerick'], ARRAY['tech','pharma','finance'], 3, ARRAY['software engineer jobs Ireland greenhouse','graduate jobs lever.co Ireland']),
('AU', 'Australia', 'en', ARRAY['Sydney','Melbourne','Brisbane','Perth','Adelaide'], ARRAY['tech','mining','finance','healthcare'], 3, ARRAY['software jobs Australia greenhouse','graduate program lever.co AU']),
('SG', 'Singapore', 'en', ARRAY['Singapore'], ARRAY['tech','finance','logistics','biotech'], 3, ARRAY['software engineer Singapore greenhouse','jobs lever.co Singapore']),
('IN', 'India', 'en', ARRAY['Bangalore','Mumbai','Hyderabad','Delhi','Pune','Chennai'], ARRAY['tech','finance','consulting','pharma'], 2, ARRAY['software engineer India greenhouse','fresher jobs lever.co India']),
('JP', 'Japan', 'ja', ARRAY['Tokyo','Osaka','Kyoto','Yokohama','Nagoya'], ARRAY['tech','automotive','gaming','finance'], 4, ARRAY['software engineer Japan greenhouse','エンジニア jobs lever.co']),
('KR', 'South Korea', 'ko', ARRAY['Seoul','Busan','Incheon','Daejeon'], ARRAY['tech','semiconductor','automotive','gaming'], 4, ARRAY['software engineer Korea greenhouse','개발자 jobs lever.co']),
('IL', 'Israel', 'he', ARRAY['Tel Aviv','Jerusalem','Haifa','Herzliya'], ARRAY['tech','cybersecurity','biotech','defense'], 3, ARRAY['software engineer Israel greenhouse','developer jobs lever.co Israel']),
('SE', 'Sweden', 'sv', ARRAY['Stockholm','Gothenburg','Malmö','Uppsala'], ARRAY['tech','gaming','fintech','medtech'], 4, ARRAY['software jobs Sweden greenhouse','utvecklare lever.co']),
('DK', 'Denmark', 'da', ARRAY['Copenhagen','Aarhus','Odense'], ARRAY['tech','pharma','energy','shipping'], 4, ARRAY['software jobs Denmark greenhouse']),
('NO', 'Norway', 'no', ARRAY['Oslo','Bergen','Trondheim','Stavanger'], ARRAY['tech','energy','maritime','finance'], 4, ARRAY['software jobs Norway greenhouse']),
('FI', 'Finland', 'fi', ARRAY['Helsinki','Espoo','Tampere','Oulu'], ARRAY['tech','gaming','telecom','forestry'], 4, ARRAY['software jobs Finland greenhouse']),
('CH', 'Switzerland', 'de', ARRAY['Zurich','Geneva','Basel','Bern','Lausanne'], ARRAY['tech','finance','pharma','luxury'], 3, ARRAY['software engineer Switzerland greenhouse','developer jobs lever.co CH']),
('AT', 'Austria', 'de', ARRAY['Vienna','Graz','Linz','Salzburg'], ARRAY['tech','manufacturing','tourism'], 5, ARRAY['software jobs Austria greenhouse']),
('BE', 'Belgium', 'nl', ARRAY['Brussels','Antwerp','Ghent','Leuven'], ARRAY['tech','pharma','logistics','EU'], 5, ARRAY['software jobs Belgium greenhouse']),
('ES', 'Spain', 'es', ARRAY['Madrid','Barcelona','Valencia','Seville','Malaga'], ARRAY['tech','tourism','finance','energy'], 4, ARRAY['desarrollador jobs Spain greenhouse','software lever.co España']),
('IT', 'Italy', 'it', ARRAY['Milan','Rome','Turin','Bologna','Florence'], ARRAY['tech','fashion','automotive','finance'], 4, ARRAY['software jobs Italy greenhouse']),
('PT', 'Portugal', 'pt', ARRAY['Lisbon','Porto','Braga','Coimbra'], ARRAY['tech','tourism','fintech'], 4, ARRAY['software jobs Portugal greenhouse','developer lever.co PT']),
('PL', 'Poland', 'pl', ARRAY['Warsaw','Krakow','Wroclaw','Gdansk','Poznan'], ARRAY['tech','gaming','finance','shared_services'], 4, ARRAY['software engineer Poland greenhouse','programista lever.co']),
('CZ', 'Czech Republic', 'cs', ARRAY['Prague','Brno','Ostrava'], ARRAY['tech','manufacturing','automotive'], 5, ARRAY['software jobs Czech greenhouse']),
('RO', 'Romania', 'ro', ARRAY['Bucharest','Cluj-Napoca','Timisoara','Iasi'], ARRAY['tech','automotive','outsourcing'], 5, ARRAY['software jobs Romania greenhouse']),
('BR', 'Brazil', 'pt', ARRAY['São Paulo','Rio de Janeiro','Belo Horizonte','Curitiba','Florianópolis'], ARRAY['tech','finance','agribusiness','energy'], 3, ARRAY['desenvolvedor jobs Brazil greenhouse','software lever.co Brasil']),
('MX', 'Mexico', 'es', ARRAY['Mexico City','Guadalajara','Monterrey','Puebla'], ARRAY['tech','manufacturing','finance'], 4, ARRAY['software engineer Mexico greenhouse','desarrollador lever.co']),
('AR', 'Argentina', 'es', ARRAY['Buenos Aires','Córdoba','Rosario','Mendoza'], ARRAY['tech','agriculture','finance'], 5, ARRAY['software jobs Argentina greenhouse']),
('CO', 'Colombia', 'es', ARRAY['Bogotá','Medellín','Cali','Barranquilla'], ARRAY['tech','finance','oil'], 5, ARRAY['software jobs Colombia greenhouse']),
('CL', 'Chile', 'es', ARRAY['Santiago','Valparaíso','Concepción'], ARRAY['tech','mining','finance'], 5, ARRAY['software jobs Chile greenhouse']),
('AE', 'UAE', 'en', ARRAY['Dubai','Abu Dhabi','Sharjah'], ARRAY['tech','finance','real_estate','energy'], 4, ARRAY['software engineer UAE greenhouse','developer jobs lever.co Dubai']),
('SA', 'Saudi Arabia', 'ar', ARRAY['Riyadh','Jeddah','Dammam','NEOM'], ARRAY['tech','energy','finance','construction'], 4, ARRAY['software engineer Saudi greenhouse']),
('ZA', 'South Africa', 'en', ARRAY['Cape Town','Johannesburg','Durban','Pretoria'], ARRAY['tech','mining','finance','telecom'], 4, ARRAY['software jobs South Africa greenhouse']),
('NG', 'Nigeria', 'en', ARRAY['Lagos','Abuja','Port Harcourt'], ARRAY['tech','finance','energy','telecom'], 5, ARRAY['software jobs Nigeria greenhouse']),
('KE', 'Kenya', 'en', ARRAY['Nairobi','Mombasa'], ARRAY['tech','finance','agriculture'], 5, ARRAY['software jobs Kenya greenhouse']),
('EG', 'Egypt', 'ar', ARRAY['Cairo','Alexandria','Giza'], ARRAY['tech','tourism','manufacturing'], 5, ARRAY['software engineer Egypt greenhouse']),
('TW', 'Taiwan', 'zh', ARRAY['Taipei','Hsinchu','Taichung','Kaohsiung'], ARRAY['tech','semiconductor','electronics'], 4, ARRAY['software engineer Taiwan greenhouse']),
('HK', 'Hong Kong', 'en', ARRAY['Hong Kong'], ARRAY['tech','finance','logistics'], 4, ARRAY['software engineer Hong Kong greenhouse']),
('MY', 'Malaysia', 'en', ARRAY['Kuala Lumpur','Penang','Johor Bahru','Cyberjaya'], ARRAY['tech','finance','manufacturing'], 5, ARRAY['software jobs Malaysia greenhouse']),
('TH', 'Thailand', 'th', ARRAY['Bangkok','Chiang Mai','Phuket'], ARRAY['tech','tourism','manufacturing'], 5, ARRAY['software jobs Thailand greenhouse']),
('VN', 'Vietnam', 'vi', ARRAY['Ho Chi Minh City','Hanoi','Da Nang'], ARRAY['tech','manufacturing','outsourcing'], 5, ARRAY['software engineer Vietnam greenhouse']),
('PH', 'Philippines', 'en', ARRAY['Manila','Cebu','Davao'], ARRAY['tech','bpo','finance'], 5, ARRAY['software jobs Philippines greenhouse']),
('ID', 'Indonesia', 'id', ARRAY['Jakarta','Bandung','Surabaya','Bali'], ARRAY['tech','finance','ecommerce'], 5, ARRAY['software engineer Indonesia greenhouse']),
('NZ', 'New Zealand', 'en', ARRAY['Auckland','Wellington','Christchurch'], ARRAY['tech','agriculture','tourism'], 5, ARRAY['software jobs New Zealand greenhouse']),
('RU', 'Russia', 'ru', ARRAY['Moscow','Saint Petersburg','Novosibirsk','Kazan'], ARRAY['tech','energy','finance'], 5, ARRAY['software engineer Russia greenhouse']),
('UA', 'Ukraine', 'uk', ARRAY['Kyiv','Lviv','Kharkiv','Dnipro','Odesa'], ARRAY['tech','outsourcing','gaming'], 5, ARRAY['software engineer Ukraine greenhouse']),
('EE', 'Estonia', 'et', ARRAY['Tallinn','Tartu'], ARRAY['tech','fintech','e-governance'], 5, ARRAY['software jobs Estonia greenhouse']),
('LT', 'Lithuania', 'lt', ARRAY['Vilnius','Kaunas'], ARRAY['tech','fintech','laser'], 5, ARRAY['software jobs Lithuania greenhouse']),
('LV', 'Latvia', 'lv', ARRAY['Riga','Liepaja'], ARRAY['tech','logistics','fintech'], 5, ARRAY['software jobs Latvia greenhouse'])
ON CONFLICT (country_code) DO NOTHING;

-- 9) Function to compute adaptive polling interval
CREATE OR REPLACE FUNCTION public.compute_adaptive_poll_interval(
  p_source_id uuid
) RETURNS integer
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_jobs_added_24h integer;
  v_reliability numeric;
  v_interval integer;
BEGIN
  SELECT jobs_added_24h, reliability_score
  INTO v_jobs_added_24h, v_reliability
  FROM public.job_sources WHERE id = p_source_id;
  
  -- High-yield, reliable sources: poll frequently
  IF v_jobs_added_24h > 20 AND v_reliability > 80 THEN
    v_interval := 30;
  ELSIF v_jobs_added_24h > 5 AND v_reliability > 60 THEN
    v_interval := 60;
  ELSIF v_jobs_added_24h > 0 AND v_reliability > 40 THEN
    v_interval := 120;
  ELSIF v_reliability > 20 THEN
    v_interval := 360; -- 6 hours
  ELSE
    v_interval := 1440; -- 24 hours
  END IF;
  
  -- Update the source
  UPDATE public.job_sources 
  SET adaptive_poll_minutes = v_interval 
  WHERE id = p_source_id;
  
  RETURN v_interval;
END;
$function$;

-- 10) Trigger to update adaptive polling after ingestion logs
CREATE OR REPLACE FUNCTION public.update_adaptive_polling()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM compute_adaptive_poll_interval(NEW.source_id);
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_update_adaptive_polling
  AFTER INSERT ON public.ingestion_logs
  FOR EACH ROW
  WHEN (NEW.source_id IS NOT NULL)
  EXECUTE FUNCTION public.update_adaptive_polling();
