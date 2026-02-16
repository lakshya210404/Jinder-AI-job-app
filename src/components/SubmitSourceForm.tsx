import { useState } from "react";
import { Globe, Loader2, CheckCircle, XCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmitSource } from "@/hooks/useSourceDiscovery";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function SubmitSourceForm() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<any>(null);
  const submitSource = useSubmitSource();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    if (!user) {
      toast.error("Please log in to submit a source");
      return;
    }

    try {
      const data = await submitSource.mutateAsync(url.trim());
      setResult(data);
      if (data.success) {
        toast.success("Source submitted!", {
          description: `Found ${data.jobCount} jobs from ${data.companyName} (${data.atsType})`,
        });
        setUrl("");
      } else {
        toast.error("Submission failed", { description: data.error });
      }
    } catch (err) {
      toast.error("Submission failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5 text-primary" />
          Submit a Job Board
        </CardTitle>
        <CardDescription>
          Know a company's careers page? Submit it and earn Pro credits when approved!
          We support Greenhouse, Lever, and Ashby job boards.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="e.g. https://boards.greenhouse.io/company or https://jobs.lever.co/company"
            className="flex-1"
          />
          <Button type="submit" disabled={submitSource.isPending || !url.trim()}>
            {submitSource.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {result && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${result.success ? "bg-[hsl(var(--color-green))]/10 text-[hsl(var(--color-green))]" : "bg-destructive/10 text-destructive"}`}>
            <div className="flex items-center gap-2">
              {result.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <span>
                {result.success
                  ? `Found ${result.jobCount} jobs from ${result.companyName} (${result.atsType}). Pending admin review!`
                  : result.error}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
