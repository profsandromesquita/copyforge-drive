/**
 * Converte markdown básico em HTML
 * Suporta: títulos (##, ###, ####), negrito (**texto**), itálico (*texto*), sublinhado (__texto__), 
 * listas não ordenadas (- item), listas numeradas (1. item), links
 */
export function markdownToHtml(text: string): string {
  if (typeof text !== 'string') return text;

  let html = text;

  // Converter #### para <h4> (mais específico primeiro)
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  
  // Converter ### para <h3>
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  
  // Converter ## para <h2>
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');

  // Converter listas não ordenadas (- item ou * item)
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
  
  // Converter listas numeradas (1. item, 2. item, etc.)
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
  
  // Envolver <li> consecutivos em <ul>
  html = html.replace(/(<li>.*?<\/li>\n?)+/gs, (match) => {
    return '<ul class="list-disc pl-4 space-y-1">' + match + '</ul>';
  });

  // Converter **texto** para <strong>texto</strong> (negrito)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Converter *texto* para <em>texto</em> (itálico)
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // Converter __texto__ para <u>texto</u> (sublinhado)
  html = html.replace(/__(.+?)__/g, '<u>$1</u>');

  // Converter [texto](url) para <a href="url">texto</a>
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>');

  return html;
}
