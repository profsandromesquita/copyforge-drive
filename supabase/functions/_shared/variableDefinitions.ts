// ============================================================================
// FONTE CANÔNICA DE DEFINIÇÕES DE VARIÁVEIS CONTEXTUAIS
// ============================================================================
// ⚠️ IMPORTANTE: Este é o arquivo ÚNICO que define todas as variáveis do sistema.
// Qualquer mudança nas variáveis deve ser feita AQUI.
// ============================================================================

export interface VariableDefinition {
  key: string;           // nome_marca
  path: string;          // projectIdentity.brand_name
  label: string;         // Nome da Marca
  group: 'projectIdentity' | 'audienceSegment' | 'offer' | 'methodology';
  groupKey: string;      // projeto
  description?: string;  // Descrição opcional para ajuda
}

// Definição completa de TODAS as variáveis do sistema
export const VARIABLE_DEFINITIONS: VariableDefinition[] = [
  // ==================== GRUPO: IDENTIDADE DO PROJETO ====================
  { key: 'nome_marca', path: 'projectIdentity.brand_name', label: 'Nome da Marca', group: 'projectIdentity', groupKey: 'projeto' },
  { key: 'setor', path: 'projectIdentity.sector', label: 'Setor', group: 'projectIdentity', groupKey: 'projeto' },
  { key: 'proposito', path: 'projectIdentity.central_purpose', label: 'Propósito Central', group: 'projectIdentity', groupKey: 'projeto' },
  { key: 'personalidade', path: 'projectIdentity.brand_personality', label: 'Personalidade da Marca', group: 'projectIdentity', groupKey: 'projeto' },
  { key: 'tom_voz', path: 'projectIdentity.voice_tones', label: 'Tom de Voz', group: 'projectIdentity', groupKey: 'projeto' },
  { key: 'palavras_chave', path: 'projectIdentity.keywords', label: 'Palavras-chave', group: 'projectIdentity', groupKey: 'projeto' },
  
  // ==================== GRUPO: PÚBLICO-ALVO (Manual) ====================
  { key: 'quem_e', path: 'audienceSegment.who_is', label: 'Quem É', group: 'audienceSegment', groupKey: 'publico' },
  { key: 'maior_desejo', path: 'audienceSegment.biggest_desire', label: 'Maior Desejo', group: 'audienceSegment', groupKey: 'publico' },
  { key: 'maior_dor', path: 'audienceSegment.biggest_pain', label: 'Maior Dor', group: 'audienceSegment', groupKey: 'publico' },
  { key: 'tentativas_falhadas', path: 'audienceSegment.failed_attempts', label: 'Tentativas Falhadas', group: 'audienceSegment', groupKey: 'publico' },
  { key: 'crencas', path: 'audienceSegment.beliefs', label: 'Crenças', group: 'audienceSegment', groupKey: 'publico' },
  { key: 'comportamento', path: 'audienceSegment.behavior', label: 'Comportamento', group: 'audienceSegment', groupKey: 'publico' },
  { key: 'jornada', path: 'audienceSegment.journey', label: 'Jornada', group: 'audienceSegment', groupKey: 'publico' },
  
  // ==================== GRUPO: PÚBLICO-ALVO (Análise Avançada) ====================
  { key: 'perfil_psicografico', path: 'audienceSegment.advanced_analysis.psychographic_profile', label: 'Perfil Psicográfico', group: 'audienceSegment', groupKey: 'publico_avancado' },
  { key: 'nivel_consciencia', path: 'audienceSegment.advanced_analysis.consciousness_level', label: 'Nível de Consciência', group: 'audienceSegment', groupKey: 'publico_avancado' },
  { key: 'estado_emocional', path: 'audienceSegment.advanced_analysis.emotional_state', label: 'Estado Emocional', group: 'audienceSegment', groupKey: 'publico_avancado' },
  { key: 'dor_oculta', path: 'audienceSegment.advanced_analysis.hidden_pain', label: 'Dor Oculta', group: 'audienceSegment', groupKey: 'publico_avancado' },
  { key: 'medo_primario', path: 'audienceSegment.advanced_analysis.primary_fear', label: 'Medo Primário', group: 'audienceSegment', groupKey: 'publico_avancado' },
  { key: 'desejo_emocional', path: 'audienceSegment.advanced_analysis.emotional_desire', label: 'Desejo Emocional', group: 'audienceSegment', groupKey: 'publico_avancado' },
  { key: 'percepcao_problema', path: 'audienceSegment.advanced_analysis.problem_misperception', label: 'Percepção Errônea do Problema', group: 'audienceSegment', groupKey: 'publico_avancado' },
  { key: 'mecanismo_interno', path: 'audienceSegment.advanced_analysis.internal_mechanism', label: 'Mecanismo Interno', group: 'audienceSegment', groupKey: 'publico_avancado' },
  { key: 'crenca_limitante', path: 'audienceSegment.advanced_analysis.limiting_belief', label: 'Crença Limitante', group: 'audienceSegment', groupKey: 'publico_avancado' },
  { key: 'narrativa_interna', path: 'audienceSegment.advanced_analysis.internal_narrative', label: 'Narrativa Interna', group: 'audienceSegment', groupKey: 'publico_avancado' },
  { key: 'contradicao_interna', path: 'audienceSegment.advanced_analysis.internal_contradiction', label: 'Contradição Interna', group: 'audienceSegment', groupKey: 'publico_avancado' },
  { key: 'comportamento_dominante', path: 'audienceSegment.advanced_analysis.dominant_behavior', label: 'Comportamento Dominante', group: 'audienceSegment', groupKey: 'publico_avancado' },
  { key: 'gatilho_decisao', path: 'audienceSegment.advanced_analysis.decision_trigger', label: 'Gatilho de Decisão', group: 'audienceSegment', groupKey: 'publico_avancado' },
  { key: 'estilo_comunicacao', path: 'audienceSegment.advanced_analysis.communication_style', label: 'Estilo de Comunicação', group: 'audienceSegment', groupKey: 'publico_avancado' },
  { key: 'resistencias_psicologicas', path: 'audienceSegment.advanced_analysis.psychological_resistances', label: 'Resistências Psicológicas', group: 'audienceSegment', groupKey: 'publico_avancado' },
  
  // ==================== GRUPO: GATILHOS MENTAIS ====================
  { key: 'escassez', path: 'audienceSegment.advanced_analysis.mental_triggers.escassez', label: 'Escassez', group: 'audienceSegment', groupKey: 'gatilhos' },
  { key: 'autoridade', path: 'audienceSegment.advanced_analysis.mental_triggers.autoridade', label: 'Autoridade', group: 'audienceSegment', groupKey: 'gatilhos' },
  { key: 'prova_social', path: 'audienceSegment.advanced_analysis.mental_triggers.prova_social', label: 'Prova Social', group: 'audienceSegment', groupKey: 'gatilhos' },
  { key: 'reciprocidade', path: 'audienceSegment.advanced_analysis.mental_triggers.reciprocidade', label: 'Reciprocidade', group: 'audienceSegment', groupKey: 'gatilhos' },
  { key: 'consistencia', path: 'audienceSegment.advanced_analysis.mental_triggers.consistencia', label: 'Consistência', group: 'audienceSegment', groupKey: 'gatilhos' },
  { key: 'afinidade', path: 'audienceSegment.advanced_analysis.mental_triggers.afinidade', label: 'Afinidade', group: 'audienceSegment', groupKey: 'gatilhos' },
  { key: 'antecipacao', path: 'audienceSegment.advanced_analysis.mental_triggers.antecipacao', label: 'Antecipação', group: 'audienceSegment', groupKey: 'gatilhos' },
  { key: 'exclusividade', path: 'audienceSegment.advanced_analysis.mental_triggers.exclusividade', label: 'Exclusividade', group: 'audienceSegment', groupKey: 'gatilhos' },
  
  // ==================== GRUPO: OFERTA ====================
  { key: 'nome', path: 'offer.name', label: 'Nome da Oferta', group: 'offer', groupKey: 'oferta' },
  { key: 'tipo', path: 'offer.type', label: 'Tipo', group: 'offer', groupKey: 'oferta' },
  { key: 'descricao', path: 'offer.short_description', label: 'Descrição', group: 'offer', groupKey: 'oferta' },
  { key: 'beneficio_principal', path: 'offer.main_benefit', label: 'Benefício Principal', group: 'offer', groupKey: 'oferta' },
  { key: 'mecanismo_unico', path: 'offer.unique_mechanism', label: 'Mecanismo Único', group: 'offer', groupKey: 'oferta' },
  { key: 'diferenciais', path: 'offer.differentials', label: 'Diferenciais', group: 'offer', groupKey: 'oferta' },
  { key: 'prova_autoridade', path: 'offer.proof', label: 'Prova/Autoridade', group: 'offer', groupKey: 'oferta' },
  { key: 'garantia', path: 'offer.guarantee', label: 'Garantia', group: 'offer', groupKey: 'oferta' },
  { key: 'cta', path: 'offer.cta', label: 'Call to Action', group: 'offer', groupKey: 'oferta' },
  
  // ==================== GRUPO: METODOLOGIA ====================
  { key: 'nome_metodologia', path: 'methodology.name', label: 'Nome da Metodologia', group: 'methodology', groupKey: 'metodologia' },
  { key: 'tese_central', path: 'methodology.tese_central', label: 'Tese Central', group: 'methodology', groupKey: 'metodologia' },
  { key: 'mecanismo_primario', path: 'methodology.mecanismo_primario', label: 'Mecanismo Primário', group: 'methodology', groupKey: 'metodologia' },
  { key: 'por_que_funciona', path: 'methodology.por_que_funciona', label: 'Por Que Funciona', group: 'methodology', groupKey: 'metodologia' },
  { key: 'erro_invisivel', path: 'methodology.erro_invisivel', label: 'Erro Invisível', group: 'methodology', groupKey: 'metodologia' },
  { key: 'diferenciacao', path: 'methodology.diferenciacao', label: 'Diferenciação', group: 'methodology', groupKey: 'metodologia' },
  { key: 'principios', path: 'methodology.principios_fundamentos', label: 'Princípios e Fundamentos', group: 'methodology', groupKey: 'metodologia' },
  { key: 'etapas', path: 'methodology.etapas_metodo', label: 'Etapas do Método', group: 'methodology', groupKey: 'metodologia' },
  { key: 'transformacao', path: 'methodology.transformacao_real', label: 'Transformação Real', group: 'methodology', groupKey: 'metodologia' },
  { key: 'prova', path: 'methodology.prova_funcionamento', label: 'Prova de Funcionamento', group: 'methodology', groupKey: 'metodologia' },
];

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Retorna um mapa otimizado das variáveis por key (usado no backend para resolução)
 */
export function getVariableMap(): Record<string, { path: string; label: string }> {
  return Object.fromEntries(
    VARIABLE_DEFINITIONS.map(v => [v.key, { path: v.path, label: v.label }])
  );
}

/**
 * Busca o valor de um campo aninhado em um objeto
 * @example getNestedValue(context, 'projectIdentity.brand_name') → 'Mindz Tech'
 */
export function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return current;
}

/**
 * Valida se uma variável existe na definição
 */
export function isValidVariable(key: string): boolean {
  return VARIABLE_DEFINITIONS.some(v => v.key === key);
}

/**
 * Retorna informações completas de uma variável por key
 */
export function getVariableInfo(key: string): VariableDefinition | null {
  return VARIABLE_DEFINITIONS.find(v => v.key === key) || null;
}
