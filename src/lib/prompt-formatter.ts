export interface SystemInstructionSection {
  title: string;
  content: string | any;
  type: 'text' | 'json' | 'list';
}

export const formatSystemInstruction = (systemInstruction: any): SystemInstructionSection[] => {
  if (!systemInstruction) return [];

  const sections: SystemInstructionSection[] = [];

  // Base Prompt
  if (systemInstruction.base_prompt) {
    sections.push({
      title: 'Prompt Base',
      content: systemInstruction.base_prompt,
      type: 'text'
    });
  }

  // Project Identity
  if (systemInstruction.project_identity) {
    sections.push({
      title: 'Identidade do Projeto',
      content: systemInstruction.project_identity,
      type: 'json'
    });
  }

  // Audience Segment
  if (systemInstruction.audience_segment) {
    sections.push({
      title: 'Segmento de Audiência',
      content: systemInstruction.audience_segment,
      type: 'json'
    });
  }

  // Offer
  if (systemInstruction.offer) {
    sections.push({
      title: 'Oferta',
      content: systemInstruction.offer,
      type: 'json'
    });
  }

  // Characteristics
  if (systemInstruction.characteristics) {
    sections.push({
      title: 'Características Selecionadas',
      content: systemInstruction.characteristics,
      type: 'json'
    });
  }

  return sections;
};

export const extractPromptSections = (prompt: string): string[] => {
  return prompt.split('\n\n').filter(section => section.trim().length > 0);
};

export const highlightKeywords = (text: string): string => {
  const keywords = [
    'objetivo', 'público', 'tom', 'estilo', 'formato',
    'marca', 'produto', 'oferta', 'benefício', 'diferencial'
  ];
  
  let highlighted = text;
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    highlighted = highlighted.replace(regex, `**${keyword}**`);
  });
  
  return highlighted;
};

export const formatCharacteristics = (characteristics: any): Record<string, any[]> => {
  if (!characteristics) return {};
  
  const formatted: Record<string, any[]> = {
    objectives: [],
    styles: [],
    size: [],
    preferences: []
  };

  Object.keys(characteristics).forEach(key => {
    const value = characteristics[key];
    if (Array.isArray(value)) {
      formatted[key] = value;
    } else if (value) {
      // Single value, convert to array
      if (key.includes('objective')) {
        formatted.objectives.push(value);
      } else if (key.includes('style')) {
        formatted.styles.push(value);
      } else if (key.includes('size') || key.includes('length')) {
        formatted.size.push(value);
      } else {
        formatted.preferences.push({ [key]: value });
      }
    }
  });

  return formatted;
};

export const formatJsonForDisplay = (json: any): string => {
  if (!json) return '';
  return JSON.stringify(json, null, 2);
};

export const getSectionIcon = (title: string): string => {
  const iconMap: Record<string, string> = {
    'Prompt Base': '📝',
    'Identidade do Projeto': '🎯',
    'Segmento de Audiência': '👥',
    'Oferta': '🎁',
    'Características Selecionadas': '⚙️'
  };
  return iconMap[title] || '📄';
};
