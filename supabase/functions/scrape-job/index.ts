import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache (persists across warm invocations)
const cache = new Map<string, { content: string; scrapedAt: string }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

function getSafeErrorMessage(status: number): string {
  if (status === 429) {
    return 'Service is busy. Please try again in a moment.';
  } else if (status >= 500) {
    return 'External service unavailable. Please try again later.';
  } else if (status === 401 || status === 403) {
    return 'Service configuration error.';
  }
  return 'Failed to fetch job details.';
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

    // Parse and validate input
    const body = await req.json();
    const url = body.url;

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check cache first
    const cached = cache.get(url);
    if (cached && Date.now() - new Date(cached.scrapedAt).getTime() < CACHE_TTL_MS) {
      console.log('Cache hit for:', url, 'user:', userId);
      return new Response(
        JSON.stringify({ 
          success: true, 
          content: cached.content, 
          scrapedAt: cached.scrapedAt,
          cached: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping job URL:', url, 'for user:', userId);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000, // Wait for dynamic content
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', { status: response.status, error: data });
      const userMessage = getSafeErrorMessage(response.status);
      return new Response(
        JSON.stringify({ success: false, error: userMessage }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract content - Firecrawl v1 nests in data object
    const markdown = data.data?.markdown || data.markdown || '';
    const metadata = data.data?.metadata || data.metadata || {};
    const scrapedAt = new Date().toISOString();

    // Cache the result
    cache.set(url, { content: markdown, scrapedAt });

    // Clean up old cache entries (keep last 100)
    if (cache.size > 100) {
      const entries = Array.from(cache.entries());
      entries
        .sort((a, b) => new Date(a[1].scrapedAt).getTime() - new Date(b[1].scrapedAt).getTime())
        .slice(0, cache.size - 100)
        .forEach(([key]) => cache.delete(key));
    }

    console.log('Scraped', markdown.length, 'chars for user', userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        content: markdown,
        title: metadata.title || null,
        scrapedAt,
        cached: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping job:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch job details' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

