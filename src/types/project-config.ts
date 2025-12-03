/**
 * Project Config Types
 * 
 * Re-exporta tipos de database.ts para manter compatibilidade com imports existentes.
 * Tipos derivados do schema Supabase para garantir sincronização com o banco.
 */

// Re-export all types from database.ts for backwards compatibility
export type {
  MethodologyJson as Methodology,
  AudienceSegmentJson as AudienceSegment,
  AdvancedAnalysisJson as AdvancedAnalysis,
  MentalTriggersJson as MentalTriggers,
  OfferJson as Offer,
  OfferType,
  ColorPaletteJson as ColorPalette,
  TypedProject as Project,
  ProjectRow,
  ProjectInsert,
  ProjectUpdate,
} from './database';

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

export const VISUAL_STYLES = [
  'Minimalista',
  'Moderno',
  'Luxo/Premium',
  'Vintage/Retrô',
  'Orgânico/Natural',
  'Tecnológico/Futurista',
  'Corporativo/Profissional',
  'Criativo/Artístico',
  'Tradicional/Clássico',
  'Jovem/Despojado'
];

export const IMAGERY_STYLES = [
  'Fotografia Real',
  'Ilustração Digital',
  '3D/Render',
  'Desenho Manual',
  'Arte Conceitual',
  'Minimalista/Flat',
  'Realismo Fotográfico',
  'Cartoon/Animado',
  'Abstrato/Artístico'
];
