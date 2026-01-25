import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  RefreshCw, 
  Play, 
  Pause, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Database,
  Brain,
  Shield,
  TrendingUp,
  Loader2,
  Zap,
  Image,
  Timer,
  Activity,
  AlertTriangle,
  BarChart3,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  useJobSources, 
  useIngestionLogs, 
  useIngestionRuns,
  useFreshnessStats,
  useTriggerIngestion,
  useTriggerClassification,
  useTriggerVerification,
  useTriggerLogoResolver,
  useUpdateSourceStatus,
  useJobStats,
  type JobSource,
  type IngestionLog,
  type IngestionRun
} from "@/hooks/useJobIntelligence";
import { toast } from "sonner";
import { formatDistanceToNow, differenceInHours, differenceInMinutes } from "date-fns";

// Status badge colors
function getStatusColor(status: string) {
  switch (status) {
    case "active": return "bg-[hsl(var(--color-green))]/20 text-[hsl(var(--color-green))]";
    case "paused": return "bg-muted text-muted-foreground";
    case "failing": return "bg-destructive/20 text-destructive";
    case "disabled": return "bg-secondary text-secondary-foreground";
    default: return "bg-muted text-muted-foreground";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "active": return <CheckCircle className="h-3 w-3" />;
    case "paused": return <Pause className="h-3 w-3" />;
    case "failing": return <AlertCircle className="h-3 w-3" />;
    default: return <Clock className="h-3 w-3" />;
  }
}

// Format age in human readable format
function formatAge(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
}

// Stats Card Component
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color,
  subtitle
}: { 
  title: string; 
  value: number | string; 
  icon: typeof Database;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
}

// Freshness SLA Card
function FreshnessSLACard({ stats }: { stats: ReturnType<typeof useFreshnessStats>["data"] }) {
  if (!stats) return null;
  
  const isHealthy = stats.sourcesRefreshedPct >= 80;
  
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Freshness SLA
        </h3>
        <Badge className={isHealthy ? "bg-[hsl(var(--color-green))]/20 text-[hsl(var(--color-green))]" : "bg-destructive/20 text-destructive"}>
          {isHealthy ? "Healthy" : "Degraded"}
        </Badge>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Sources Refreshed (2h)</span>
            <span className="font-medium">{stats.sourcesRefreshed}/{stats.totalActiveSources} ({stats.sourcesRefreshedPct}%)</span>
          </div>
          <Progress value={stats.sourcesRefreshedPct} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center p-2 rounded-lg bg-secondary/50">
            <p className="text-lg font-bold">{formatAge(stats.p50AgeMinutes)}</p>
            <p className="text-xs text-muted-foreground">P50 Job Age</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-secondary/50">
            <p className="text-lg font-bold">{formatAge(stats.p90AgeMinutes)}</p>
            <p className="text-xs text-muted-foreground">P90 Job Age</p>
          </div>
        </div>
        
        <div className="flex justify-between text-sm pt-2 border-t border-border">
          <div className="text-center">
            <p className="font-semibold text-[hsl(var(--color-green))]">{stats.activeJobs.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-[hsl(var(--color-orange))]">{stats.staleJobs.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Stale</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-destructive">{stats.expiredJobs.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Expired</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Source SLA Row Component
function SourceSLARow({ source }: { source: JobSource }) {
  const lastSuccess = source.last_success_at 
    ? formatDistanceToNow(new Date(source.last_success_at), { addSuffix: true })
    : "Never";
  
  const isStale = source.last_success_at 
    ? differenceInHours(new Date(), new Date(source.last_success_at)) > 2
    : true;
  
  const successRate = source.success_count_24h + source.failure_count_24h > 0
    ? Math.round((source.success_count_24h / (source.success_count_24h + source.failure_count_24h)) * 100)
    : 0;

  return (
    <div className={`flex items-center justify-between p-3 border-b border-border last:border-0 ${isStale ? "bg-destructive/5" : ""}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <span className="text-sm font-bold">{source.company_name[0]}</span>
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{source.company_name}</p>
          <p className={`text-xs ${isStale ? "text-destructive" : "text-muted-foreground"}`}>
            {lastSuccess}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-xs">
        <div className="text-center min-w-[50px]">
          <p className={`font-medium ${successRate >= 80 ? "text-[hsl(var(--color-green))]" : successRate >= 50 ? "text-[hsl(var(--color-orange))]" : "text-destructive"}`}>
            {successRate}%
          </p>
          <p className="text-muted-foreground">Success</p>
        </div>
        <div className="text-center min-w-[50px]">
          <p className="font-medium text-[hsl(var(--color-green))]">+{source.jobs_added_24h}</p>
          <p className="text-muted-foreground">Added</p>
        </div>
        <div className="text-center min-w-[50px]">
          <p className="font-medium text-primary">{source.jobs_updated_24h}</p>
          <p className="text-muted-foreground">Updated</p>
        </div>
        <div className="text-center min-w-[50px]">
          <p className="font-medium">{source.jobs_seen_24h}</p>
          <p className="text-muted-foreground">Seen</p>
        </div>
        {isStale && (
          <AlertTriangle className="h-4 w-4 text-destructive" />
        )}
      </div>
    </div>
  );
}

// Source Row Component
function SourceRow({ 
  source, 
  onTrigger,
  onToggleStatus,
  isLoading 
}: { 
  source: JobSource;
  onTrigger: (id: string) => void;
  onToggleStatus: (id: string, status: string) => void;
  isLoading: boolean;
}) {
  const lastPoll = source.last_poll_at 
    ? formatDistanceToNow(new Date(source.last_poll_at), { addSuffix: true })
    : "Never";

  return (
    <div className="flex items-center justify-between p-4 border-b border-border last:border-0">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
          <span className="text-lg font-bold">{source.company_name[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium truncate">{source.company_name}</h4>
            <Badge variant="outline" className="text-xs capitalize">
              {source.source_type}
            </Badge>
            {source.is_priority_source && (
              <Badge className="bg-primary/20 text-primary text-xs">
                <Zap className="h-2 w-2 mr-1" /> Priority
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span>Last poll: {lastPoll}</span>
            <span>•</span>
            <span>{source.active_job_count} active jobs</span>
            {source.last_error_message && (
              <>
                <span>•</span>
                <span className="text-destructive truncate max-w-48">{source.last_error_message}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge className={getStatusColor(source.status)}>
          {getStatusIcon(source.status)}
          <span className="ml-1 capitalize">{source.status}</span>
        </Badge>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleStatus(source.id, source.status === "active" ? "paused" : "active")}
          disabled={isLoading}
        >
          {source.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onTrigger(source.id)}
          disabled={isLoading || source.status !== "active"}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

// Log Row Component
function LogRow({ log }: { log: IngestionLog }) {
  const duration = log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : "-";
  const time = formatDistanceToNow(new Date(log.started_at), { addSuffix: true });

  return (
    <div className="flex items-center justify-between p-3 border-b border-border last:border-0 text-sm">
      <div className="flex items-center gap-3">
        {log.success ? (
          <CheckCircle className="h-4 w-4 text-[hsl(var(--color-green))]" />
        ) : (
          <AlertCircle className="h-4 w-4 text-destructive" />
        )}
        <span className="text-muted-foreground">{time}</span>
      </div>
      
      <div className="flex items-center gap-4 text-muted-foreground">
        <span>{log.jobs_fetched} fetched</span>
        <span className="text-[hsl(var(--color-green))]">+{log.jobs_new} new</span>
        <span className="text-primary">{log.jobs_updated} updated</span>
        {log.jobs_stale > 0 && (
          <span className="text-[hsl(var(--color-orange))]">{log.jobs_stale} stale</span>
        )}
        {log.jobs_expired > 0 && (
          <span className="text-destructive">{log.jobs_expired} expired</span>
        )}
        <span>{duration}</span>
      </div>
      
      {log.error_message && (
        <span className="text-destructive text-xs truncate max-w-48">{log.error_message}</span>
      )}
    </div>
  );
}

// Run Row Component
function RunRow({ run }: { run: IngestionRun }) {
  const [showDetails, setShowDetails] = useState(false);
  const duration = run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : "-";
  const time = formatDistanceToNow(new Date(run.started_at), { addSuffix: true });

  return (
    <div className="border-b border-border last:border-0">
      <div 
        className="flex items-center justify-between p-3 text-sm cursor-pointer hover:bg-secondary/30"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-3">
          {run.status === "success" ? (
            <CheckCircle className="h-4 w-4 text-[hsl(var(--color-green))]" />
          ) : run.status === "failed" ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
          <span className="text-muted-foreground">{time}</span>
          <Badge variant="outline" className="text-xs capitalize">{run.run_type}</Badge>
        </div>
        
        <div className="flex items-center gap-4 text-muted-foreground">
          <span>{run.jobs_fetched} fetched</span>
          <span className="text-[hsl(var(--color-green))]">+{run.jobs_new} new</span>
          <span className="text-primary">{run.jobs_updated} updated</span>
          {run.jobs_stale > 0 && (
            <span className="text-[hsl(var(--color-orange))]">{run.jobs_stale} stale</span>
          )}
          {run.jobs_expired > 0 && (
            <span className="text-destructive">{run.jobs_expired} expired</span>
          )}
          <span>{duration}</span>
          <Eye className="h-4 w-4" />
        </div>
      </div>
      
      {showDetails && (
        <div className="px-4 pb-3 pt-1 bg-secondary/20 text-xs">
          <div className="grid grid-cols-3 gap-4">
            {run.sample_new_job_ids?.length > 0 && (
              <div>
                <p className="font-medium text-[hsl(var(--color-green))] mb-1">New Jobs (sample)</p>
                <div className="space-y-0.5">
                  {run.sample_new_job_ids.slice(0, 5).map(id => (
                    <p key={id} className="text-muted-foreground font-mono truncate">{id}</p>
                  ))}
                </div>
              </div>
            )}
            {run.sample_updated_job_ids?.length > 0 && (
              <div>
                <p className="font-medium text-primary mb-1">Updated Jobs (sample)</p>
                <div className="space-y-0.5">
                  {run.sample_updated_job_ids.slice(0, 5).map(id => (
                    <p key={id} className="text-muted-foreground font-mono truncate">{id}</p>
                  ))}
                </div>
              </div>
            )}
            {run.sample_expired_job_ids?.length > 0 && (
              <div>
                <p className="font-medium text-destructive mb-1">Expired Jobs (sample)</p>
                <div className="space-y-0.5">
                  {run.sample_expired_job_ids.slice(0, 5).map(id => (
                    <p key={id} className="text-muted-foreground font-mono truncate">{id}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
          {run.error_message && (
            <p className="text-destructive mt-2">Error: {run.error_message}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("freshness");
  const [triggeringSource, setTriggeringSource] = useState<string | null>(null);

  const { data: sources, isLoading: sourcesLoading } = useJobSources();
  const { data: logs, isLoading: logsLoading } = useIngestionLogs(undefined, 100);
  const { data: runs, isLoading: runsLoading } = useIngestionRuns(100);
  const { data: freshnessStats } = useFreshnessStats();
  const { data: stats } = useJobStats();
  
  const triggerIngestion = useTriggerIngestion();
  const triggerClassification = useTriggerClassification();
  const triggerVerification = useTriggerVerification();
  const triggerLogoResolver = useTriggerLogoResolver();
  const updateStatus = useUpdateSourceStatus();

  const handleTriggerSource = async (sourceId: string) => {
    setTriggeringSource(sourceId);
    try {
      const result = await triggerIngestion.mutateAsync({ source_id: sourceId });
      toast.success("Ingestion complete", {
        description: `+${result.total_new} new, ${result.total_updated} updated`,
      });
    } catch (err) {
      toast.error("Ingestion failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setTriggeringSource(null);
    }
  };

  const handleTriggerAll = async () => {
    try {
      const result = await triggerIngestion.mutateAsync({ limit: 20 });
      toast.success("Batch ingestion complete", {
        description: `${result.sources_processed} sources, +${result.total_new} new jobs`,
      });
    } catch (err) {
      toast.error("Ingestion failed");
    }
  };

  const handleTriggerClassify = async () => {
    try {
      const result = await triggerClassification.mutateAsync({ limit: 20 });
      toast.success("Classification complete", {
        description: `${result.classified} jobs classified`,
      });
    } catch (err) {
      toast.error("Classification failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleTriggerVerify = async () => {
    try {
      const result = await triggerVerification.mutateAsync({ limit: 20 });
      toast.success("Verification complete", {
        description: `${result.verified} jobs verified, ${result.expired} expired`,
      });
    } catch (err) {
      toast.error("Verification failed");
    }
  };

  const handleTriggerLogos = async () => {
    try {
      const result = await triggerLogoResolver.mutateAsync({ batch_size: 500 });
      toast.success("Logo resolution complete", {
        description: `${result.successCount}/${result.processed} logos resolved`,
      });
    } catch (err) {
      toast.error("Logo resolution failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleToggleStatus = async (id: string, status: "active" | "paused" | "failing" | "disabled") => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Source ${status === "active" ? "activated" : "paused"}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const activeSources = sources?.filter(s => s.status === "active").length || 0;
  const failingSources = sources?.filter(s => s.status === "failing").length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 apple-blur border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Job Intelligence Pipeline</h1>
              <p className="text-xs text-muted-foreground">Admin Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTriggerLogos}
              disabled={triggerLogoResolver.isPending}
            >
              {triggerLogoResolver.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Image className="h-4 w-4 mr-2" />}
              Fix Logos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTriggerVerify}
              disabled={triggerVerification.isPending}
            >
              {triggerVerification.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
              Verify Jobs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTriggerClassify}
              disabled={triggerClassification.isPending}
            >
              {triggerClassification.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
              AI Classify
            </Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={handleTriggerAll}
              disabled={triggerIngestion.isPending}
            >
              {triggerIngestion.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Ingest All
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard 
            title="Total Jobs" 
            value={stats?.total || 0} 
            icon={Database}
            color="bg-primary/20 text-primary"
          />
          <StatCard 
            title="New Today" 
            value={stats?.freshToday || 0} 
            icon={TrendingUp}
            color="bg-[hsl(var(--color-green))]/20 text-[hsl(var(--color-green))]"
          />
          <StatCard 
            title="Pending AI" 
            value={stats?.pendingAi || 0} 
            icon={Brain}
            color="bg-[hsl(var(--color-orange))]/20 text-[hsl(var(--color-orange))]"
          />
          <StatCard 
            title="Verified Active" 
            value={stats?.verified || 0} 
            icon={Shield}
            color="bg-[hsl(var(--color-teal))]/20 text-[hsl(var(--color-teal))]"
          />
          <StatCard 
            title="With Logos" 
            value={`${stats?.logoPercentage || 0}%`} 
            icon={Image}
            color="bg-[hsl(var(--color-purple))]/20 text-[hsl(var(--color-purple))]"
            subtitle={`${stats?.withLogos || 0} jobs`}
          />
        </div>

        {/* Freshness SLA + Source Health */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <FreshnessSLACard stats={freshnessStats} />
          
          <Card className="md:col-span-2 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Source Health (24h)
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-2 py-0.5">
                  {sources?.length || 0} Total
                </Badge>
                <Badge className="bg-[hsl(var(--color-green))]/20 text-[hsl(var(--color-green))] px-2 py-0.5">
                  {activeSources} Active
                </Badge>
                {failingSources > 0 && (
                  <Badge className="bg-destructive/20 text-destructive px-2 py-0.5">
                    {failingSources} Failing
                  </Badge>
                )}
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {sources?.slice(0, 10).map((source) => (
                <SourceSLARow key={source.id} source={source} />
              ))}
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="freshness">Freshness SLA</TabsTrigger>
            <TabsTrigger value="sources">Job Sources</TabsTrigger>
            <TabsTrigger value="runs">Ingestion Runs</TabsTrigger>
            <TabsTrigger value="logs">Ingestion Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="freshness">
            <Card>
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">All Sources - Freshness Status</h3>
                <p className="text-sm text-muted-foreground">Sources highlighted in red have not been refreshed in over 2 hours</p>
              </div>
              {sourcesLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : sources?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No job sources configured
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  {sources?.map((source) => (
                    <SourceSLARow key={source.id} source={source} />
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="sources">
            <Card>
              {sourcesLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : sources?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No job sources configured
                </div>
              ) : (
                sources?.map((source) => (
                  <SourceRow
                    key={source.id}
                    source={source}
                    onTrigger={handleTriggerSource}
                    onToggleStatus={handleToggleStatus}
                    isLoading={triggeringSource === source.id}
                  />
                ))
              )}
            </Card>
          </TabsContent>

          <TabsContent value="runs">
            <Card>
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Ingestion Runs</h3>
                <p className="text-sm text-muted-foreground">Click a run to see sample job IDs that were added, updated, or expired</p>
              </div>
              {runsLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : runs?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No ingestion runs yet
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  {runs?.map((run) => (
                    <RunRow key={run.id} run={run} />
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              {logsLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : logs?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No ingestion logs yet
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  {logs?.map((log) => (
                    <LogRow key={log.id} log={log} />
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
