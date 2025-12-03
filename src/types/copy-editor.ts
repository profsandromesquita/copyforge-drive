/**
 * Copy Editor Types
 * 
 * Re-exporta tipos de database.ts para manter compatibilidade com imports existentes.
 * Tipos derivados do schema Supabase para garantir sincronização com o banco.
 */

// Re-export all types from database.ts for backwards compatibility
export type {
  BlockType,
  FAQItem,
  TestimonialItem,
  Comment,
  FormField,
  BlockConfig,
  Block,
  Session,
  TypedCopy as Copy,
  CopyRow,
  CopyInsert,
  CopyUpdate,
} from './database';

// CopyType é string no banco, mas mantemos o union type para validação no frontend
export type CopyType = 'landing_page' | 'anuncio' | 'vsl' | 'email' | 'webinar' | 'conteudo' | 'mensagem' | 'outro';
