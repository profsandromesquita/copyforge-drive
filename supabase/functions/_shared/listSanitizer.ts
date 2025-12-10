/**
 * List Content Sanitizer - Auto-Cura para Listas
 * 
 * Converte automaticamente strings em arrays quando o LLM retorna
 * conteúdo de lista em formato incorreto (string com \n em vez de array).
 */

/**
 * Remove prefixos de Markdown comuns de um item de lista
 */
export function cleanMarkdownPrefixes(text: string): string {
  return text
    .replace(/^[\*\-\•\→\▸\▹\►\◆\◇\○\●]\s*/, '')  // Remove bullets: * - • → ▸ etc
    .replace(/^\d+[\.\)\-]\s*/, '')                 // Remove números: 1. 2) 3-
    .replace(/^\[[\sx✓✔]\]\s*/i, '')               // Remove checkboxes: [x] [ ] [✓]
    .replace(/^>\s*/, '')                           // Remove quotes: >
    .trim();
}

/**
 * Sanitiza o conteúdo de uma lista, convertendo string para array se necessário
 * e limpando prefixos de Markdown de cada item.
 * 
 * @param content - Conteúdo da lista (pode ser string ou array)
 * @param minItemLength - Tamanho mínimo para considerar um item válido (default: 5)
 * @returns Array de strings limpas
 */
export function sanitizeListContent(
  content: string | string[] | unknown,
  minItemLength: number = 5
): string[] {
  // Se for null/undefined, retorna array vazio
  if (content === null || content === undefined) {
    console.log('🔧 LIST SANITIZER: Conteúdo nulo recebido');
    return [];
  }

  // Se já é array, apenas limpar cada item
  if (Array.isArray(content)) {
    const cleaned = content
      .map(item => typeof item === 'string' ? cleanMarkdownPrefixes(item) : String(item))
      .filter(item => item.trim().length >= minItemLength);
    
    console.log(`🔧 LIST SANITIZER: Array recebido com ${content.length} itens → ${cleaned.length} válidos`);
    return cleaned;
  }

  // Se é string, converter para array
  if (typeof content === 'string') {
    const originalLength = content.length;
    
    // Tentar diferentes separadores
    let lines: string[];
    
    if (content.includes('\n')) {
      // Separador mais comum: quebra de linha
      lines = content.split('\n');
    } else if (content.includes(';')) {
      // Alternativo: ponto e vírgula
      lines = content.split(';');
    } else if (content.includes(' - ') && content.split(' - ').length >= 3) {
      // Alternativo: hífen com espaços (comum em listas inline)
      lines = content.split(' - ');
    } else {
      // Se não tem separadores claros, retorna como item único
      const cleaned = cleanMarkdownPrefixes(content);
      if (cleaned.length >= minItemLength) {
        console.log(`🔧 LIST SANITIZER: String sem separadores → 1 item`);
        return [cleaned];
      }
      return [];
    }

    const cleaned = lines
      .map(line => cleanMarkdownPrefixes(line.trim()))
      .filter(item => item.length >= minItemLength);

    console.log(`🔧 LIST SANITIZER: String (${originalLength} chars) convertida → ${cleaned.length} itens`);
    return cleaned;
  }

  // Tipo inesperado
  console.warn(`🔧 LIST SANITIZER: Tipo inesperado recebido: ${typeof content}`);
  return [];
}

/**
 * Verifica se o conteúdo precisa de sanitização (é string em vez de array)
 */
export function needsSanitization(content: unknown): boolean {
  return typeof content === 'string' && !Array.isArray(content);
}
