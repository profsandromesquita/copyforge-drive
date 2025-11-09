import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      {subStep === 1 && (
        <>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Vamos criar seu primeiro projeto!
            </h1>
            <p className="text-xl text-muted-foreground">
              Digite o nome do seu Projeto/Marca:
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="project-name">Nome do Projeto</Label>
              <Input
                id="project-name"
                placeholder="Ex: Minha Empresa"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="text-lg"
                autoFocus
              />
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <Button onClick={onBack} variant="outline" size="lg">
              Voltar
            </Button>
            <Button 
              onClick={handleNextSubStep} 
              disabled={!projectName.trim()}
              size="lg"
            >
              Continuar
            </Button>
          </div>
        </>
      )}

      {subStep === 2 && (
        <>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Qual o setor de atuação?
            </h1>
            <p className="text-xl text-muted-foreground">
              Isso nos ajuda a personalizar suas copies
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="sector">Setor</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger id="sector" className="text-lg">
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <Button onClick={() => setSubStep(1)} variant="outline" size="lg">
              Voltar
            </Button>
            <Button 
              onClick={handleNextSubStep} 
              disabled={!sector}
              size="lg"
            >
              Continuar
            </Button>
          </div>
        </>
      )}

      {subStep === 3 && (
        <>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Qual o propósito central do seu projeto?
            </h1>
            <p className="text-xl text-muted-foreground">
              O que você busca alcançar com este projeto?
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="purpose">Propósito Central</Label>
              <Textarea
                id="purpose"
                placeholder="Ex: Ajudar pessoas a alcançarem liberdade financeira através de investimentos inteligentes"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="min-h-[120px] text-lg"
                autoFocus
              />
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <Button onClick={() => setSubStep(2)} variant="outline" size="lg">
              Voltar
            </Button>
            <Button 
              onClick={handleNextSubStep} 
              disabled={!purpose.trim()}
              size="lg"
            >
              Continuar
            </Button>
          </div>
        </>
      )}

      {subStep === 4 && (
        <>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Personalidade da marca
            </h1>
            <p className="text-xl text-muted-foreground">
              Selecione até 3 características que definem sua marca
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {BRAND_PERSONALITIES.map((personality) => (
              <button
                key={personality}
                onClick={() => togglePersonality(personality)}
                disabled={!personalities.includes(personality) && personalities.length >= 3}
                className={`p-4 text-left rounded-lg border-2 transition-all ${
                  personalities.includes(personality)
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/50"
                } ${
                  !personalities.includes(personality) && personalities.length >= 3
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <span className="font-medium">{personality}</span>
              </button>
            ))}
          </div>

          <div className="mt-8 flex justify-between">
            <Button onClick={() => setSubStep(3)} variant="outline" size="lg">
              Voltar
            </Button>
            <Button 
              onClick={handleComplete} 
              disabled={personalities.length === 0 || loading}
              size="lg"
            >
              {loading ? "Criando projeto..." : "Criar Projeto"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default OnboardingStep3;
