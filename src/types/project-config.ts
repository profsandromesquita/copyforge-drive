export interface Methodology {
  framework: string; // Ex: "Identidade > Audiência > Oferta > Copy"
  step1_name: string;
  step1_description: string;
  step2_name: string;
  step2_description: string;
  step3_name: string;
  step3_description: string;
  step4_name: string;
  step4_description: string;
}

export interface AudienceSegment {
  id: string;
  // FASE 1 - Preenchimento manual
  who_is: string; // Quem é essa pessoa?
  biggest_desire: string; // O que essa pessoa mais quer?
  biggest_pain: string; // O que mais dói pra ela hoje?
  failed_attempts: string; // O que ela já tentou e não deu certo?
  beliefs: string; // O que ela acredita (ou repete)?
  behavior: string; // Como ela fala / se comporta?
  journey: string; // Onde ela está e onde quer chegar?
  is_completed?: boolean; // Se o usuário concluiu o preenchimento
  
  // FASE 2 - Análise gerada por IA (estruturada) - 15 dimensões psicológicas
  advanced_analysis?: {
    // Core psicológico
    psychographic_profile: string; // Valores centrais, estilo de vida, personalidade
    consciousness_level: string; // Nível de consciência do problema/solução (Eugene Schwartz)
    
    // Dimensão Emocional
    emotional_state: string; // Estado emocional atual, emoções dominantes, gatilhos
    hidden_pain: string; // Dor real não verbalizada, sofrimento subjacente
    primary_fear: string; // Medo fundamental que dirige comportamentos
    emotional_desire: string; // Estado emocional desejado, como quer se sentir
    
    // Dimensão Cognitiva
    problem_misperception: string; // O que acha que é o problema (mas está errado)
    internal_mechanism: string; // Como o problema funciona internamente (ciclo vicioso)
    limiting_belief: string; // Crença central que sabota progresso
    internal_narrative: string; // História que conta para si mesmo
    internal_contradiction: string; // Conflitos internos entre desejos e ações
    
    // Dimensão Comportamental
    dominant_behavior: string; // Padrão de ação mais frequente
    decision_trigger: string; // O que faz finalmente tomar ação
    communication_style: string; // Vocabulário, tom, expressões naturais
    psychological_resistances: string; // Barreiras emocionais, auto-sabotagem
  };
  analysis_generated_at?: string;
}

export interface Offer {
  id: string;
  name: string;
  type: 'subscription' | 'course' | 'ebook' | 'event' | 'physical' | 'other' | 'software' | 'consulting' | 'mentoring' | 'ai';
  short_description: string;
  main_benefit: string; // promessa central
  unique_mechanism: string; // motivo pelo qual funciona
  differentials: string[]; // 3 bullets
  proof: string; // autoridade
  guarantee: string; // risco reverso (opcional)
  cta: string; // objetivo
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // ABA 1: IDENTIDADE
  brand_name?: string;
  sector?: string;
  central_purpose?: string;
  brand_personality?: string[];
  keywords?: string[];
  
  // ABA 4: METODOLOGIA
  methodology?: Methodology;
  
  // Configurações completas
  audience_segments?: AudienceSegment[];
  offers?: Offer[];
}

export const SECTORS = [
  'Animais (Pets)',
  'Aplicativos para celular',
  'Arquitetura',
  'Cinema',
  'Concentração',
  'Culinária e Gastronomia',
  'Desenvolvimento pessoal',
  'Educacional',
  'Emagrecimento',
  'Engenharia',
  'Entretenimento',
  'Finanças',
  'Geral',
  'Hobbie',
  'Idiomas',
  'Imagens / ícones / fotos',
  'Infantil',
  'Internet',
  'Investimentos',
  'Jogos',
  'Jurídico',
  'Marketing de Rede',
  'Marketing Digital',
  'Método de Estudo',
  'Moda / Beleza / Estética',
  'Música',
  'Plantas / Flores / Jardinagem',
  'Relacionamento',
  'Religioso',
  'Saúde',
  'Sexualidade',
  'Software',
  'Tecnologia',
  'Templates',
  'Turismo',
];

export const VOICE_TONES = [
  'Profissional',
  'Amigável',
  'Inspirador',
  'Urgente',
  'Educativo',
  'Humorístico',
  'Empático',
  'Autoritário',
  'Casual',
  'Formal'
];

export const BRAND_PERSONALITIES = [
  'Inovador',
  'Confiável',
  'Ousado',
  'Sofisticado',
  'Acessível',
  'Aventureiro',
  'Responsável',
  'Criativo',
  'Tradicional',
  'Moderno'
];

export const AWARENESS_LEVELS = [
  { value: 'unaware', label: 'Inconsciente' },
  { value: 'problem-aware', label: 'Consciente do problema' },
  { value: 'solution-aware', label: 'Consciente da solução' },
  { value: 'product-aware', label: 'Consciente do produto' },
  { value: 'most-aware', label: 'Mais consciente' }
];

export const OFFER_TYPES = [
  { value: 'subscription', label: 'Assinatura' },
  { value: 'course', label: 'Curso' },
  { value: 'ebook', label: 'E-book' },
  { value: 'event', label: 'Evento' },
  { value: 'physical', label: 'Físico' },
  { value: 'other', label: 'Outro' },
  { value: 'software', label: 'Software' },
  { value: 'consulting', label: 'Consultoria' },
  { value: 'mentoring', label: 'Mentoria' },
  { value: 'ai', label: 'Inteligência Artificial' }
];
