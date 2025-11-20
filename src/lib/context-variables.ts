// Sistema de Variáveis Contextuais para Copy IA Chat
// Permite referenciar campos específicos usando #NomeDoCampo

export interface VariableDefinition {
  field: string;
  label: string;
  group: 'projectIdentity' | 'audienceSegment' | 'offer' | 'methodology';
}

export interface VariableGroup {
  [key: string]: VariableDefinition;
}

// Mapa completo de variáveis disponíveis por grupo
export const CONTEXT_VARIABLES: Record<string, VariableGroup> = {
  // GRUPO: IDENTIDADE DO PROJETO
  projeto: {
    nome_marca: { field: 'brand_name', label: 'Nome da Marca', group: 'projectIdentity' },
    setor: { field: 'sector', label: 'Setor', group: 'projectIdentity' },
    proposito: { field: 'central_purpose', label: 'Propósito Central', group: 'projectIdentity' },
    personalidade: { field: 'brand_personality', label: 'Personalidade da Marca', group: 'projectIdentity' },
    tom_voz: { field: 'voice_tones', label: 'Tom de Voz', group: 'projectIdentity' },
    palavras_chave: { field: 'keywords', label: 'Palavras-chave', group: 'projectIdentity' },
  },
  
  // GRUPO: PÚBLICO-ALVO (Manual)
  publico: {
    quem_e: { field: 'who_is', label: 'Quem É', group: 'audienceSegment' },
    maior_desejo: { field: 'biggest_desire', label: 'Maior Desejo', group: 'audienceSegment' },
    maior_dor: { field: 'biggest_pain', label: 'Maior Dor', group: 'audienceSegment' },
    tentativas_falhadas: { field: 'failed_attempts', label: 'Tentativas Falhadas', group: 'audienceSegment' },
    crencas: { field: 'beliefs', label: 'Crenças', group: 'audienceSegment' },
    comportamento: { field: 'behavior', label: 'Comportamento', group: 'audienceSegment' },
    jornada: { field: 'journey', label: 'Jornada', group: 'audienceSegment' },
  },
  
  // GRUPO: PÚBLICO-ALVO (Análise Avançada)
  publico_avancado: {
    perfil_psicografico: { field: 'advanced_analysis.psychographic_profile', label: 'Perfil Psicográfico', group: 'audienceSegment' },
    nivel_consciencia: { field: 'advanced_analysis.consciousness_level', label: 'Nível de Consciência', group: 'audienceSegment' },
    estado_emocional: { field: 'advanced_analysis.emotional_state', label: 'Estado Emocional', group: 'audienceSegment' },
    dor_oculta: { field: 'advanced_analysis.hidden_pain', label: 'Dor Oculta', group: 'audienceSegment' },
    medo_primario: { field: 'advanced_analysis.primary_fear', label: 'Medo Primário', group: 'audienceSegment' },
    desejo_emocional: { field: 'advanced_analysis.emotional_desire', label: 'Desejo Emocional', group: 'audienceSegment' },
    percepcao_problema: { field: 'advanced_analysis.problem_misperception', label: 'Percepção Errônea do Problema', group: 'audienceSegment' },
    mecanismo_interno: { field: 'advanced_analysis.internal_mechanism', label: 'Mecanismo Interno', group: 'audienceSegment' },
    crenca_limitante: { field: 'advanced_analysis.limiting_belief', label: 'Crença Limitante', group: 'audienceSegment' },
    narrativa_interna: { field: 'advanced_analysis.internal_narrative', label: 'Narrativa Interna', group: 'audienceSegment' },
    contradicao_interna: { field: 'advanced_analysis.internal_contradiction', label: 'Contradição Interna', group: 'audienceSegment' },
    comportamento_dominante: { field: 'advanced_analysis.dominant_behavior', label: 'Comportamento Dominante', group: 'audienceSegment' },
    gatilho_decisao: { field: 'advanced_analysis.decision_trigger', label: 'Gatilho de Decisão', group: 'audienceSegment' },
    estilo_comunicacao: { field: 'advanced_analysis.communication_style', label: 'Estilo de Comunicação', group: 'audienceSegment' },
    resistencias_psicologicas: { field: 'advanced_analysis.psychological_resistances', label: 'Resistências Psicológicas', group: 'audienceSegment' },
  },
  
  // GRUPO: GATILHOS MENTAIS
  gatilhos: {
    escassez: { field: 'advanced_analysis.mental_triggers.escassez', label: 'Escassez', group: 'audienceSegment' },
    autoridade: { field: 'advanced_analysis.mental_triggers.autoridade', label: 'Autoridade', group: 'audienceSegment' },
    prova_social: { field: 'advanced_analysis.mental_triggers.prova_social', label: 'Prova Social', group: 'audienceSegment' },
    reciprocidade: { field: 'advanced_analysis.mental_triggers.reciprocidade', label: 'Reciprocidade', group: 'audienceSegment' },
    consistencia: { field: 'advanced_analysis.mental_triggers.consistencia', label: 'Consistência', group: 'audienceSegment' },
    afinidade: { field: 'advanced_analysis.mental_triggers.afinidade', label: 'Afinidade', group: 'audienceSegment' },
    antecipacao: { field: 'advanced_analysis.mental_triggers.antecipacao', label: 'Antecipação', group: 'audienceSegment' },
    exclusividade: { field: 'advanced_analysis.mental_triggers.exclusividade', label: 'Exclusividade', group: 'audienceSegment' },
  },
  
  // GRUPO: OFERTA
  oferta: {
    nome: { field: 'name', label: 'Nome da Oferta', group: 'offer' },
    tipo: { field: 'type', label: 'Tipo', group: 'offer' },
    descricao: { field: 'short_description', label: 'Descrição', group: 'offer' },
    beneficio_principal: { field: 'main_benefit', label: 'Benefício Principal', group: 'offer' },
    mecanismo_unico: { field: 'unique_mechanism', label: 'Mecanismo Único', group: 'offer' },
    diferenciais: { field: 'differentials', label: 'Diferenciais', group: 'offer' },
    prova_autoridade: { field: 'proof', label: 'Prova/Autoridade', group: 'offer' },
    garantia: { field: 'guarantee', label: 'Garantia', group: 'offer' },
    cta: { field: 'cta', label: 'Call to Action', group: 'offer' },
  },
  
  // GRUPO: METODOLOGIA
  metodologia: {
    nome_metodologia: { field: 'name', label: 'Nome da Metodologia', group: 'methodology' },
    tese_central: { field: 'tese_central', label: 'Tese Central', group: 'methodology' },
    mecanismo_primario: { field: 'mecanismo_primario', label: 'Mecanismo Primário', group: 'methodology' },
    por_que_funciona: { field: 'por_que_funciona', label: 'Por Que Funciona', group: 'methodology' },
    erro_invisivel: { field: 'erro_invisivel', label: 'Erro Invisível', group: 'methodology' },
    diferenciacao: { field: 'diferenciacao', label: 'Diferenciação', group: 'methodology' },
    principios: { field: 'principios_fundamentos', label: 'Princípios e Fundamentos', group: 'methodology' },
    etapas: { field: 'etapas_metodo', label: 'Etapas do Método', group: 'methodology' },
    transformacao: { field: 'transformacao_real', label: 'Transformação Real', group: 'methodology' },
    prova: { field: 'prova_funcionamento', label: 'Prova de Funcionamento', group: 'methodology' },
  },
};

// Função para buscar valor de campo aninhado
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

// Função para extrair variáveis de um texto
export function extractVariables(text: string): string[] {
  const regex = /#([a-zA-Z_]+)/g;
  const matches = text.matchAll(regex);
  return Array.from(matches, m => m[1]);
}

// Função para validar se uma variável existe
export function isValidVariable(varName: string): boolean {
  for (const group of Object.values(CONTEXT_VARIABLES)) {
    if (varName in group) return true;
  }
  return false;
}

// Função para obter informações de uma variável
export function getVariableInfo(varName: string): (VariableDefinition & { groupKey: string; varName: string }) | null {
  for (const [groupKey, group] of Object.entries(CONTEXT_VARIABLES)) {
    if (varName in group) {
      return { ...group[varName], groupKey, varName };
    }
  }
  return null;
}

// Lista flat de todas as variáveis para autocomplete
export function getAllVariables(): Array<{ value: string; label: string; group: string; groupKey: string }> {
  const variables: Array<{ value: string; label: string; group: string; groupKey: string }> = [];
  
  for (const [groupKey, group] of Object.entries(CONTEXT_VARIABLES)) {
    for (const [varName, config] of Object.entries(group)) {
      variables.push({
        value: `#${varName}`,
        label: config.label,
        group: config.group,
        groupKey,
      });
    }
  }
  
  return variables;
}

// Função para validar variáveis em um texto
export function validateVariables(text: string): { valid: boolean; invalid: string[] } {
  const vars = extractVariables(text);
  const invalid = vars.filter(v => !isValidVariable(v));
  return { valid: invalid.length === 0, invalid };
}

// Exemplos de uso para documentação
export const VARIABLE_EXAMPLES = [
  {
    category: "Anúncios com foco psicológico",
    examples: [
      'Crie 3 anúncios focando na #dor_oculta e no #medo_primario do público',
      'Gere headlines usando o #desejo_emocional e a #narrativa_interna'
    ]
  },
  {
    category: "Otimização baseada em oferta",
    examples: [
      'Otimize esse bloco destacando o #mecanismo_unico da oferta',
      'Reescreva com foco em #prova_autoridade e #garantia'
    ]
  },
  {
    category: "Uso de gatilhos mentais",
    examples: [
      'Crie uma seção usando os gatilhos #escassez e #autoridade',
      'Aplique #prova_social na introdução'
    ]
  },
  {
    category: "Contextualização de metodologia",
    examples: [
      'Explique o #mecanismo_primario da metodologia de forma simples',
      'Crie uma copy baseada na #tese_central e no #por_que_funciona'
    ]
  }
];
