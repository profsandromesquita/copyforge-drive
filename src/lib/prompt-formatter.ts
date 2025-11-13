export interface SystemInstructionSection {
  title: string;
  content: string | any;
  type: 'text' | 'json' | 'list';
}

export const formatSystemInstruction = (systemInstruction: any): SystemInstructionSection[] => {
  if (!systemInstruction) return [];

  const sections: SystemInstructionSection[] = [];

  // Check if it's a compiled string format (with full_text)
  let fullText = '';
  if (typeof systemInstruction === 'string') {
    fullText = systemInstruction;
  } else if (systemInstruction.full_text && typeof systemInstruction.full_text === 'string') {
    fullText = systemInstruction.full_text;
  }

  // If we have a compiled text format, parse it
  if (fullText) {
    const parsedSections = parseCompiledSystemInstruction(fullText);
    if (parsedSections.length > 0) {
      return parsedSections;
    }
  }

  // Otherwise, use the structured format
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

// Parse compiled system instruction format
const parseCompiledSystemInstruction = (text: string): SystemInstructionSection[] => {
  const sections: SystemInstructionSection[] = [];
  
  // Split by section markers (===)
  const sectionPattern = /===\s*([^=]+?)\s*===\s*\n([\s\S]*?)(?=\n===|$)/g;
  const matches = [...text.matchAll(sectionPattern)];
  
  if (matches.length === 0) {
    // No section markers found, return empty to fallback to raw JSON
    return [];
  }

  matches.forEach(match => {
    const title = match[1].trim();
    let content = match[2].trim();
    
    // Map section titles to friendly names
    const titleMap: Record<string, string> = {
      'PROMPT BASE': 'Prompt Base',
      'IDENTIDADE DA MARCA': 'Identidade da Marca',
      'PERFIL DE AUDIÊNCIA': 'Perfil de Audiência',
      'OFERTA': 'Oferta',
      'CARACTERÍSTICAS': 'Características Selecionadas',
      'DIRETRIZES DE EXECUÇÃO': 'Diretrizes de Execução',
      'CONTEXTO ADICIONAL': 'Contexto Adicional'
    };

    const friendlyTitle = titleMap[title.toUpperCase()] || title;
    
    // Try to detect if content is JSON-like
    const isJsonLike = content.includes('**') && (content.includes('Marca') || content.includes('Setor') || content.includes('Propósito'));
    
    sections.push({
      title: friendlyTitle,
      content: content,
      type: isJsonLike ? 'text' : 'text'
    });
  });

  // Extract metadata if present (usually at the end)
  const metadataMatch = text.match(/\{[\s\S]*"has_offer"[\s\S]*\}/);
  if (metadataMatch) {
    try {
      const metadata = JSON.parse(metadataMatch[0]);
      sections.push({
        title: 'Metadados',
        content: metadata,
        type: 'json'
      });
    } catch (e) {
      // If JSON parsing fails, ignore metadata
    }
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
    'Identidade da Marca': '🎯',
    'Segmento de Audiência': '👥',
    'Perfil de Audiência': '👥',
    'Oferta': '🎁',
    'Características Selecionadas': '⚙️',
    'Diretrizes de Execução': '📋',
    'Contexto Adicional': '📌',
    'Metadados': '🔧'
  };
  return iconMap[title] || '📄';
};
