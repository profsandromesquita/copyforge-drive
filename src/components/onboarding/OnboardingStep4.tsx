import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface OnboardingStep4Props {
  firstName: string;
  onComplete: () => void;
  onBack: () => void;
}

const OnboardingStep4 = ({ firstName, onComplete, onBack }: OnboardingStep4Props) => {
  return (
    <div className="max-w-2xl mx-auto text-center animate-in fade-in duration-500">
      <div className="mb-12">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        
        <h1 className="text-4xl font-bold mb-4">
          Show {firstName}, tudo pronto para criar sua primeira copy!
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Mas antes, escolha o plano ideal para o seu Workspace
        </p>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
          <p className="text-lg">
            Seu projeto foi criado com sucesso! 🎉<br />
            Agora vamos escolher o plano que melhor se adapta às suas necessidades.
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" size="lg">
          Voltar
        </Button>
        <Button onClick={onComplete} size="lg">
          Escolher Plano
        </Button>
      </div>
    </div>
  );
};

export default OnboardingStep4;
