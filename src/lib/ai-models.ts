// AI Model Configuration for Copy Generation

export type AIModel = 'google/gemini-2.5-flash' | 'openai/gpt-5-mini';

export interface ModelConfig {
  displayName: string;
  description: string;
  badge: string;
  badgeColor: 'green' | 'purple';
  recommended: string;
  estimatedCostMultiplier: number; // Relative to Gemini Flash
}

export const MODEL_CONFIG: Record<AIModel, ModelConfig> = {
  'google/gemini-2.5-flash': {
    displayName: 'Gemini 2.5 Flash',
    description: 'Modelo padrão - Rápido e econômico',
    badge: 'Econômico',
    badgeColor: 'green',
    recommended: 'Ideal para anúncios, emails e conteúdo geral',
    estimatedCostMultiplier: 1,
  },
  'openai/gpt-5-mini': {
    displayName: 'GPT-5 Mini',
    description: 'Modelo premium - Maior qualidade de escrita',
    badge: 'Premium',
    badgeColor: 'purple',
    recommended: 'Ideal para VSL, Landing Pages e conteúdo crítico',
    estimatedCostMultiplier: 13,
  },
};

export type CopyType = 'anuncio' | 'landing_page' | 'vsl' | 'email' | 'webinar' | 'conteudo' | 'mensagem' | 'outro';

/**
 * Fetches the auto-routed model from database configuration
 * Falls back to hardcoded routing if database is unavailable
 */
export async function getAutoRoutedModelFromDB(copyType: CopyType): Promise<AIModel> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase
      .from('model_routing_config')
      .select('default_model')
      .eq('copy_type', copyType)
      .single();
    
    if (error || !data) {
      console.warn('Falling back to hardcoded routing:', error);
      return getAutoRoutedModel(copyType);
    }
    
    return data.default_model as AIModel;
  } catch (error) {
    console.error('Error fetching routing config:', error);
    return getAutoRoutedModel(copyType);
  }
}

/**
 * Determines which AI model should be automatically selected based on copy type
 * VSL and Landing Pages get the premium model, others get the economic model
 * This is the fallback function when database is unavailable
 */
export function getAutoRoutedModel(copyType: CopyType): AIModel {
  if (copyType === 'vsl' || copyType === 'landing_page' || copyType === 'webinar') {
    return 'openai/gpt-5-mini';
  }
  return 'google/gemini-2.5-flash';
}

/**
 * Gets the display name for a model
 */
export function getModelDisplayName(model: AIModel): string {
  return MODEL_CONFIG[model]?.displayName || model;
}

/**
 * Estimates the credit cost for a generation based on model and estimated tokens
 */
export function estimateGenerationCost(model: AIModel, estimatedTokens: number = 5000): number {
  // Base calculation: tokens / TPC (10000) * multiplier
  const baseCost = estimatedTokens / 10000;
  return baseCost * MODEL_CONFIG[model].estimatedCostMultiplier;
}
