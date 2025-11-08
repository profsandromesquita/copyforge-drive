export interface AudienceSegment {
  id: string;
  name: string; // nome do público
  avatar: string; // persona principal
  segment: string; // segmento/nicho
  current_situation: string; // dor principal
  desired_result: string; // desejo/resultado
  awareness_level: 'unaware' | 'problem-aware' | 'solution-aware' | 'product-aware' | 'most-aware';
  objections: string[];
  communication_tone: string;
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
  voice_tones?: string[];
  brand_personality?: string[];
  keywords?: string[];
  
  // Configurações completas
  audience_segments?: AudienceSegment[];
  offers?: Offer[];
}

export const SECTORS = [
  'Tecnologia',
  'Saúde e Bem-estar',
  'Desenvolvimento Pessoal',
  'Educação',
  'E-commerce',
  'Serviços Financeiros',
  'Marketing e Publicidade',
  'Alimentação e Gastronomia',
  'Moda e Beleza',
  'Imobiliário',
  'Consultoria',
  'Entretenimento',
  'Esportes e Fitness',
  'Turismo e Viagens',
  'Advocacia e Jurídico',
  'Construção Civil',
  'Agronegócio',
  'Automotivo',
  'Eventos',
  'Logística e Transporte',
  'Pet e Veterinária',
  'Arte e Design',
  'Varejo',
  'Seguros',
  'ONGs e Terceiro Setor',
  'Outro'
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
