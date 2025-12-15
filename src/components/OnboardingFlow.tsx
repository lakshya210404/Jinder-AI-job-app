import { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "./ui/button";
import { ProgressBar } from "./ProgressBar";
import { WelcomeStep } from "./steps/WelcomeStep";
import { ProfileStep } from "./steps/ProfileStep";
import { PreferencesStep } from "./steps/PreferencesStep";
import { SkillsStep } from "./steps/SkillsStep";
import { ReadyStep } from "./steps/ReadyStep";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    title: "",
  });
  const [preferencesData, setPreferencesData] = useState({
    location: "",
    salary: "",
    workType: "",
  });
  const [skillsData, setSkillsData] = useState({
    skills: [] as string[],
  });

  const totalSteps = 5;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return <ProfileStep data={profileData} onChange={setProfileData} />;
      case 2:
        return <PreferencesStep data={preferencesData} onChange={setPreferencesData} />;
      case 3:
        return <SkillsStep data={skillsData} onChange={setSkillsData} />;
      case 4:
        return <ReadyStep />;
      default:
        return <WelcomeStep />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="pt-6 pb-4">
        <p className="text-sm text-muted-foreground text-center mb-4">
          Step {currentStep + 1} of {totalSteps}
        </p>
        <ProgressBar currentStep={currentStep + 1} totalSteps={totalSteps} />
      </header>

      <main className="flex-1 flex flex-col">
        {renderStep()}
      </main>

      <footer className="p-6 pb-8">
        <div className="flex gap-3 max-w-md mx-auto">
          {currentStep > 0 && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleBack}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          <Button
            variant="gradient"
            size="lg"
            onClick={handleNext}
            className={currentStep === 0 ? "w-full" : "flex-1"}
          >
            {currentStep === totalSteps - 1 ? "Start Swiping" : "Continue"}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
};
