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
  
  // FASE 2 - Análise gerada por IA
  advanced_analysis?: string; // Análise detalhada gerada pela IA
  analysis_generated_at?: string;
}

export interface Offer {
  id: string;
  name: string;
  type: 'product' | 'service' | 'course' | 'consulting' | 'subscription' | 'other';
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
  { value: 'product', label: 'Produto' },
  { value: 'service', label: 'Serviço' },
  { value: 'course', label: 'Curso' },
  { value: 'consulting', label: 'Consultoria' },
  { value: 'subscription', label: 'Assinatura' },
  { value: 'other', label: 'Outro' }
];
