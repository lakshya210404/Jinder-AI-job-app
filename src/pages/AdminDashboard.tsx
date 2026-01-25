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
  Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  useJobSources, 
  useIngestionLogs, 
  useTriggerIngestion,
  useTriggerClassification,
  useTriggerVerification,
  useTriggerLogoResolver,
  useUpdateSourceStatus,
  useJobStats,
  type JobSource,
  type IngestionLog
} from "@/hooks/useJobIntelligence";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

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

// Stats Card Component
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: number | string; 
  icon: typeof Database;
  color: string;
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
        </div>
      </div>
    </Card>
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
        <span>{duration}</span>
      </div>
      
      {log.error_message && (
        <span className="text-destructive text-xs truncate max-w-48">{log.error_message}</span>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("sources");
  const [triggeringSource, setTriggeringSource] = useState<string | null>(null);

  const { data: sources, isLoading: sourcesLoading } = useJobSources();
  const { data: logs, isLoading: logsLoading } = useIngestionLogs(undefined, 100);
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
      const result = await triggerLogoResolver.mutateAsync({ batch_size: 2000 });
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
        </div>

        {/* Source Health Summary */}
        <div className="flex items-center gap-4 mb-6">
          <Badge variant="outline" className="px-3 py-1">
            {sources?.length || 0} Total Sources
          </Badge>
          <Badge className="bg-[hsl(var(--color-green))]/20 text-[hsl(var(--color-green))] px-3 py-1">
            {activeSources} Active
          </Badge>
          {failingSources > 0 && (
            <Badge className="bg-destructive/20 text-destructive px-3 py-1">
              {failingSources} Failing
            </Badge>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="sources">Job Sources</TabsTrigger>
            <TabsTrigger value="logs">Ingestion Logs</TabsTrigger>
          </TabsList>

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
