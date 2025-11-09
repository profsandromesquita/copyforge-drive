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
  
  // FASE 2 - Análise gerada por IA (estruturada) - FOCO EM PÚBLICO
  advanced_analysis?: {
    consciousness_level: string; // Nível de consciência do problema/solução
    psychographic_profile: string; // Valores, estilo de vida, personalidade
    pains_frustrations: string; // Dores e frustrações específicas
    desires_aspirations: string; // Desejos, aspirações e objetivos verdadeiros
    behaviors_habits: string; // Comportamentos observáveis, hábitos, rotinas
    language_communication: string; // Como se comunica naturalmente
    influences_references: string; // Influenciadores, referências, fontes de informação
    internal_barriers: string; // Barreiras psicológicas e bloqueios internos
    anti_persona: string; // Quem definitivamente NÃO é esse público
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
