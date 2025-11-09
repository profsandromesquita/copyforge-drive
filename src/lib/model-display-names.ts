export const getModelDisplayName = (modelId: string): string => {
  const names: Record<string, string> = {
    'google/gemini-2.5-flash': 'Gemini 2.5 Flash',
    'google/gemini-2.5-pro': 'Gemini 2.5 Pro',
    'google/gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
    'google/gemini-2.5-flash-image': 'Gemini 2.5 Flash Image',
    'openai/gpt-5': 'GPT-5',
    'openai/gpt-5-mini': 'GPT-5 Mini',
    'openai/gpt-5-nano': 'GPT-5 Nano',
  };
  return names[modelId] || modelId;
};

export const getModelIcon = (modelId: string): string => {
  if (modelId.startsWith('google/')) return '🔷';
  if (modelId.startsWith('openai/')) return '⚡';
  return '🤖';
};
