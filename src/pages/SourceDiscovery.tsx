import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Globe, Search, CheckCircle, XCircle, Clock,
  Loader2, Zap, AlertTriangle, TrendingUp, Database,
  Eye, ThumbsUp, ThumbsDown, Rocket, MapPin, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  useDiscoveredSources,
  useDiscoveryRuns,
  useCountrySeeds,
  useDiscoveryStats,
  useTriggerDiscovery,
  useApproveSource,
  useBulkApprove,
  type DiscoveredSource,
  type DiscoveryRun,
} from "@/hooks/useSourceDiscovery";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

function getValidationColor(status: string) {
  switch (status) {
    case "validated": return "bg-[hsl(var(--color-green))]/20 text-[hsl(var(--color-green))]";
    case "approved": return "bg-primary/20 text-primary";
    case "rejected": return "bg-destructive/20 text-destructive";
    case "duplicate": return "bg-muted text-muted-foreground";
    default: return "bg-[hsl(var(--color-orange))]/20 text-[hsl(var(--color-orange))]";
  }
}

function getValidationIcon(status: string) {
  switch (status) {
    case "validated": return <CheckCircle className="h-3 w-3" />;
    case "approved": return <Zap className="h-3 w-3" />;
    case "rejected": return <XCircle className="h-3 w-3" />;
    default: return <Clock className="h-3 w-3" />;
  }
}

function DiscoveredSourceRow({
  source,
  onApprove,
  onReject,
  isLoading,
}: {
  source: DiscoveredSource;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isLoading: boolean;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
            <span className="text-lg font-bold">{source.company_name[0]}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium truncate">{source.company_name}</h4>
              <Badge variant="outline" className="text-xs capitalize">{source.source_type}</Badge>
              <Badge variant="outline" className="text-xs">{source.country_code}</Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span>{source.sample_job_count} jobs found</span>
              <span>•</span>
              <span>Quality: {source.quality_score}/100</span>
              <span>•</span>
              <span>{source.discovery_method}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={getValidationColor(source.validation_status)}>
            {getValidationIcon(source.validation_status)}
            <span className="ml-1 capitalize">{source.validation_status}</span>
          </Badge>
          
          {source.validation_status === "validated" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-[hsl(var(--color-green))]"
                onClick={(e) => { e.stopPropagation(); onApprove(source.id); }}
                disabled={isLoading}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={(e) => { e.stopPropagation(); onReject(source.id); }}
                disabled={isLoading}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </>
          )}
          <Eye className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {showDetails && (
        <div className="px-4 pb-4 bg-secondary/10 text-sm space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-xs">API Endpoint</p>
              <p className="font-mono text-xs truncate">{source.api_endpoint}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Base URL</p>
              <a href={source.base_url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs truncate block">{source.base_url}</a>
            </div>
          </div>
          {source.validation_error && (
            <div className="p-2 rounded bg-destructive/10 text-destructive text-xs">
              {source.validation_error}
            </div>
          )}
          {source.sample_jobs && (
            <div>
              <p className="text-muted-foreground text-xs mb-1">Sample Jobs:</p>
              <div className="space-y-1">
                {(Array.isArray(source.sample_jobs) ? source.sample_jobs : []).slice(0, 3).map((job: any, i: number) => (
                  <div key={i} className="text-xs flex items-center gap-2">
                    <span className="font-medium">{job.title}</span>
                    {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-primary">→</a>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DiscoveryRunRow({ run }: { run: DiscoveryRun }) {
  const duration = run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : "-";
  const time = formatDistanceToNow(new Date(run.started_at), { addSuffix: true });

  return (
    <div className="flex items-center justify-between p-3 border-b border-border last:border-0 text-sm">
      <div className="flex items-center gap-3">
        {run.status === "completed" ? (
          <CheckCircle className="h-4 w-4 text-[hsl(var(--color-green))]" />
        ) : run.status === "failed" ? (
          <XCircle className="h-4 w-4 text-destructive" />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        )}
        <span className="text-muted-foreground">{time}</span>
        <Badge variant="outline" className="text-xs capitalize">{run.run_type}</Badge>
        {run.target_ats && <Badge variant="outline" className="text-xs">{run.target_ats}</Badge>}
        {run.country_code && <Badge variant="outline" className="text-xs">{run.country_code}</Badge>}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="text-[hsl(var(--color-green))]">+{run.sources_discovered} found</span>
        <span className="text-primary">{run.sources_validated} valid</span>
        <span>{run.sources_duplicate} dupes</span>
        <span className="text-[hsl(var(--color-green))]">{run.sources_approved} approved</span>
        <span>{duration}</span>
      </div>
    </div>
  );
}

export default function SourceDiscovery() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("discovered");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const { data: sources, isLoading: sourcesLoading } = useDiscoveredSources(statusFilter);
  const { data: runs } = useDiscoveryRuns();
  const { data: countrySeeds } = useCountrySeeds();
  const { data: stats } = useDiscoveryStats();

  const triggerDiscovery = useTriggerDiscovery();
  const approveSource = useApproveSource();
  const bulkApprove = useBulkApprove();

  const handleRunDiscovery = async () => {
    try {
      const result = await triggerDiscovery.mutateAsync({});
      toast.success("Discovery complete", {
        description: `Found ${result.discovered} new sources, ${result.validated} valid, ${result.auto_approved} auto-approved`,
      });
    } catch (err) {
      toast.error("Discovery failed", { description: err instanceof Error ? err.message : "Unknown error" });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveSource.mutateAsync({ sourceId: id, approve: true });
      toast.success("Source approved and activated");
    } catch (err) {
      toast.error("Approval failed");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await approveSource.mutateAsync({ sourceId: id, approve: false });
      toast.success("Source rejected");
    } catch (err) {
      toast.error("Rejection failed");
    }
  };

  const handleBulkApprove = async () => {
    try {
      const result = await bulkApprove.mutateAsync({ minQuality: 60, limit: 500 });
      toast.success(`Bulk approved ${result.approved} sources`);
    } catch (err) {
      toast.error("Bulk approve failed");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 apple-blur border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Source Discovery</h1>
              <p className="text-xs text-muted-foreground">Auto-discover & manage job sources globally</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkApprove}
              disabled={bulkApprove.isPending}
            >
              {bulkApprove.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
              Bulk Approve Top 500
            </Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={handleRunDiscovery}
              disabled={triggerDiscovery.isPending}
            >
              {triggerDiscovery.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
              Run Discovery
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* KPI Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 text-primary"><Database className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalSources || 0}</p>
                <p className="text-sm text-muted-foreground">Total Sources</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(var(--color-green))]/20 text-[hsl(var(--color-green))]"><CheckCircle className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold">{stats?.activeSources || 0}</p>
                <p className="text-sm text-muted-foreground">Active Sources</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(var(--color-orange))]/20 text-[hsl(var(--color-orange))]"><Clock className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold">{stats?.pendingReview || 0}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(var(--color-teal))]/20 text-[hsl(var(--color-teal))]"><TrendingUp className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold">{stats?.validatedReady || 0}</p>
                <p className="text-sm text-muted-foreground">Ready to Approve</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(var(--color-purple))]/20 text-[hsl(var(--color-purple))]"><Globe className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold">{stats?.countriesCovered || 0}</p>
                <p className="text-sm text-muted-foreground">Countries</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="discovered">Discovered Sources</TabsTrigger>
            <TabsTrigger value="runs">Discovery Runs</TabsTrigger>
            <TabsTrigger value="countries">Countries</TabsTrigger>
          </TabsList>

          <TabsContent value="discovered">
            <Card>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Discovered Sources</h3>
                  <p className="text-sm text-muted-foreground">Review and approve sources found by auto-discovery</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={!statusFilter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(undefined)}
                  >All</Button>
                  <Button
                    variant={statusFilter === "validated" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("validated")}
                  >Validated</Button>
                  <Button
                    variant={statusFilter === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("pending")}
                  >Pending</Button>
                  <Button
                    variant={statusFilter === "rejected" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("rejected")}
                  >Rejected</Button>
                </div>
              </div>

              {sourcesLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : !sources?.length ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No discovered sources yet. Run discovery to find new sources!</p>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto">
                  {sources.map((source) => (
                    <DiscoveredSourceRow
                      key={source.id}
                      source={source}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      isLoading={approveSource.isPending}
                    />
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="runs">
            <Card>
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Discovery Runs</h3>
                <p className="text-sm text-muted-foreground">History of all discovery crawls</p>
              </div>
              {!runs?.length ? (
                <div className="p-8 text-center text-muted-foreground">No discovery runs yet</div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  {runs.map((run) => (
                    <DiscoveryRunRow key={run.id} run={run} />
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="countries">
            <Card>
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Country Seeds</h3>
                <p className="text-sm text-muted-foreground">{countrySeeds?.length || 0} countries configured for discovery</p>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {countrySeeds?.map((seed) => (
                  <div key={seed.id} className="flex items-center justify-between p-3 border-b border-border last:border-0 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold">
                        {seed.country_code}
                      </div>
                      <div>
                        <p className="font-medium">{seed.country_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {seed.top_cities?.slice(0, 3).join(", ")} • {seed.industries?.slice(0, 3).join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">P{seed.priority}</Badge>
                      <Badge variant="outline" className="text-xs">{seed.language}</Badge>
                      <Badge className={seed.is_active ? "bg-[hsl(var(--color-green))]/20 text-[hsl(var(--color-green))]" : "bg-muted text-muted-foreground"}>
                        {seed.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {seed.sources_found > 0 && (
                        <span className="text-xs text-muted-foreground">{seed.sources_found} sources</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
