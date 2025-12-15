import { useState } from "react";
import { OnboardingFlow } from "@/components/OnboardingFlow";
import { SwipeInterface } from "@/components/SwipeInterface";

const Index = () => {
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  return onboardingComplete ? (
    <SwipeInterface />
  ) : (
    <OnboardingFlow onComplete={() => setOnboardingComplete(true)} />
  );
};

export default Index;
