// Preços por 1 milhão de tokens (em USD)
// Fonte: Lovable AI Pricing - https://ai.gateway.lovable.dev/pricing

interface ModelPricing {
  inputPricePerMillion: number;
  outputPricePerMillion: number;
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  // Google Gemini models
  'google/gemini-2.5-flash': {
    inputPricePerMillion: 0.075,
    outputPricePerMillion: 0.30,
  },
  'google/gemini-2.5-flash-lite': {
    inputPricePerMillion: 0.0375,
    outputPricePerMillion: 0.15,
  },
  'google/gemini-2.5-pro': {
    inputPricePerMillion: 1.25,
    outputPricePerMillion: 5.00,
  },
  'google/gemini-2.5-flash-image-preview': {
    inputPricePerMillion: 0.075,
    outputPricePerMillion: 0.30,
  },
  // OpenAI models
  'openai/gpt-5': {
    inputPricePerMillion: 5.00,
    outputPricePerMillion: 15.00,
  },
  'openai/gpt-5-mini': {
    inputPricePerMillion: 1.00,
    outputPricePerMillion: 4.00,
  },
  'openai/gpt-5-nano': {
    inputPricePerMillion: 0.40,
    outputPricePerMillion: 1.60,
  },
};

// Estimated tokens for different models (used for credit checks)
export const MODEL_ESTIMATED_TOKENS: Record<string, number> = {
  'google/gemini-2.5-flash': 5000,
  'openai/gpt-5-mini': 7000, // Premium models tend to generate more detailed output
};

export function calculateGenerationCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model];
  
  if (!pricing) {
    console.warn(`Pricing not found for model: ${model}`);
    return 0;
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPricePerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPricePerMillion;
  
  return inputCost + outputCost;
}

export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}

export function getModelDisplayName(model: string): string {
  const displayNames: Record<string, string> = {
    'google/gemini-2.5-flash': 'Gemini 2.5 Flash',
    'google/gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
    'google/gemini-2.5-pro': 'Gemini 2.5 Pro',
    'google/gemini-2.5-flash-image-preview': 'Gemini 2.5 Flash Image',
    'openai/gpt-5': 'GPT-5',
    'openai/gpt-5-mini': 'GPT-5 Mini',
    'openai/gpt-5-nano': 'GPT-5 Nano',
  };
  
  return displayNames[model] || model;
}
