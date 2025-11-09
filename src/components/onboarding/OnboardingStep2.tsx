import { Button } from "@/components/ui/button";
import { FolderOpen, FileText, Layers } from "lucide-react";

interface OnboardingStep2Props {
  workspaceName: string;
  onComplete: () => void;
  onBack: () => void;
}

const OnboardingStep2 = ({ workspaceName, onComplete, onBack }: OnboardingStep2Props) => {
  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Entenda a hierarquia do sistema
        </h1>
        <p className="text-xl text-muted-foreground">
          É simples e intuitivo! 💡
        </p>
      </div>

      <div className="bg-card border-2 border-border rounded-lg p-8 mb-8">
        <div className="space-y-8">
          {/* Workspace */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Layers className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">WORKSPACE</h3>
              <p className="text-muted-foreground">
                O espaço principal onde tudo acontece. Você pode ter vários workspaces.
              </p>
            </div>
          </div>

          <div className="ml-6 border-l-2 border-border pl-6">
            {/* Projeto */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">PROJETO</h3>
                <p className="text-muted-foreground">
                  Cada projeto representa uma marca ou negócio. Configure identidade, público e ofertas.
                </p>
              </div>
            </div>

            <div className="ml-6 mt-6 border-l-2 border-border pl-6">
              {/* Drive de Copies */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">DRIVE DE COPIES</h3>
                  <p className="text-muted-foreground">
                    Dentro de cada projeto, organize suas copies em pastas e crie conteúdos incríveis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
        <p className="text-lg text-center">
          <strong>Boa!</strong> Agora vamos criar o primeiro projeto do seu Workspace{" "}
          <span className="font-bold text-primary">{workspaceName}</span>, onde ficarão os seus projetos e drive de cada projeto.
        </p>
      </div>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" size="lg">
          Voltar
        </Button>
        <Button onClick={onComplete} size="lg">
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default OnboardingStep2;
