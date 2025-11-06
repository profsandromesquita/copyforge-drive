/**
 * Limpa a formatação de HTML colado, mantendo apenas formatações básicas
 * permitidas: negrito, itálico, sublinhado e links
 */
export const cleanPastedHTML = (html: string): string => {
  // Criar um elemento temporário para processar o HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Função recursiva para processar os nós
  const processNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      const children = Array.from(element.childNodes)
        .map(child => processNode(child))
        .join('');

      // Manter apenas tags permitidas
      switch (tagName) {
        case 'b':
        case 'strong':
          return `<strong>${children}</strong>`;
        case 'i':
        case 'em':
          return `<em>${children}</em>`;
        case 'u':
          return `<u>${children}</u>`;
        case 'a':
          const href = element.getAttribute('href') || '';
          return `<a href="${href}">${children}</a>`;
        case 'br':
          return '<br>';
        case 'p':
        case 'div':
          return children + '<br>';
        default:
          return children;
      }
    }

    return '';
  };

  const cleanedHTML = Array.from(temp.childNodes)
    .map(node => processNode(node))
    .join('')
    .replace(/<br><br>$/g, '<br>') // Remove quebras duplas no final
    .replace(/^<br>/g, ''); // Remove quebra no início

  return cleanedHTML;
};

/**
 * Handler para evento de paste em contentEditable
 * Limpa a formatação do conteúdo colado
 */
export const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
  e.preventDefault();

  const clipboardData = e.clipboardData;
  const htmlData = clipboardData.getData('text/html');
  const textData = clipboardData.getData('text/plain');

  let contentToInsert: string;

  if (htmlData) {
    // Se tiver HTML, limpar mantendo apenas formatações permitidas
    contentToInsert = cleanPastedHTML(htmlData);
  } else {
    // Se for texto puro, apenas inserir
    contentToInsert = textData.replace(/\n/g, '<br>');
  }

  // Inserir o conteúdo limpo no cursor atual
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = contentToInsert;

  const fragment = document.createDocumentFragment();
  let lastNode: Node | null = null;

  while (tempDiv.firstChild) {
    lastNode = fragment.appendChild(tempDiv.firstChild);
  }

  range.insertNode(fragment);

  // Mover o cursor para o final do conteúdo inserido
  if (lastNode) {
    range.setStartAfter(lastNode);
    range.setEndAfter(lastNode);
    selection.removeAllRanges();
    selection.addRange(range);
  }
};
