/**
 * Construtor de Prompt do Projeto
 * Gera prompt_Projeto = prompt_Identidade + prompt_Metodologia
 */

interface ProjectIdentity {
  brand_name?: string;
  central_purpose?: string;
  sector?: string;
  brand_personality?: string[];
  voice_tones?: string[];
  keywords?: string[];
}

interface ProjectMethodology {
  framework?: string;
  approach?: string;
  key_principles?: string[];
  additional_context?: string;
}

/**
 * Constrói o prompt completo do projeto combinando Identidade e Metodologia.
 * Este é o "prompt_Projeto" que será enviado ao generate-system-prompt.
 * 
 * O prompt resultante contém:
 * - Identidade da Marca: Nome, setor, propósito, tom de voz, personalidade, palavras-chave
 * - Metodologia: Abordagem de mercado, diferenciais, princípios de comunicação
 * 
 * @param identity - Dados de identidade da marca (opcional)
 * @param methodology - Dados de metodologia do projeto (opcional)
 * @returns Prompt completo (~800-1200 palavras quando completo, vazio se nenhum parâmetro fornecido)
 */
export function buildProjectPrompt(
  identity?: ProjectIdentity,
  methodology?: ProjectMethodology
): string {
  const parts: string[] = [];

  // Prompt de Identidade
  if (identity) {
    const identityParts: string[] = [];

    if (identity.brand_name) {
      identityParts.push(`Nome da marca: ${identity.brand_name}`);
    }

    if (identity.central_purpose) {
      identityParts.push(`Propósito central: ${identity.central_purpose}`);
    }

    if (identity.sector) {
      identityParts.push(`Setor: ${identity.sector}`);
    }

    if (identity.brand_personality && identity.brand_personality.length > 0) {
      identityParts.push(`Personalidade da marca: ${identity.brand_personality.join(', ')}`);
    }

    if (identity.voice_tones && identity.voice_tones.length > 0) {
      identityParts.push(`Tons de voz: ${identity.voice_tones.join(', ')}`);
    }

    if (identity.keywords && identity.keywords.length > 0) {
      identityParts.push(`Palavras-chave: ${identity.keywords.join(', ')}`);
    }

    if (identityParts.length > 0) {
      parts.push(`## Identidade do Projeto\n${identityParts.join('\n')}`);
    }
  }

  // Prompt de Metodologia
  if (methodology) {
    const methodologyParts: string[] = [];

    if (methodology.framework) {
      methodologyParts.push(`Framework: ${methodology.framework}`);
    }

    if (methodology.approach) {
      methodologyParts.push(`Abordagem: ${methodology.approach}`);
    }

    if (methodology.key_principles && methodology.key_principles.length > 0) {
      methodologyParts.push(`Princípios-chave:\n${methodology.key_principles.map(p => `- ${p}`).join('\n')}`);
    }

    if (methodology.additional_context) {
      methodologyParts.push(`Contexto adicional: ${methodology.additional_context}`);
    }

    if (methodologyParts.length > 0) {
      parts.push(`## Metodologia do Projeto\n${methodologyParts.join('\n')}`);
    }
  }

  return parts.join('\n\n');
}

/**
 * Extrai os dados de Identidade do projeto a partir do objeto do banco.
 * 
 * @param project - Objeto do projeto retornado do Supabase
 * @returns Objeto ProjectIdentity ou undefined se projeto não fornecido
 */
export function extractProjectIdentity(project: any): ProjectIdentity | undefined {
  if (!project) return undefined;

  const hasIdentityData = project.brand_name || project.central_purpose || 
                          project.sector || project.brand_personality || 
                          project.voice_tones || project.keywords;

  if (!hasIdentityData) return undefined;

  return {
    brand_name: project.brand_name,
    central_purpose: project.central_purpose,
    sector: project.sector,
    brand_personality: project.brand_personality,
    voice_tones: project.voice_tones,
    keywords: project.keywords
  };
}

/**
 * Extrai os dados de Metodologia do projeto a partir do objeto do banco.
 * 
 * @param project - Objeto do projeto retornado do Supabase
 * @returns Objeto ProjectMethodology ou undefined se não houver metodologia
 */
export function extractProjectMethodology(project: any): ProjectMethodology | undefined {
  if (!project?.methodology) return undefined;

  const methodology = project.methodology;
  
  return {
    framework: methodology.framework,
    approach: methodology.approach,
    key_principles: methodology.key_principles,
    additional_context: methodology.additional_context
  };
}
