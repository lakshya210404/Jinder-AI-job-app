import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Download, Copy, Loader2 } from "lucide-react";

interface ProfileData {
  name: string;
  email: string;
  title: string;
  skills: string[];
}

export default function ResumeBuilder() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const targetJob = location.state?.job;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("name, email, title, skills")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const handleGenerateResume = async () => {
    if (!profile) {
      toast({ title: "Please complete your profile first", variant: "destructive" });
      return;
    }

    setGenerating(true);
    setGeneratedResume("");

    try {
      const response = await supabase.functions.invoke("generate-resume", {
        body: {
          profile,
          additionalInfo,
          targetJob: targetJob
            ? {
                title: targetJob.title,
                company: targetJob.company,
                description: targetJob.description,
                requirements: targetJob.requirements,
              }
            : null,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setGeneratedResume(response.data.resume);
      toast({ title: "Resume generated successfully!" });
    } catch (error: any) {
      toast({
        title: "Failed to generate resume",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyResume = () => {
    navigator.clipboard.writeText(generatedResume);
    toast({ title: "Resume copied to clipboard!" });
  };

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Resume Builder</h1>
          <p className="text-muted-foreground mt-1">
            Generate a professional resume tailored to your target role
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <Card className="apple-card">
              <CardHeader>
                <CardTitle className="text-lg">Your Profile</CardTitle>
                <CardDescription>This information will be used to generate your resume</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input value={profile?.name || ""} disabled className="mt-1.5 bg-secondary" />
                </div>
                <div>
                  <Label>Title</Label>
                  <Input value={profile?.title || ""} disabled className="mt-1.5 bg-secondary" />
                </div>
                <div>
                  <Label>Skills</Label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {profile?.skills?.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-secondary rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Target Job (if selected) */}
            {targetJob && (
              <Card className="apple-card border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Tailoring for Job
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{targetJob.title}</p>
                  <p className="text-muted-foreground">{targetJob.company}</p>
                </CardContent>
              </Card>
            )}

            {/* Additional Info */}
            <Card className="apple-card">
              <CardHeader>
                <CardTitle className="text-lg">Additional Information</CardTitle>
                <CardDescription>
                  Add any extra details like experience, achievements, or education
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="E.g., 5 years of experience in frontend development, led a team of 3 engineers, Bachelor's in Computer Science..."
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  className="min-h-[150px] bg-secondary border-0"
                />
              </CardContent>
            </Card>

            <Button
              onClick={handleGenerateResume}
              disabled={generating}
              className="w-full rounded-full h-12"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Resume
                </>
              )}
            </Button>
          </div>

          {/* Output Section */}
          <Card className="apple-card">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Generated Resume</CardTitle>
                <CardDescription>Your AI-generated professional resume</CardDescription>
              </div>
              {generatedResume && (
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={handleCopyResume} className="rounded-full">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {generating ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Crafting your perfect resume...</p>
                </div>
              ) : generatedResume ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm bg-secondary p-4 rounded-xl">
                    {generatedResume}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto bg-secondary rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Click "Generate Resume" to create your AI-powered resume
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}