import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VoiceInput } from "@/components/project-config/VoiceInput";
import { SECTORS, BRAND_PERSONALITIES } from "@/types/project-config";

interface OnboardingStep3Props {
  firstName: string;
  onComplete: (data: {
    name: string;
    sector: string;
    central_purpose: string;
    brand_personality: string[];
  }) => void;
  onBack: () => void;
  loading: boolean;
}

const OnboardingStep3 = ({ firstName, onComplete, onBack, loading }: OnboardingStep3Props) => {
  const [subStep, setSubStep] = useState(1);
  const [projectName, setProjectName] = useState("");
  const [sector, setSector] = useState("");
  const [purpose, setPurpose] = useState("");
  const [personalities, setPersonalities] = useState<string[]>([]);

  const handleNextSubStep = () => {
    setSubStep(subStep + 1);
  };

  const togglePersonality = (personality: string) => {
    setPersonalities(prev => 
      prev.includes(personality)
        ? prev.filter(p => p !== personality)
        : [...prev, personality]
    );
  };

  const handleComplete = () => {
    onComplete({
      name: projectName,
      sector,
      central_purpose: purpose,
      brand_personality: personalities
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-24 md:pb-0">
      {subStep === 1 && (
        <div className="max-w-xl mx-auto animate-fade-in">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">
              Seu primeiro projeto
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              1/4 · Nome do Projeto
            </p>
          </div>

          <div className="mb-6">
            <Label htmlFor="project-name" className="text-sm sm:text-base mb-2 block">Nome do Projeto</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Ex: Minha Empresa"
              className="text-base h-11 sm:h-12"
              autoFocus
            />
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border md:relative md:border-t-0 md:p-0">
            <div className="max-w-xl mx-auto">
              <Button
                onClick={handleNextSubStep}
                disabled={!projectName.trim()}
                size="lg"
                className="w-full"
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      )}

      {subStep === 2 && (
        <div className="max-w-xl mx-auto animate-fade-in">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">
              Setor de atuação
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              2/4 · Qual o setor?
            </p>
          </div>

          <div className="mb-6">
            <Label htmlFor="sector" className="text-sm sm:text-base mb-2 block">Setor</Label>
            <Select value={sector} onValueChange={setSector}>
              <SelectTrigger id="sector" className="h-11 sm:h-12 text-base">
                <SelectValue placeholder="Selecione o setor" />
              </SelectTrigger>
              <SelectContent>
                {SECTORS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border md:relative md:border-t-0 md:p-0">
            <div className="max-w-xl mx-auto">
              <Button
                onClick={handleNextSubStep}
                disabled={!sector}
                size="lg"
                className="w-full"
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      )}

      {subStep === 3 && (
        <div className="max-w-xl mx-auto animate-fade-in">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">
              Propósito central
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              3/4 · Por que seu projeto existe?
            </p>
          </div>

          <div className="mb-6">
            <Label htmlFor="purpose" className="text-sm sm:text-base mb-2 block">Descreva o propósito</Label>
            <div className="relative">
              <Textarea
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Ex: Ajudar empresas a crescerem através de marketing digital"
                className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base resize-none pr-12"
                autoFocus
              />
              <VoiceInput
                onTranscript={(text) => {
                  setPurpose(prev => prev ? `${prev} ${text}` : text);
                }}
              />
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border md:relative md:border-t-0 md:p-0">
            <div className="max-w-xl mx-auto">
              <Button
                onClick={handleNextSubStep}
                disabled={!purpose.trim()}
                size="lg"
                className="w-full"
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      )}

      {subStep === 4 && (
        <div className="max-w-xl mx-auto animate-fade-in">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">
              Personalidade da marca
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              4/4 · Escolha até 3 características
            </p>
          </div>

          <div className="mb-6">
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {BRAND_PERSONALITIES.map((personality) => (
                <button
                  key={personality}
                  onClick={() => togglePersonality(personality)}
                  disabled={personalities.length >= 3 && !personalities.includes(personality)}
                  className={`p-3 sm:p-3.5 rounded-lg border transition-all text-sm sm:text-base ${
                    personalities.includes(personality)
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50 hover:bg-accent/50"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <span className="font-medium">{personality}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border md:relative md:border-t-0 md:p-0">
            <div className="max-w-xl mx-auto">
              <Button
                onClick={handleComplete}
                disabled={personalities.length === 0 || loading}
                size="lg"
                className="w-full"
              >
                {loading ? "Avançando..." : "Avançar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingStep3;
