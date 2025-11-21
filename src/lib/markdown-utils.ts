/**
 * Converte markdown básico em HTML
 * Suporta: negrito (**texto**), itálico (*texto*), sublinhado (__texto__)
 */
export function markdownToHtml(text: string): string {
  if (typeof text !== 'string') return text;

  let html = text;

  // Converter **texto** para <strong>texto</strong> (negrito)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Converter *texto* para <em>texto</em> (itálico)
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // Converter __texto__ para <u>texto</u> (sublinhado)
  html = html.replace(/__(.+?)__/g, '<u>$1</u>');

  return html;
}
