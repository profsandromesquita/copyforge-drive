import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

interface OnboardingStep4Props {
  firstName: string;
  onComplete: () => void;
  onBack: () => void;
}

const OnboardingStep4 = ({ firstName, onComplete, onBack }: OnboardingStep4Props) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);
  return (
    <div className="max-w-xl mx-auto text-center animate-fade-in">
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 rounded-full bg-green-100 flex items-center justify-center animate-scale-in">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">
          Projeto criado! 🎉
        </h1>
        
        <div className="flex gap-1.5 mt-6">
          <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep4;
