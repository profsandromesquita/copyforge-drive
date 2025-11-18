import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { AIModel, getModelDisplayName } from '@/lib/ai-models';

/**
 * Hook to show notifications when AI model switches between generations
 * Provides feedback about cost/quality implications
 */
export function useModelSwitchNotification() {
  const lastUsedModelRef = useRef<AIModel | null>(null);

  const notifyModelSwitch = (newModel: AIModel, wasAutoRouted: boolean = false) => {
    const previousModel = lastUsedModelRef.current;
    
    // Only show notification if model actually changed
    if (previousModel && previousModel !== newModel) {
      const modelName = getModelDisplayName(newModel);
      
      if (newModel === 'openai/gpt-5') {
        toast.info(
          'Usando modelo mais inteligente para otimizar a qualidade da entrega, logo o consumo de créditos será maior',
          { 
            icon: '🧠',
            duration: 5000,
            description: wasAutoRouted ? `${modelName} (selecionado automaticamente)` : modelName
          }
        );
      } else {
        toast.success(
          'Usando o modelo mais econômico e rápido para otimizar seu tempo e consumo dos créditos',
          { 
            icon: '⚡',
            duration: 5000,
            description: wasAutoRouted ? `${modelName} (selecionado automaticamente)` : modelName
          }
        );
      }
    }
    
    lastUsedModelRef.current = newModel;
  };

  return { notifyModelSwitch };
}
