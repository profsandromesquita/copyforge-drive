/**
 * Sistema de Construção de System Instructions Contextualizadas
 * 
 * Compila contexto completo para geração de copy:
 * - Base prompt do tipo de copy
 * - Identidade do projeto (brand, personality, purpose)
 * - Perfil de audiência com análise psicográfica
 * - Detalhes da oferta (mecanismo único, benefícios)
 * - Características selecionadas (objetivos, estilos, tamanho)
 */

interface ProjectIdentity {
  brand_name?: string;
  sector?: string;
  central_purpose?: string;
  brand_personality?: string[];
  voice_tones?: string[];
  keywords?: string[];
}

interface AudienceSegment {
  name: string;
  description: string;
  advanced_analysis?: any;
}

interface Offer {
  name: string;
  description: string;
  unique_mechanism?: string;
  main_benefits?: string[];
  differentials?: string[];
  objections?: string[];
}

interface Characteristics {
  objectives?: string[];
  styles?: string[];
  size?: string;
  preferences?: string[];
}

interface SystemInstructionContext {
  copyType: string;
  basePrompt: string;
  projectIdentity?: ProjectIdentity;
  audienceSegment?: AudienceSegment;
  offer?: Offer;
  characteristics?: Characteristics;
}

/**
 * Constrói system instruction personalizada combinando todos os contextos disponíveis
 */
export function buildContextualSystemInstruction(context: SystemInstructionContext): any {
  const sections: string[] = [];
  
  // 1. BASE PROMPT - Fundação do tipo de copy
  sections.push("=== PROMPT BASE ===");
  sections.push(context.basePrompt);
  sections.push("");

  // 2. IDENTIDADE DO PROJETO - Quem está falando
  if (context.projectIdentity && Object.keys(context.projectIdentity).length > 0) {
    sections.push("=== IDENTIDADE DA MARCA ===");
    
    if (context.projectIdentity.brand_name) {
      sections.push(`**Marca**: ${context.projectIdentity.brand_name}`);
    }
    
    if (context.projectIdentity.sector) {
      sections.push(`**Setor**: ${context.projectIdentity.sector}`);
    }
    
    if (context.projectIdentity.central_purpose) {
      sections.push(`**Propósito Central**: ${context.projectIdentity.central_purpose}`);
    }
    
    if (context.projectIdentity.brand_personality && context.projectIdentity.brand_personality.length > 0) {
      sections.push(`**Personalidade**: ${context.projectIdentity.brand_personality.join(', ')}`);
    }
    
    if (context.projectIdentity.voice_tones && context.projectIdentity.voice_tones.length > 0) {
      sections.push(`**Tom de Voz**: ${context.projectIdentity.voice_tones.join(', ')}`);
    }
    
    if (context.projectIdentity.keywords && context.projectIdentity.keywords.length > 0) {
      sections.push(`**Palavras-chave**: ${context.projectIdentity.keywords.join(', ')}`);
    }
    
    sections.push("");
  }

  // 3. PERFIL DE AUDIÊNCIA - Para quem está falando
  if (context.audienceSegment) {
    sections.push("=== PERFIL DE AUDIÊNCIA ===");
    sections.push(`**Segmento**: ${context.audienceSegment.name}`);
    sections.push(`**Descrição**: ${context.audienceSegment.description}`);
    
    // Incluir análise psicográfica avançada se disponível
    if (context.audienceSegment.advanced_analysis) {
      const analysis = context.audienceSegment.advanced_analysis;
      
      sections.push("");
      sections.push("**ANÁLISE PSICOGRÁFICA**:");
      
      if (analysis.identity) {
        sections.push(`- Identidade: ${JSON.stringify(analysis.identity)}`);
      }
      
      if (analysis.pains) {
        sections.push(`- Dores: ${JSON.stringify(analysis.pains)}`);
      }
      
      if (analysis.desires) {
        sections.push(`- Desejos: ${JSON.stringify(analysis.desires)}`);
      }
      
      if (analysis.consciousness_level) {
        sections.push(`- Nível de Consciência: ${analysis.consciousness_level.level} - ${analysis.consciousness_level.approach}`);
      }
      
      if (analysis.language) {
        sections.push(`- Linguagem: Como falam: "${analysis.language.how_they_speak}" | Evitar: "${analysis.language.avoid}"`);
      }
      
      if (analysis.mental_triggers) {
        const triggers = analysis.mental_triggers
          .map((t: any) => `${t.trigger} (força ${t.effectiveness})`)
          .join(', ');
        sections.push(`- Gatilhos Mentais Efetivos: ${triggers}`);
      }
    }
    
    sections.push("");
  }

  // 4. OFERTA - O que está oferecendo
  if (context.offer) {
    sections.push("=== OFERTA ===");
    sections.push(`**Nome**: ${context.offer.name}`);
    sections.push(`**Descrição**: ${context.offer.description}`);
    
    if (context.offer.unique_mechanism) {
      sections.push(`**Mecanismo Único**: ${context.offer.unique_mechanism}`);
    }
    
    if (context.offer.main_benefits && context.offer.main_benefits.length > 0) {
      sections.push(`**Benefícios Principais**: ${context.offer.main_benefits.join(' | ')}`);
    }
    
    if (context.offer.differentials && context.offer.differentials.length > 0) {
      sections.push(`**Diferenciais**: ${context.offer.differentials.join(' | ')}`);
    }
    
    if (context.offer.objections && context.offer.objections.length > 0) {
      sections.push(`**Objeções a Abordar**: ${context.offer.objections.join(' | ')}`);
    }
    
    sections.push("");
  }

  // 5. CARACTERÍSTICAS SELECIONADAS - Como entregar
  if (context.characteristics && Object.keys(context.characteristics).length > 0) {
    sections.push("=== DIRETRIZES DE EXECUÇÃO ===");
    
    if (context.characteristics.objectives && context.characteristics.objectives.length > 0) {
      sections.push(`**Objetivos**: ${context.characteristics.objectives.join(', ')}`);
    }
    
    if (context.characteristics.styles && context.characteristics.styles.length > 0) {
      sections.push(`**Estilos**: ${context.characteristics.styles.join(', ')}`);
    }
    
    if (context.characteristics.size) {
      sections.push(`**Tamanho**: ${context.characteristics.size}`);
    }
    
    if (context.characteristics.preferences && context.characteristics.preferences.length > 0) {
      sections.push(`**Preferências**: ${context.characteristics.preferences.join(', ')}`);
    }
    
    sections.push("");
  }

  // Compilar em objeto estruturado para salvar
  const compiledInstruction = {
    full_text: sections.join("\n"),
    copy_type: context.copyType,
    has_project_identity: !!context.projectIdentity && Object.keys(context.projectIdentity).length > 0,
    has_audience_segment: !!context.audienceSegment,
    has_offer: !!context.offer,
    has_characteristics: !!context.characteristics && Object.keys(context.characteristics).length > 0,
    compiled_at: new Date().toISOString()
  };

  return compiledInstruction;
}

/**
 * Extrai apenas o texto completo do system instruction
 */
export function getSystemInstructionText(systemInstruction: any): string {
  if (!systemInstruction) return "";
  return systemInstruction.full_text || "";
}
