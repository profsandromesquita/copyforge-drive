import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sparkles, Zap, Info, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AIModel, CopyType, getAutoRoutedModel, MODEL_CONFIG } from '@/lib/ai-models';
interface ModelSelectorProps {
  copyType: CopyType;
  selectedModel: AIModel | null;
  onModelChange: (model: AIModel | null) => void;
  disabled?: boolean;
}
export const ModelSelector = ({
  copyType,
  selectedModel,
  onModelChange,
  disabled
}: ModelSelectorProps) => {
  const autoRoutedModel = getAutoRoutedModel(copyType);
  const [isManualMode, setIsManualMode] = useState(selectedModel !== null);

  // Modelo efetivo: se manual, usa o selecionado; se auto, usa o roteado
  const effectiveModel = selectedModel || autoRoutedModel;

  // Sincronizar isManualMode com selectedModel vindo das props
  useEffect(() => {
    setIsManualMode(selectedModel !== null);
  }, [selectedModel]);
  const handleModeChange = (manual: boolean) => {
    setIsManualMode(manual);
    if (manual) {
      // Ativou manual: selecionar o modelo que seria o auto
      onModelChange(autoRoutedModel);
    } else {
      // Voltou para auto: limpar seleção
      onModelChange(null);
    }
  };
  const handleModelChange = (model: string) => {
    onModelChange(model as AIModel);
  };
  const getCopyTypeName = () => {
    if (copyType === 'vsl') return 'VSL';
    if (copyType === 'landing_page') return 'Landing Page';
    return 'este tipo';
  };

  // Verificar se o modelo selecionado manualmente é diferente do recomendado
  const isDifferentFromRecommended = isManualMode && selectedModel && selectedModel !== autoRoutedModel;
  return <Card className="p-4">
      {/* Header com Switch */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <Label className="text-base font-semibold">Modelo de IA</Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Label htmlFor="manual-mode" className="text-sm text-muted-foreground cursor-pointer">
            {isManualMode ? 'Manual' : 'Automático'}
          </Label>
          <Switch id="manual-mode" checked={isManualMode} onCheckedChange={handleModeChange} disabled={disabled} />
        </div>
      </div>
      
      {/* Modo Automático */}
      {!isManualMode && <>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border-2 border-primary/20">
            <Badge variant={MODEL_CONFIG[autoRoutedModel].badgeColor === 'green' ? 'secondary' : 'default'}>
              {MODEL_CONFIG[autoRoutedModel].badge}
            </Badge>
            <div className="flex-1">
              <p className="text-sm font-medium">{MODEL_CONFIG[autoRoutedModel].displayName}</p>
              <p className="text-xs text-muted-foreground">
                Selecionado automaticamente para {getCopyTypeName()}
              </p>
            </div>
            {autoRoutedModel === 'openai/gpt-5-mini' ? <Sparkles className="h-5 w-5 text-purple-500" /> : <Zap className="h-5 w-5 text-green-500" />}
          </div>
          
          <div className="text-xs text-muted-foreground p-2 bg-background rounded border mt-2">
            {autoRoutedModel === 'openai/gpt-5-mini' ? <p>🧠 Usando modelo mais inteligente para otimizar a qualidade da entrega, logo o consumo de créditos será maior</p> : <p>⚡ Usando o modelo mais econômico e rápido para otimizar seu tempo e consumo dos créditos</p>}
          </div>
        </>}
      
      {/* Modo Manual */}
      {isManualMode && <>
          <div className="space-y-2 mb-3">
            <Label className="text-sm text-muted-foreground">Escolha o modelo:</Label>
            
            <RadioGroup value={effectiveModel} onValueChange={handleModelChange}>
              {/* Opção Gemini */}
              <label htmlFor="gemini" className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${effectiveModel === 'google/gemini-2.5-flash' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}>
                <RadioGroupItem value="google/gemini-2.5-flash" id="gemini" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Gemini 2.5 Flash</span>
                    <Badge variant="secondary" className="text-xs">Econômico</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Rápido • Consumo padrão de créditos</p>
                </div>
              </label>
              
              {/* Opção GPT-5 Mini */}
              <label htmlFor="gpt5mini" className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${effectiveModel === 'openai/gpt-5-mini' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}>
                <RadioGroupItem value="openai/gpt-5-mini" id="gpt5mini" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">GPT-5 Mini</span>
                    <Badge variant="default" className="text-xs">Premium</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Inteligente • consome + créditos</p>
                </div>
              </label>
            </RadioGroup>
          </div>
          
          {/* Feedback visual de que o modelo foi aplicado */}
          {isManualMode && selectedModel && <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-900 text-xs mb-2">
              <Check className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0" />
              <span className="text-green-800 dark:text-green-300 font-medium">
                ✓ Modelo {MODEL_CONFIG[selectedModel].displayName} será usado na próxima geração
              </span>
            </div>}
          
          {/* Alerta se escolheu diferente do recomendado */}
          {isDifferentFromRecommended && <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200 dark:border-yellow-900 text-xs mb-2">
              <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-300">
                  {selectedModel === 'google/gemini-2.5-flash' ? <>Economizando créditos, mas qualidade pode ser inferior para {getCopyTypeName()}</> : <>Usando modelo premium quando o econômico seria suficiente - consumo maior de créditos</>}
                </p>
              </div>
            </div>}
          
          <div className="text-xs text-muted-foreground p-2 bg-background rounded border mt-2">
            <p>ℹ️ Modo manual: você controla qual modelo usar e o custo de créditos</p>
          </div>
        </>}
    </Card>;
};