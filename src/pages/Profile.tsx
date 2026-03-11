import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, X } from "lucide-react";
import { CountryCombobox } from "@/components/ui/country-combobox";

interface ProfileData {
  name: string;
  email: string;
  title: string;
  location: string;
  salary_range: string;
  work_type: string;
  skills: string[];
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    title: "",
    location: "",
    salary_range: "",
    work_type: "",
    skills: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

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
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setProfile({
        name: data.name || "",
        email: data.email || "",
        title: data.title || "",
        location: data.location || "",
        salary_range: data.salary_range || "",
        work_type: data.work_type || "",
        skills: data.skills || [],
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        name: profile.name,
        email: profile.email,
        title: profile.title,
        location: profile.location,
        salary_range: profile.salary_range,
        work_type: profile.work_type,
        skills: profile.skills,
      })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Failed to save profile", variant: "destructive" });
    } else {
      toast({ title: "Profile saved successfully!" });
    }
    setSaving(false);
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your personal information</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="rounded-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <Card className="apple-card">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic details about you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1.5 bg-secondary border-0"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                  className="mt-1.5 bg-secondary border-0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="title">Professional Title</Label>
              <Input
                id="title"
                placeholder="e.g., Senior Frontend Developer"
                value={profile.title}
                onChange={(e) => setProfile((p) => ({ ...p, title: e.target.value }))}
                className="mt-1.5 bg-secondary border-0"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="apple-card">
          <CardHeader>
            <CardTitle>Job Preferences</CardTitle>
            <CardDescription>What you're looking for</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="location">Preferred Location</Label>
                <div className="mt-1.5">
                  <CountryCombobox
                    value={profile.location}
                    onChange={(location) => setProfile((p) => ({ ...p, location }))}
                    placeholder="Select your preferred country..."
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="work_type">Work Type</Label>
                <Input
                  id="work_type"
                  placeholder="e.g., Full-time, Part-time"
                  value={profile.work_type}
                  onChange={(e) => setProfile((p) => ({ ...p, work_type: e.target.value }))}
                  className="mt-1.5 bg-secondary border-0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="salary">Salary Expectation</Label>
              <Input
                id="salary"
                placeholder="e.g., $100K-$150K"
                value={profile.salary_range}
                onChange={(e) => setProfile((p) => ({ ...p, salary_range: e.target.value }))}
                className="mt-1.5 bg-secondary border-0"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="apple-card">
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>Your technical and soft skills</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill()}
                className="bg-secondary border-0"
              />
              <Button onClick={addSkill} variant="secondary" className="rounded-xl">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="rounded-full px-3 py-1 gap-1">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}