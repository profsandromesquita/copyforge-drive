import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderOpen, FileText, Layers } from "lucide-react";
import { useState } from "react";

interface OnboardingStep2Props {
  firstName: string;
  onComplete: (workspaceName: string) => void;
  onBack: () => void;
}

const OnboardingStep2 = ({ firstName, onComplete, onBack }: OnboardingStep2Props) => {
  const [workspaceName, setWorkspaceName] = useState(`Workspace de ${firstName}`);
  const handleContinue = () => {
    if (workspaceName.trim()) {
      onComplete(workspaceName.trim());
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Boa! Agora digite o nome do seu primeiro Workspace
        </h1>
        <p className="text-xl text-muted-foreground">
          Este será o espaço principal onde você organizará seus projetos e copies.
        </p>
      </div>

      <div className="mb-8">
        <label htmlFor="workspace-name" className="block text-sm font-medium mb-2 text-foreground">
          Nome do Workspace
        </label>
        <Input
          id="workspace-name"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          placeholder={`Workspace de ${firstName}`}
          className="text-lg h-12"
        />
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
          Seu workspace será o local onde você criará e organizará todos os seus projetos.
        </p>
      </div>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" size="lg">
          Voltar
        </Button>
        <Button 
          onClick={handleContinue} 
          size="lg"
          disabled={!workspaceName.trim()}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default OnboardingStep2;
