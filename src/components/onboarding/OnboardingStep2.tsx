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
    <div className="max-w-xl mx-auto animate-fade-in pb-24 md:pb-0">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">
          Nome do Workspace
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Seu espaço para organizar projetos e copies
        </p>
      </div>

      <div className="mb-6 sm:mb-8">
        <Input
          id="workspace-name"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          placeholder={`Workspace de ${firstName}`}
          className="text-base sm:text-lg h-12 sm:h-14 text-center font-medium"
        />
      </div>

      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="space-y-4 sm:space-y-5">
          {/* Workspace */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">Workspace</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Espaço principal
              </p>
            </div>
          </div>

          <div className="ml-5 sm:ml-6 border-l-2 border-border/50 pl-4 sm:pl-5">
            {/* Projeto */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold">Projetos</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Cada marca/negócio
                </p>
              </div>
            </div>

            <div className="ml-5 sm:ml-6 border-l-2 border-border/50 pl-4 sm:pl-5">
              {/* Drive de Copies */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold">Copies</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Seus conteúdos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border md:relative md:border-t-0 md:p-0">
        <div className="max-w-xl mx-auto flex gap-3">
          <Button onClick={onBack} variant="outline" size="lg" className="flex-1">
            Voltar
          </Button>
          <Button 
            onClick={handleContinue} 
            size="lg"
            disabled={!workspaceName.trim()}
            className="flex-1"
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep2;
