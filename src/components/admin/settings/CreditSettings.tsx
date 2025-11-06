import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getModelDisplayName } from "@/lib/ai-pricing";
import { toast } from "sonner";

interface ModelCreditConfig {
  model: string;
  inputTokensPerCredit: number;
  outputTokensPerCredit: number;
}

const AVAILABLE_MODELS = [
  'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite',
  'google/gemini-2.5-pro',
  'google/gemini-2.5-flash-image-preview',
  'openai/gpt-5',
  'openai/gpt-5-mini',
  'openai/gpt-5-nano',
];

export const CreditSettings = () => {
  const [configs, setConfigs] = useState<ModelCreditConfig[]>(
    AVAILABLE_MODELS.map(model => ({
      model,
      inputTokensPerCredit: 1000,
      outputTokensPerCredit: 1000,
    }))
  );

  const handleInputChange = (model: string, field: 'inputTokensPerCredit' | 'outputTokensPerCredit', value: string) => {
    const numValue = parseInt(value) || 0;
    setConfigs(prev =>
      prev.map(config =>
        config.model === model
          ? { ...config, [field]: numValue }
          : config
      )
    );
  };

  const handleSave = () => {
    // TODO: Salvar no banco de dados
    console.log('Saving credit configs:', configs);
    toast.success('Configurações de créditos salvas com sucesso!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configurações de Créditos</h2>
        <p className="text-muted-foreground mt-1">
          Configure quantos tokens de input e output equivalem a 1 crédito para cada modelo de IA
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modelos de IA</CardTitle>
          <CardDescription>
            Defina a conversão de tokens para créditos para cada modelo disponível
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {configs.map((config) => (
            <div key={config.model} className="space-y-4 pb-6 border-b last:border-0 last:pb-0">
              <h3 className="font-semibold text-lg">{getModelDisplayName(config.model)}</h3>
              <p className="text-sm text-muted-foreground">{config.model}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`${config.model}-input`}>
                    Tokens de Input por Crédito
                  </Label>
                  <Input
                    id={`${config.model}-input`}
                    type="number"
                    min="1"
                    value={config.inputTokensPerCredit}
                    onChange={(e) => handleInputChange(config.model, 'inputTokensPerCredit', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    1 crédito = {config.inputTokensPerCredit.toLocaleString()} tokens de input
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${config.model}-output`}>
                    Tokens de Output por Crédito
                  </Label>
                  <Input
                    id={`${config.model}-output`}
                    type="number"
                    min="1"
                    value={config.outputTokensPerCredit}
                    onChange={(e) => handleInputChange(config.model, 'outputTokensPerCredit', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    1 crédito = {config.outputTokensPerCredit.toLocaleString()} tokens de output
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave}>
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
