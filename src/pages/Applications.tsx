import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, MapPin, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Application {
  id: string;
  job_id: string;
  created_at: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    logo_url: string | null;
  };
}

export default function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("user_job_interactions")
      .select(`
        id,
        job_id,
        created_at,
        jobs (
          id,
          title,
          company,
          location,
          logo_url
        )
      `)
      .eq("user_id", user.id)
      .eq("action", "applied")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading applications", variant: "destructive" });
    } else {
      const formatted = (data || []).map((item: any) => ({
        id: item.id,
        job_id: item.job_id,
        created_at: item.created_at,
        job: item.jobs,
      }));
      setApplications(formatted);
    }
    setLoading(false);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Applications</h1>
          <p className="text-muted-foreground mt-1">
            Track the progress of your {applications.length} application{applications.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="apple-card p-5">
                <div className="flex gap-4">
                  <Skeleton className="w-14 h-14 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              </div>
            ))
          ) : applications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto bg-secondary rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No applications yet</h3>
              <p className="text-muted-foreground">
                Apply to jobs and track your progress here.
              </p>
            </div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="apple-card p-5">
                <div className="flex items-center gap-4">
                  {/* Logo */}
                  <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                    {app.job.logo_url ? (
                      <img src={app.job.logo_url} alt={app.job.company} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-muted-foreground font-semibold">
                        {app.job.company.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground text-lg leading-tight">
                          {app.job.title}
                        </h3>
                        <p className="text-muted-foreground">{app.job.company}</p>
                      </div>
                      <Badge variant="secondary" className="rounded-full shrink-0">
                        Applied
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <span>{app.job.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>Applied {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}