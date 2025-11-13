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
    
    // Incluir análise psicográfica avançada se disponível (estrutura otimizada - 15 dimensões)
    if (context.audienceSegment.advanced_analysis) {
      const analysis = context.audienceSegment.advanced_analysis;
      
      sections.push("");
      sections.push("**ANÁLISE PSICOGRÁFICA AVANÇADA**:");
      
      // Base Psicológica
      if (analysis.psychographic_profile) {
        sections.push(`\n**Base Psicológica**`);
        sections.push(`**Perfil Psicográfico**: ${analysis.psychographic_profile}`);
      }
      if (analysis.consciousness_level) {
        sections.push(`**Nível de Consciência**: ${analysis.consciousness_level}`);
      }
      
      // Dimensão Emocional
      const hasEmotionalData = analysis.emotional_state || analysis.hidden_pain || analysis.primary_fear || analysis.emotional_desire;
      if (hasEmotionalData) {
        sections.push(`\n**Dimensão Emocional**`);
        if (analysis.emotional_state) sections.push(`**Estado Emocional**: ${analysis.emotional_state}`);
        if (analysis.hidden_pain) sections.push(`**Dor Oculta**: ${analysis.hidden_pain}`);
        if (analysis.primary_fear) sections.push(`**Medo Primário**: ${analysis.primary_fear}`);
        if (analysis.emotional_desire) sections.push(`**Desejo Emocional**: ${analysis.emotional_desire}`);
      }
      
      // Dimensão Cognitiva
      const hasCognitiveData = analysis.problem_misperception || analysis.internal_mechanism || analysis.limiting_belief || analysis.internal_narrative || analysis.internal_contradiction;
      if (hasCognitiveData) {
        sections.push(`\n**Dimensão Cognitiva**`);
        if (analysis.problem_misperception) sections.push(`**Percepção Errada**: ${analysis.problem_misperception}`);
        if (analysis.internal_mechanism) sections.push(`**Mecanismo Interno**: ${analysis.internal_mechanism}`);
        if (analysis.limiting_belief) sections.push(`**Crença Limitante**: ${analysis.limiting_belief}`);
        if (analysis.internal_narrative) sections.push(`**Narrativa Interna**: ${analysis.internal_narrative}`);
        if (analysis.internal_contradiction) sections.push(`**Contradição Interna**: ${analysis.internal_contradiction}`);
      }
      
      // Dimensão Comportamental
      const hasBehavioralData = analysis.dominant_behavior || analysis.decision_trigger || analysis.communication_style || analysis.psychological_resistances;
      if (hasBehavioralData) {
        sections.push(`\n**Dimensão Comportamental**`);
        if (analysis.dominant_behavior) sections.push(`**Comportamento Dominante**: ${analysis.dominant_behavior}`);
        if (analysis.decision_trigger) sections.push(`**Gatilho de Decisão**: ${analysis.decision_trigger}`);
        if (analysis.communication_style) sections.push(`**Estilo de Comunicação**: ${analysis.communication_style}`);
        if (analysis.psychological_resistances) sections.push(`**Resistências Psicológicas**: ${analysis.psychological_resistances}`);
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
