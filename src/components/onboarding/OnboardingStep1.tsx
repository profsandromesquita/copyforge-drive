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
    <div className="max-w-xl mx-auto animate-fade-in">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">
          Opa {firstName}! 👋
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          O que melhor define sua atuação?
        </p>
      </div>

      <div className="space-y-2 sm:space-y-2.5">
        {OCCUPATIONS.map((occupation) => (
          <button
            key={occupation}
            onClick={() => setSelected(occupation)}
            className={`w-full p-3 sm:p-3.5 text-left rounded-lg border transition-all ${
              selected === occupation
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/50 hover:bg-accent/50"
            }`}
          >
            <span className="text-sm sm:text-base font-medium">{occupation}</span>
          </button>
        ))}
      </div>

      {selected === "Outro" && (
        <div className="mt-4 space-y-2 animate-fade-in">
          <Label htmlFor="custom-occupation" className="text-sm">Digite sua atuação</Label>
          <Input
            id="custom-occupation"
            placeholder="Ex: Redator Publicitário"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            autoFocus
            className="h-11"
          />
        </div>
      )}

      <div className="mt-6 sm:mt-8 flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!selected || (selected === "Outro" && !customValue.trim())}
          size="lg"
          className="px-8"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default OnboardingStep1;
