import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface OnboardingStep4Props {
  firstName: string;
  onComplete: () => void;
  onBack: () => void;
}

const OnboardingStep4 = ({ firstName, onComplete, onBack }: OnboardingStep4Props) => {
  return (
    <div className="max-w-xl mx-auto text-center animate-fade-in">
      <div className="mb-8 sm:mb-12">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">
          Projeto criado! 🎉
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
          Agora escolha seu plano
        </p>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 sm:p-5">
          <p className="text-sm sm:text-base">
            Comece grátis e faça upgrade quando precisar
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" size="lg" className="flex-1">
          Voltar
        </Button>
        <Button onClick={onComplete} size="lg" className="flex-1">
          Ver Planos
        </Button>
      </div>
    </div>
  );
};

export default OnboardingStep4;
