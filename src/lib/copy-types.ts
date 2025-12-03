/**
 * Centralized copy type labels and utilities
 * Single source of truth for copy type display names
 */

export const COPY_TYPE_LABELS: Record<string, string> = {
  'landing_page': 'Landing Page',
  'anuncio': 'Anúncio',
  'vsl': 'Video de Vendas',
  'email': 'E-mail',
  'webinar': 'Webinar',
  'conteudo': 'Conteúdo',
  'mensagem': 'Mensagem',
  'outro': 'Outro',
};

/**
 * Get the display label for a copy type
 * @param copyType - The copy type key
 * @returns The display label or the original value if not found
 */
export function getCopyTypeLabel(copyType: string | null | undefined): string {
  if (!copyType) return '';
  return COPY_TYPE_LABELS[copyType] || copyType;
}

/**
 * Get all copy types as an array of { value, label } objects
 * Useful for select dropdowns and filters
 */
export function getCopyTypeOptions() {
  return Object.entries(COPY_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
}
