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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query = 'software engineer internship', location = '' } = await req.json();

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build search query for job postings
    const searchQuery = location 
      ? `${query} jobs ${location} site:linkedin.com OR site:indeed.com OR site:glassdoor.com`
      : `${query} jobs site:linkedin.com OR site:indeed.com OR site:glassdoor.com`;

    console.log('Searching for jobs:', searchQuery);

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
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Search returned', data.data?.length || 0, 'results');

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

    console.log('Processed', jobs.length, 'jobs');

    return new Response(
      JSON.stringify({ success: true, jobs }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching jobs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch jobs';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});