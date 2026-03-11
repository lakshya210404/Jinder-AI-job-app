import { Sparkles, CheckCircle } from "lucide-react";

export const ReadyStep = () => {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 animate-fade-in">
      <div className="w-20 h-20 rounded-full gradient-button flex items-center justify-center mb-8 animate-pulse-glow">
        <Sparkles className="w-10 h-10 text-primary-foreground" />
      </div>
      
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
        You're All Set!
      </h2>
      
      <p className="text-muted-foreground text-center max-w-md mb-10 leading-relaxed">
        Your profile is ready. Start swiping to find your dream job. 
        Our AI will optimize your applications for maximum success.
      </p>
      
      <div className="space-y-4 w-full max-w-sm">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
          <span className="text-foreground">AI-powered resume optimization</span>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
          <span className="text-foreground">One-swipe job applications</span>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary animate-slide-up" style={{ animationDelay: '300ms' }}>
          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
          <span className="text-foreground">Real-time application tracking</span>
        </div>
      </div>
    </div>
  );
};
