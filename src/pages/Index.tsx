import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { SwipeInterface } from "@/components/SwipeInterface";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

const Index = () => {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const checkProfile = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, title, skills')
          .eq('user_id', user.id)
          .single();

        if (profile?.name && profile?.title && profile?.skills?.length > 0) {
          setOnboardingComplete(true);
        }
        setCheckingProfile(false);
      }
    };

    if (user) {
      checkProfile();
    }
  }, [user]);

  const handleOnboardingComplete = async (userData: {
    name: string;
    email: string;
    title: string;
    location: string;
    salaryRange: string;
    workType: string;
    skills: string[];
  }) => {
    if (!user) return;

    await supabase
      .from('profiles')
      .update({
        name: userData.name,
        email: userData.email,
        title: userData.title,
        location: userData.location,
        salary_range: userData.salaryRange,
        work_type: userData.workType,
        skills: userData.skills,
      })
      .eq('user_id', user.id);

    setOnboardingComplete(true);
  };

  if (loading || checkingProfile || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-end">
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
          <Settings className="w-5 h-5" />
        </Button>
      </header>
      
      {onboardingComplete ? (
        <SwipeInterface />
      ) : (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      )}
    </div>
  );
};

export default Index;
