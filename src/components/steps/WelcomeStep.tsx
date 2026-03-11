import { StatCard } from "../StatCard";
import { JinderLogo } from "../JinderLogo";

export const WelcomeStep = () => {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 animate-fade-in">
      <div className="mb-8 animate-pulse-glow">
        <JinderLogo size="lg" showText={false} />
      </div>
      
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
        Welcome to <span className="gradient-text">Jinder</span>
      </h1>
      
      <p className="text-muted-foreground text-center max-w-md mb-10 leading-relaxed">
        The fastest way to find your dream job. Swipe right to apply, swipe left to skip. 
        AI optimizes your resume for every application.
      </p>
      
      <div className="flex gap-4 flex-wrap justify-center">
        <StatCard value="10K+" label="Jobs" delay={100} />
        <StatCard value="85%" label="Success Rate" delay={200} />
        <StatCard value="AI" label="Powered" delay={300} />
      </div>
    </div>
  );
};
