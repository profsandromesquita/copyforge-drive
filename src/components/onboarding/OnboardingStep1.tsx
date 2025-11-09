import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OnboardingStep1Props {
  firstName: string;
  onComplete: (occupation: string, customOccupation?: string) => void;
}

const OCCUPATIONS = [
  "Copywriter",
  "Estrategista",
  "Agência",
  "Criador de Conteúdo",
  "Designer",
  "Profissional de Marketing",
  "Outro"
];

const OnboardingStep1 = ({ firstName, onComplete }: OnboardingStep1Props) => {
  const [selected, setSelected] = useState<string>("");
  const [customValue, setCustomValue] = useState("");

  const handleContinue = () => {
    if (!selected) return;
    if (selected === "Outro" && !customValue.trim()) return;
    
    onComplete(selected, selected === "Outro" ? customValue : undefined);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Opa {firstName}, bom ter você no Copy Drive 🚀!
        </h1>
        <p className="text-xl text-muted-foreground">
          O que melhor define sua atuação:
        </p>
      </div>

      <div className="space-y-3">
        {OCCUPATIONS.map((occupation) => (
          <button
            key={occupation}
            onClick={() => setSelected(occupation)}
            className={`w-full p-4 text-left rounded-lg border-2 transition-all hover:border-primary ${
              selected === occupation
                ? "border-primary bg-primary/5"
                : "border-border bg-card"
            }`}
          >
            <span className="text-lg font-medium">{occupation}</span>
          </button>
        ))}
      </div>

      {selected === "Outro" && (
        <div className="mt-6 space-y-2 animate-in fade-in duration-300">
          <Label htmlFor="custom-occupation">Digite sua atuação</Label>
          <Input
            id="custom-occupation"
            placeholder="Ex: Redator Publicitário"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            autoFocus
          />
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!selected || (selected === "Outro" && !customValue.trim())}
          size="lg"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default OnboardingStep1;
