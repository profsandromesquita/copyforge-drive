import { CopyType } from '@/lib/ai-models';

/**
 * Mapeamento de tipos de copy para chaves de prompt no banco de dados
 * Centralizado para consistência entre frontend e backend
 */
export const COPY_TYPE_TO_PROMPT_KEY: Record<CopyType, string> = {
  anuncio: 'generate_copy_ad',
  landing_page: 'generate_copy_landing_page',
  vsl: 'generate_copy_vsl',
  email: 'generate_copy_email',
  webinar: 'generate_copy_webinar',
  conteudo: 'generate_copy_content',
  mensagem: 'generate_copy_message',
  outro: 'generate_copy_base'
};

/**
 * Obtém a chave de prompt correspondente ao tipo de copy
 */
export function getPromptKey(copyType: CopyType): string {
  return COPY_TYPE_TO_PROMPT_KEY[copyType];
}

/**
 * Labels amigáveis para cada tipo de copy
 */
export const COPY_TYPE_LABELS: Record<CopyType, string> = {
  anuncio: 'Anúncios',
  landing_page: 'Landing Pages',
  vsl: 'VSL',
  email: 'E-mails',
  webinar: 'Webinars',
  conteudo: 'Conteúdo',
  mensagem: 'Mensagens',
  outro: 'Outros'
};
