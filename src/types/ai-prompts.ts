/**
 * AI Prompts Types
 * 
 * Re-exporta tipos de database.ts para manter compatibilidade com imports existentes.
 * Tipos derivados do schema Supabase para garantir sincronização com o banco.
 */

import type { AIPromptTemplateRow, Tables } from './database';

// Re-export the database type with a cleaner name
export type AIPromptTemplate = AIPromptTemplateRow;

// Re-export history type from database
export type AIPromptHistory = Tables<'ai_prompt_history'>;

// Utility type for updates
export interface UpdatePromptParams {
  id: string;
  current_prompt: string;
  change_reason?: string;
}

// Category type derived from actual usage
export type PromptCategory = 'generate_copy' | 'optimize_copy' | 'analyze_audience' | 'system_instruction' | 'image_generation';
