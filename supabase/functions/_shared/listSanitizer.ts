/**
 * List Content Sanitizer - Auto-Cura para Listas
 * 
 * Converte automaticamente strings em arrays quando o LLM retorna
 * conteúdo de lista em formato incorreto (string com \n em vez de array).
 * Suporta limpeza de HTML, entidades HTML e Markdown.
 */

/**
 * Remove TODAS as tags HTML de uma string
 */
export function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Decodifica entidades HTML comuns
 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
}

/**
 * Extrai conteúdo de cada <li> tag como itens separados
 */
export function extractListItemsFromHtml(html: string): string[] {
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  const items: string[] = [];
  let match;
  
  while ((match = liRegex.exec(html)) !== null) {
    items.push(match[1]);
  }
  
  return items;
}

/**
 * Detecta se a string contém estrutura HTML de lista
 */
export function containsHtmlList(text: string): boolean {
  return /<(ul|ol|li)[^>]*>/i.test(text);
}

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
 * Pipeline completo de limpeza de um item de lista
 * Ordem: HTML tags → Entidades HTML → Markdown → Trim
 */
export function cleanListItem(item: string): string {
  let cleaned = item;
  cleaned = stripHtmlTags(cleaned);
  cleaned = decodeHtmlEntities(cleaned);
  cleaned = cleanMarkdownPrefixes(cleaned);
  return cleaned.trim();
}

/**
 * Sanitiza o conteúdo de uma lista, convertendo string para array se necessário
 * e limpando HTML, entidades HTML e prefixos de Markdown de cada item.
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
      .map(item => typeof item === 'string' ? cleanListItem(item) : String(item))
      .filter(item => item.length >= minItemLength);
    
    console.log(`🔧 LIST SANITIZER: Array recebido com ${content.length} itens → ${cleaned.length} válidos`);
    return cleaned;
  }

  // Se é string, converter para array
  if (typeof content === 'string') {
    const originalLength = content.length;
    let lines: string[];
    
    // CENÁRIO A: String contém HTML de lista (<ul>, <ol>, <li>)
    if (containsHtmlList(content)) {
      const extractedItems = extractListItemsFromHtml(content);
      
      if (extractedItems.length > 0) {
        lines = extractedItems;
        console.log(`🔧 LIST SANITIZER: HTML detectado, ${lines.length} <li> extraídos`);
      } else {
        // Fallback: remover todo HTML e dividir por \n
        const stripped = stripHtmlTags(content);
        lines = stripped.split('\n');
        console.log(`🔧 LIST SANITIZER: HTML sem <li>, fallback para split`);
      }
    }
    // CENÁRIO B: String com quebras de linha
    else if (content.includes('\n')) {
      lines = content.split('\n');
    } 
    // CENÁRIO C: Ponto e vírgula como separador
    else if (content.includes(';')) {
      lines = content.split(';');
    } 
    // CENÁRIO D: Hífen com espaços (listas inline)
    else if (content.includes(' - ') && content.split(' - ').length >= 3) {
      lines = content.split(' - ');
    } 
    // CENÁRIO E: Item único
    else {
      const cleaned = cleanListItem(content);
      if (cleaned.length >= minItemLength) {
        console.log(`🔧 LIST SANITIZER: String sem separadores → 1 item`);
        return [cleaned];
      }
      return [];
    }

    // Aplicar pipeline de limpeza em cada item
    const cleaned = lines
      .map(line => cleanListItem(line))
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
