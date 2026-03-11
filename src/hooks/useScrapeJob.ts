import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ScrapeResult {
  content: string;
  title?: string;
  scrapedAt: string;
  cached: boolean;
}

// Client-side cache to avoid re-fetching
const clientCache = new Map<string, ScrapeResult>();

export function useScrapeJob() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrapeJob = useCallback(async (url: string): Promise<ScrapeResult | null> => {
    if (!url) {
      setError("No URL provided");
      return null;
    }

    // Check client cache first
    const cached = clientCache.get(url);
    if (cached) {
      setResult(cached);
      return cached;
    }

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("scrape-job", {
        body: { url },
      });

      if (invokeError) {
        console.error("Scrape error:", invokeError);
        setError(invokeError.message || "Failed to fetch job details");
        setLoading(false);
        return null;
      }

      if (!data.success) {
        setError(data.error || "Failed to fetch job details");
        setLoading(false);
        return null;
      }

      const scrapeResult: ScrapeResult = {
        content: data.content,
        title: data.title,
        scrapedAt: data.scrapedAt,
        cached: data.cached,
      };

      // Store in client cache
      clientCache.set(url, scrapeResult);

      setResult(scrapeResult);
      setLoading(false);
      return scrapeResult;
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        return null;
      }
      console.error("Scrape failed:", err);
      setError("Failed to connect to scraping service");
      setLoading(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    scrapeJob,
    loading,
    error,
    result,
    reset,
  };
}
