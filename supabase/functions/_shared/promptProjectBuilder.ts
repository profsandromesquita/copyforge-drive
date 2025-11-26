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
  id?: string;
  name?: string;
  tese_central?: string;
  mecanismo_primario?: string;
  por_que_funciona?: string;
  erro_invisivel?: string;
  diferenciacao?: string;
  principios_fundamentos?: string;
  etapas_metodo?: string;
  transformacao_real?: string;
  prova_funcionamento?: string;
}

/**
 * Constrói o prompt completo do projeto combinando Identidade e Metodologia.
 * Este é o "prompt_Projeto" que será enviado ao generate-system-prompt.
 * 
 * O prompt resultante contém:
 * - Identidade da Marca: Nome, setor, propósito, tom de voz, personalidade, palavras-chave
 * - Metodologia: Mecanismo único, tese central, diferenciação, etapas, transformação
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
      identityParts.push(`**Nome da marca:** ${identity.brand_name}`);
    }

    if (identity.central_purpose) {
      identityParts.push(`**Propósito central:** ${identity.central_purpose}`);
    }

    if (identity.sector) {
      identityParts.push(`**Setor:** ${identity.sector}`);
    }

    if (identity.brand_personality && identity.brand_personality.length > 0) {
      identityParts.push(`**Personalidade da marca:** ${identity.brand_personality.join(', ')}`);
    }

    if (identity.voice_tones && identity.voice_tones.length > 0) {
      identityParts.push(`**Tons de voz:** ${identity.voice_tones.join(', ')}`);
    }

    if (identity.keywords && identity.keywords.length > 0) {
      identityParts.push(`**Palavras-chave:** ${identity.keywords.join(', ')}`);
    }

    if (identityParts.length > 0) {
      parts.push(`## IDENTIDADE DO PROJETO\n${identityParts.join('\n')}`);
    }
  }

  // Prompt de Metodologia
  if (methodology) {
    const methodologyParts: string[] = [];
    
    if (methodology.name) {
      methodologyParts.push(`**Nome do Método:** ${methodology.name}`);
    }
    
    if (methodology.tese_central) {
      methodologyParts.push(`**Tese Central:** ${methodology.tese_central}`);
    }
    
    if (methodology.mecanismo_primario) {
      methodologyParts.push(`**Mecanismo Único (O Segredo):** ${methodology.mecanismo_primario}`);
    }
    
    if (methodology.por_que_funciona) {
      methodologyParts.push(`**Por Que Funciona:** ${methodology.por_que_funciona}`);
    }
    
    if (methodology.erro_invisivel) {
      methodologyParts.push(`**Erro Invisível (que o público comete):** ${methodology.erro_invisivel}`);
    }
    
    if (methodology.diferenciacao) {
      methodologyParts.push(`**Diferenciação:** ${methodology.diferenciacao}`);
    }
    
    if (methodology.principios_fundamentos) {
      methodologyParts.push(`**Princípios Fundamentais:** ${methodology.principios_fundamentos}`);
    }
    
    if (methodology.etapas_metodo) {
      methodologyParts.push(`**Etapas do Método:** ${methodology.etapas_metodo}`);
    }
    
    if (methodology.transformacao_real) {
      methodologyParts.push(`**Transformação Prometida:** ${methodology.transformacao_real}`);
    }
    
    if (methodology.prova_funcionamento) {
      methodologyParts.push(`**Prova de Funcionamento:** ${methodology.prova_funcionamento}`);
    }

    if (methodologyParts.length > 0) {
      parts.push(`## METODOLOGIA E MECANISMO ÚNICO\n${methodologyParts.join('\n\n')}`);
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
    id: methodology.id,
    name: methodology.name,
    tese_central: methodology.tese_central,
    mecanismo_primario: methodology.mecanismo_primario,
    por_que_funciona: methodology.por_que_funciona,
    erro_invisivel: methodology.erro_invisivel,
    diferenciacao: methodology.diferenciacao,
    principios_fundamentos: methodology.principios_fundamentos,
    etapas_metodo: methodology.etapas_metodo,
    transformacao_real: methodology.transformacao_real,
    prova_funcionamento: methodology.prova_funcionamento
  };
}
