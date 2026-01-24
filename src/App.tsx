import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SplashScreen } from "@/components/SplashScreen";
import Jobs from "./pages/Jobs";
import SavedJobs from "./pages/SavedJobs";
import Applications from "./pages/Applications";
import ResumeBuilder from "./pages/ResumeBuilder";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [hasSeenSplash, setHasSeenSplash] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("hasSeenSplash");
    if (seen) {
      setShowSplash(false);
      setHasSeenSplash(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setHasSeenSplash(true);
    sessionStorage.setItem("hasSeenSplash", "true");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          {showSplash && !hasSeenSplash && (
            <SplashScreen onComplete={handleSplashComplete} />
          )}
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Jobs />} />
              <Route path="/saved" element={<SavedJobs />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/resume" element={<ResumeBuilder />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;