import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Info, Sparkles, Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AIModel, MODEL_CONFIG, getAutoRoutedModel, estimateGenerationCost, CopyType } from "@/lib/ai-models";

interface ModelSelectorProps {
  copyType: CopyType;
  selectedModel: AIModel | null;
  onModelChange: (model: AIModel | null) => void;
  disabled?: boolean;
}

export const ModelSelector = ({ copyType, selectedModel, onModelChange, disabled = false }: ModelSelectorProps) => {
  const [isManual, setIsManual] = useState(selectedModel !== null);
  
  const autoRoutedModel = getAutoRoutedModel(copyType);
  const activeModel = selectedModel || autoRoutedModel;

  const handleModeChange = (manual: boolean) => {
    setIsManual(manual);
    if (!manual) {
      // Switched to auto mode
      onModelChange(null);
    } else {
      // Switched to manual mode - select current auto-routed model
      onModelChange(autoRoutedModel);
    }
  };

  const handleModelChange = (model: AIModel) => {
    onModelChange(model);
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <Label className="text-base font-semibold">Modelo de IA</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>Escolha entre seleção automática (recomendado) ou manual do modelo de IA.</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  VSL e Landing Pages usam automaticamente o modelo premium para melhor qualidade.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center gap-2">
          <Label htmlFor="manual-mode" className="text-sm text-muted-foreground">
            Seleção Manual
          </Label>
          <Switch
            id="manual-mode"
            checked={isManual}
            onCheckedChange={handleModeChange}
            disabled={disabled}
          />
        </div>
      </div>

      {!isManual ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Badge variant={MODEL_CONFIG[autoRoutedModel].badgeColor === 'green' ? 'secondary' : 'default'}>
              {MODEL_CONFIG[autoRoutedModel].badge}
            </Badge>
            <div className="flex-1">
              <p className="text-sm font-medium">{MODEL_CONFIG[autoRoutedModel].displayName}</p>
              <p className="text-xs text-muted-foreground">
                Selecionado automaticamente para {copyType === 'vsl' ? 'VSL' : copyType === 'landing_page' ? 'Landing Page' : 'este tipo de copy'}
              </p>
            </div>
            {autoRoutedModel === 'openai/gpt-5-mini' ? (
              <Sparkles className="h-5 w-5 text-purple-500" />
            ) : (
              <Zap className="h-5 w-5 text-green-500" />
            )}
          </div>
          
          {/* Mensagem explicativa do modelo escolhido */}
          <div className="text-xs text-muted-foreground p-2 bg-background rounded border">
            {autoRoutedModel === 'openai/gpt-5-mini' ? (
              <p>🧠 Usando modelo mais inteligente para otimizar a qualidade da entrega, logo o consumo de créditos será maior</p>
            ) : (
              <p>⚡ Usando o modelo mais econômico e rápido para otimizar seu tempo e consumo dos créditos</p>
            )}
          </div>
        </div>
      ) : (
        <RadioGroup
          value={activeModel}
          onValueChange={handleModelChange}
          disabled={disabled}
          className="space-y-3"
        >
          {/* Gemini 2.5 Flash */}
          <div className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
            activeModel === 'google/gemini-2.5-flash' 
              ? 'border-green-500 bg-green-500/5' 
              : 'border-border hover:border-green-500/50'
          }`}>
            <RadioGroupItem value="google/gemini-2.5-flash" id="gemini-flash" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="gemini-flash" className="text-base font-medium cursor-pointer">
                  Gemini 2.5 Flash
                </Label>
                <Badge variant="secondary" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  Econômico
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {MODEL_CONFIG['google/gemini-2.5-flash'].description}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {MODEL_CONFIG['google/gemini-2.5-flash'].recommended}
              </p>
              <p className="text-xs text-muted-foreground mt-2 italic">
                Usando o modelo mais econômico e rápido para otimizar seu tempo e consumo dos créditos
              </p>
            </div>
          </div>

          {/* GPT-5 Mini */}
          <div className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
            activeModel === 'openai/gpt-5-mini'
              ? 'border-purple-500 bg-purple-500/5'
              : 'border-border hover:border-purple-500/50'
          }`}>
            <RadioGroupItem value="openai/gpt-5-mini" id="gpt-mini" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="gpt-mini" className="text-base font-medium cursor-pointer">
                  GPT-5 Mini
                </Label>
                <Badge className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {MODEL_CONFIG['openai/gpt-5-mini'].description}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {MODEL_CONFIG['openai/gpt-5-mini'].recommended}
              </p>
              <p className="text-xs text-muted-foreground mt-2 italic">
                Usando modelo mais inteligente para otimizar a qualidade da entrega, logo o consumo de créditos será maior
              </p>
            </div>
          </div>
        </RadioGroup>
      )}
    </Card>
  );
};
