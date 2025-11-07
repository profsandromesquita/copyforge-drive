import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap } from 'lucide-react';
import { CopyType, getAutoRoutedModel, MODEL_CONFIG } from '@/lib/ai-models';

interface ModelSelectorProps {
  copyType: CopyType;
}

export const ModelSelector = ({ copyType }: ModelSelectorProps) => {
  const autoRoutedModel = getAutoRoutedModel(copyType);

  const getCopyTypeName = () => {
    if (copyType === 'vsl') return 'VSL';
    if (copyType === 'landing_page') return 'Landing Page';
    return 'este tipo';
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <Label className="text-base font-semibold">Modelo de IA</Label>
      </div>
      
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
        {autoRoutedModel === 'openai/gpt-5-mini' ? (
          <Sparkles className="h-5 w-5 text-purple-500" />
        ) : (
          <Zap className="h-5 w-5 text-green-500" />
        )}
      </div>
      
      <div className="text-xs text-muted-foreground p-2 bg-background rounded border mt-2">
        {autoRoutedModel === 'openai/gpt-5-mini' ? (
          <p>🧠 Usando modelo mais inteligente para otimizar a qualidade da entrega, logo o consumo de créditos será maior</p>
        ) : (
          <p>⚡ Usando o modelo mais econômico e rápido para otimizar seu tempo e consumo dos créditos</p>
        )}
      </div>
    </Card>
  );
};
