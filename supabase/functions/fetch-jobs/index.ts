import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobResult {
  title: string;
  company: string;
  location: string;
  description: string;
  apply_url: string;
  work_type: string;
  requirements: string[];
  posted_date: string;
  logo_url?: string;
}

// Input validation constants
const MAX_QUERY_LENGTH = 200;
const MAX_LOCATION_LENGTH = 100;

// Sanitize input to remove special search operators and dangerous characters
function sanitizeInput(input: string): string {
  return input.replace(/[^a-zA-Z0-9\s,.-]/g, ' ').trim().replace(/\s+/g, ' ');
}

// Map errors to safe user-facing messages
function getSafeErrorMessage(status: number, _error: unknown): string {
  if (status === 429) {
    return 'Service is busy. Please try again in a moment.';
  } else if (status >= 500) {
    return 'External service unavailable. Please try again later.';
  } else if (status === 401 || status === 403) {
    return 'Service configuration error. Please contact support.';
  }
  return 'Failed to fetch jobs. Please try again.';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error('Auth error:', claimsError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log('Authenticated user:', userId);

    // Parse and validate input
    const body = await req.json();
    let query = body.query || 'software engineer internship';
    let location = body.location || '';

    // Type validation
    if (typeof query !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid query parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof location !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid location parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Length validation
    if (query.length > MAX_QUERY_LENGTH) {
      return new Response(
        JSON.stringify({ success: false, error: 'Query too long (max 200 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (location.length > MAX_LOCATION_LENGTH) {
      return new Response(
        JSON.stringify({ success: false, error: 'Location too long (max 100 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs to prevent search operator injection
    query = sanitizeInput(query);
    location = sanitizeInput(location);

    if (!query) {
      query = 'software engineer internship';
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build search query for job postings
    const searchQuery = location 
      ? `${query} jobs ${location} site:linkedin.com OR site:indeed.com OR site:glassdoor.com`
      : `${query} jobs site:linkedin.com OR site:indeed.com OR site:glassdoor.com`;

    console.log('User', userId, 'searching for jobs:', searchQuery);

    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 20,
        scrapeOptions: {
          formats: ['markdown'],
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', { status: response.status, error: data });
      const userMessage = getSafeErrorMessage(response.status, data);
      return new Response(
        JSON.stringify({ success: false, error: userMessage }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Search returned', data.data?.length || 0, 'results for user', userId);

    // Parse job results from Firecrawl search
    const jobs: JobResult[] = (data.data || []).map((result: any) => {
      // Extract company from URL or title
      const url = result.url || '';
      const title = result.title || 'Job Position';
      const description = result.description || result.markdown?.substring(0, 500) || '';
      
      // Try to extract company name from title (often formatted as "Job Title at Company")
      const atMatch = title.match(/(?:at|@)\s+([^-|]+)/i);
      const dashMatch = title.match(/^([^-|]+)\s*[-|]\s*([^-|]+)/);
      
      let company = 'Company';
      let jobTitle = title;
      
      if (atMatch) {
        company = atMatch[1].trim();
        jobTitle = title.split(/\s+(?:at|@)\s+/i)[0].trim();
      } else if (dashMatch) {
        // Could be "Company - Job Title" or "Job Title - Company"
        // Heuristic: shorter part is likely company
        if (dashMatch[1].length < dashMatch[2].length) {
          company = dashMatch[1].trim();
          jobTitle = dashMatch[2].trim();
        } else {
          jobTitle = dashMatch[1].trim();
          company = dashMatch[2].trim();
        }
      }

      // Extract location from description or URL
      const locationMatch = description.match(/(?:Location|Based in|Office):\s*([^,\n]+)/i) ||
                           description.match(/(San Francisco|New York|Seattle|Austin|Boston|Chicago|Los Angeles|Remote|Hybrid)/i);
      const jobLocation = locationMatch ? locationMatch[1] : 'United States';

      // Determine work type
      let workType = 'Full-time';
      if (/intern/i.test(title) || /intern/i.test(description)) {
        workType = 'Internship';
      } else if (/part[\s-]?time/i.test(description)) {
        workType = 'Part-time';
      } else if (/contract/i.test(description)) {
        workType = 'Contract';
      }

      // Add remote/hybrid indicator
      if (/remote/i.test(description) || /remote/i.test(title)) {
        workType += ' • Remote';
      } else if (/hybrid/i.test(description)) {
        workType += ' • Hybrid';
      }

      // Extract requirements/skills from markdown
      const requirements: string[] = [];
      const skillPatterns = [
        /python|javascript|typescript|react|node|java|c\+\+|sql|aws|kubernetes|docker/gi,
        /machine learning|data science|backend|frontend|full[\s-]?stack/gi,
      ];
      
      const markdown = result.markdown || description;
      for (const pattern of skillPatterns) {
        const matches = markdown.match(pattern) || [];
        requirements.push(...matches.map((m: string) => m.toLowerCase()));
      }
      
      // Dedupe requirements
      const uniqueReqs = [...new Set(requirements)].slice(0, 6);

      return {
        title: jobTitle.substring(0, 100),
        company: company.substring(0, 50),
        location: jobLocation,
        description: description.substring(0, 800),
        apply_url: url,
        work_type: workType,
        requirements: uniqueReqs,
        posted_date: new Date().toISOString(),
        logo_url: null,
      };
    });

    console.log('Processed', jobs.length, 'jobs for user', userId);

    return new Response(
      JSON.stringify({ success: true, jobs }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch jobs' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
