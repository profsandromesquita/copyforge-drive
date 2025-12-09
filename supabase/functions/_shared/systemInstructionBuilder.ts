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
  framework?: string;
  objective?: string;
  styles?: string[];
  emotionalFocus?: string;
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
    
    if (context.characteristics.framework) {
      sections.push(`**Estrutura**: ${context.characteristics.framework}`);
    }
    
    if (context.characteristics.objective) {
      sections.push(`**Objetivo**: ${context.characteristics.objective}`);
    }
    
    if (context.characteristics.styles && context.characteristics.styles.length > 0) {
      sections.push(`**Estilos**: ${context.characteristics.styles.join(', ')}`);
    }
    
    if (context.characteristics.emotionalFocus) {
      sections.push(`**Foco Emocional**: ${context.characteristics.emotionalFocus}`);
    }
    
    sections.push("");
  }

  // 6. REGRAS DE CONTINUIDADE ESTRUTURAL - Garantir listas completas
  sections.push("=== REGRAS DE CONTINUIDADE ESTRUTURAL ===");
  sections.push("");
  sections.push("**REGRA CRÍTICA - PROIBIÇÃO DE HANDOFFS VAZIOS:**");
  sections.push("Se um bloco de texto termina com ':' ou promete uma enumeração (ex: 'Os resultados incluem:', 'Benefícios:', 'Você vai descobrir:'), o PRÓXIMO bloco DEVE OBRIGATORIAMENTE ser type='list' contendo 3-7 itens REAIS e ESPECÍFICOS baseados no contexto do projeto.");
  sections.push("");
  sections.push("**EXEMPLOS CORRETOS:**");
  sections.push("✅ Bloco text: 'Resultados que nossos clientes alcançam:' → PRÓXIMO bloco DEVE SER type='list' com: ['Aumento de 47% nas conversões em 30 dias', 'Redução de 60% no custo por lead', 'ROI de 5x no primeiro mês']");
  sections.push("✅ Bloco text: 'O método inclui:' → PRÓXIMO bloco DEVE SER type='list' com itens específicos da metodologia");
  sections.push("");
  sections.push("**EXEMPLOS PROIBIDOS (NUNCA FAZER):**");
  sections.push("❌ Bloco text: 'Benefícios que você terá:' → E depois NÃO gerar lista");
  sections.push("❌ Bloco list com: ['Item da lista...', 'Benefício aqui...', 'Resultado...'] → PLACEHOLDERS SÃO PROIBIDOS");
  sections.push("❌ Bloco list com menos de 3 itens quando prometeu vários");
  sections.push("");
  sections.push("**VALIDAÇÃO OBRIGATÓRIA:**");
  sections.push("1. Todo item de lista DEVE ter pelo menos 10 caracteres");
  sections.push("2. Todo item de lista DEVE ser específico ao contexto (use dados da marca, audiência e oferta)");
  sections.push("3. NUNCA use placeholders genéricos como '...', 'Item aqui', 'Benefício X'");
  sections.push("4. Se prometeu uma lista, GERE a lista no próximo bloco - não pule para outro tipo de bloco");
  sections.push("");

  // 7. REGRAS ESPECÍFICAS PARA ANÚNCIOS VISUAIS
  if (context.copyType === 'anuncio' || context.copyType === 'ad') {
    sections.push("=== REGRAS PARA ANÚNCIOS VISUAIS ===");
    sections.push("");
    sections.push("**REGRA DE OURO - ABSORÇÃO EM 3 SEGUNDOS:**");
    sections.push("Se o usuário pedir copy para ARTE, IMAGEM, CRIATIVO ou ANÚNCIO DE IMAGEM, o texto deve ser absorvido INSTANTANEAMENTE.");
    sections.push("");
    sections.push("**ESTRUTURA OBRIGATÓRIA PARA ARTE/CRIATIVO:**");
    sections.push("1. HEADLINE: Máximo 8 palavras (benefício direto ou provocação)");
    sections.push("2. SUBHEADLINE: Máximo 12 palavras (complemento ou especificação)");
    sections.push("3. CTA: Máximo 4 palavras (verbo imperativo + benefício)");
    sections.push("TOTAL MÁXIMO: 30 palavras para toda a arte");
    sections.push("");
    sections.push("**FOCO NO BENEFÍCIO (não na característica):**");
    sections.push("❌ ERRADO: 'Nosso método inovador de 7 passos foi desenvolvido por especialistas...'");
    sections.push("✅ CERTO: 'Emagreça 5kg em 30 dias'");
    sections.push("");
    sections.push("**CTA IMPERATIVO E CLARO:**");
    sections.push("❌ ERRADO: 'Gostaríamos de convidar você para conhecer...'");
    sections.push("✅ CERTO: 'Baixe Grátis Agora' | 'Garanta Sua Vaga' | 'Compre Hoje'");
    sections.push("");
    sections.push("**GATILHOS MENTAIS PARA ADS:**");
    sections.push("- Urgência: 'Só hoje', 'Últimas vagas', 'Oferta expira em 24h'");
    sections.push("- Escassez: 'Apenas 10 disponíveis', 'Edição limitada'");
    sections.push("- Prova Social: 'Mais de 10.000 clientes', 'Nota 4.9'");
    sections.push("- Gratuidade: 'Grátis', 'Sem custo', 'Liberado'");
    sections.push("");
    sections.push("**LÓGICA DE VARIAÇÃO (TESTE A/B):**");
    sections.push("Se o usuário pedir variações, mude o ÂNGULO, não apenas palavras:");
    sections.push("- Variação A: Foco na DOR ('Cansado de perder dinheiro?')");
    sections.push("- Variação B: Foco no PRAZER ('Comece a lucrar hoje!')");
    sections.push("- Variação C: Foco na PROVA ('10.000 empresários já usam')");
    sections.push("- Variação D: Foco na URGÊNCIA ('Só até meia-noite')");
    sections.push("");
    sections.push("**RESTRIÇÕES NEGATIVAS (PROIBIÇÕES):**");
    sections.push("❌ NÃO escreva parágrafos longos para artes de imagem");
    sections.push("❌ NÃO use jargões técnicos complexos");
    sections.push("❌ NÃO liste todas as features do produto");
    sections.push("❌ NÃO use linguagem passiva ou indireta");
    sections.push("❌ NÃO comece com 'Descubra como...' ou frases clichês");
    sections.push("❌ NÃO ultrapasse 30 palavras para artes visuais");
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
