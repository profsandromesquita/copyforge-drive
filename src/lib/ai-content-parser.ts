export interface ParsedContent {
  id: string;
  type: 'headline' | 'text' | 'ad' | 'list' | 'unknown';
  title?: string;
  content: string;
  rawContent: string;
  startIndex: number;
  endIndex: number;
}

export interface ParsedMessage {
  hasActionableContent: boolean;
  blocks: ParsedContent[];
  explanation?: string;
}

export function parseAIResponse(markdown: string): ParsedMessage {
  const blocks: ParsedContent[] = [];
  let explanation = '';

  // Detectar blocos numerados (1., 2., 3., etc.)
  const numberedBlockRegex = /^\s*(\d+)\.\s*(\*\*)?(.+?)(?:\*\*)?$/gm;
  const matches = Array.from(markdown.matchAll(numberedBlockRegex));

  if (matches.length > 0) {
    // Extrair explicação antes do primeiro bloco numerado
    const firstMatch = matches[0];
    if (firstMatch.index && firstMatch.index > 0) {
      explanation = markdown.substring(0, firstMatch.index).trim();
    }

    // Processar cada bloco numerado
    matches.forEach((match, index) => {
      const number = match[1];
      const content = match[3].trim();
      const startIndex = match.index || 0;
      
      // Determinar fim do bloco (início do próximo ou fim do texto)
      let endIndex: number;
      if (index < matches.length - 1) {
        endIndex = matches[index + 1].index || markdown.length;
      } else {
        endIndex = markdown.length;
      }

      // Extrair conteúdo completo do bloco (pode ter múltiplas linhas)
      const fullBlockContent = markdown.substring(startIndex, endIndex).trim();
      
      // Remover o número e limpar
      const cleanedContent = fullBlockContent
        .replace(/^\s*\d+\.\s*/, '')
        .replace(/^\*\*/, '')
        .replace(/\*\*$/, '')
        .trim();

      // Inferir tipo baseado no conteúdo
      const type = inferBlockType(cleanedContent, explanation);

      blocks.push({
        id: `block-${Date.now()}-${index}`,
        type,
        title: `${number}.`,
        content: cleanedContent,
        rawContent: fullBlockContent,
        startIndex,
        endIndex,
      });
    });
  } 
  // Detectar blocos de código
  else if (markdown.includes('```')) {
    const codeBlockRegex = /```[\s\S]*?```/g;
    const codeMatches = Array.from(markdown.matchAll(codeBlockRegex));

    if (codeMatches.length > 0) {
      // Extrair explicação antes do primeiro bloco de código
      const firstMatch = codeMatches[0];
      if (firstMatch.index && firstMatch.index > 0) {
        explanation = markdown.substring(0, firstMatch.index).trim();
      }

      codeMatches.forEach((match, index) => {
        const fullContent = match[0];
        const content = fullContent.replace(/```\w*\n?/g, '').trim();
        
        blocks.push({
          id: `block-${Date.now()}-${index}`,
          type: inferBlockType(content, explanation),
          content,
          rawContent: fullContent,
          startIndex: match.index || 0,
          endIndex: (match.index || 0) + fullContent.length,
        });
      });
    }
  }
  // Detectar seções com títulos ### ou **
  else if (markdown.match(/^#{1,3}\s+.+$/gm) || markdown.match(/^\*\*.+\*\*$/gm)) {
    const sectionRegex = /^(#{1,3}\s+|\*\*)(.+?)(\*\*)?$/gm;
    const sectionMatches = Array.from(markdown.matchAll(sectionRegex));

    if (sectionMatches.length > 1) {
      // Múltiplas seções
      sectionMatches.forEach((match, index) => {
        const title = match[2].trim();
        const startIndex = match.index || 0;
        
        // Encontrar conteúdo até próxima seção
        let endIndex: number;
        if (index < sectionMatches.length - 1) {
          endIndex = sectionMatches[index + 1].index || markdown.length;
        } else {
          endIndex = markdown.length;
        }

        const sectionContent = markdown.substring(startIndex, endIndex).trim();
        const content = sectionContent
          .replace(/^#{1,3}\s+/, '')
          .replace(/^\*\*/, '')
          .replace(/\*\*$/, '')
          .trim();

        blocks.push({
          id: `block-${Date.now()}-${index}`,
          type: inferBlockType(content, title),
          title,
          content,
          rawContent: sectionContent,
          startIndex,
          endIndex,
        });
      });
    }
  }

  // Verificar se há conteúdo acionável
  const hasActionableContent = blocks.length > 0;

  // Se não detectou nenhum padrão mas o texto parece ser conteúdo (não apenas explicação)
  if (!hasActionableContent && markdown.length > 50 && !markdown.toLowerCase().includes('aqui está')) {
    // Considerar todo o conteúdo como um único bloco
    const seemsLikeContent = 
      markdown.includes('"') || 
      markdown.includes('**') ||
      markdown.split('\n').length < 10;

    if (seemsLikeContent) {
      blocks.push({
        id: `block-${Date.now()}-0`,
        type: inferBlockType(markdown, ''),
        content: markdown.trim(),
        rawContent: markdown,
        startIndex: 0,
        endIndex: markdown.length,
      });
    }
  }

  return {
    hasActionableContent: blocks.length > 0,
    blocks,
    explanation: blocks.length > 0 ? explanation : undefined,
  };
}

function inferBlockType(content: string, context: string): ParsedContent['type'] {
  const lowerContent = content.toLowerCase();
  const lowerContext = context.toLowerCase();

  // Verificar palavras-chave no contexto
  if (lowerContext.includes('headline') || lowerContext.includes('título')) {
    return 'headline';
  }
  if (lowerContext.includes('anúncio') || lowerContext.includes('ad')) {
    return 'ad';
  }
  if (lowerContext.includes('lista')) {
    return 'list';
  }

  // Verificar características do conteúdo
  const lines = content.split('\n').filter(l => l.trim());
  
  // Headlines são geralmente curtas (< 150 chars), uma linha, e podem ter aspas
  if (lines.length === 1 && content.length < 150) {
    // Se tem aspas, é definitivamente headline
    if (content.includes('"') || content.includes('"') || content.includes('"')) {
      return 'headline';
    }
    // Se é curto e enfático, também é headline
    if (content.includes('?') || content.includes('!')) {
      return 'headline';
    }
    return 'headline';
  }

  // Detectar listas: items começando com -, •, *, ou números
  const listPatterns = /^[\s]*[-•*\d+.]/;
  const hasListMarkers = lines.some(line => listPatterns.test(line));
  if (hasListMarkers && lines.length > 1) {
    return 'list';
  }

  // Anúncios geralmente têm múltiplas linhas e campos estruturados
  if (
    lowerContent.includes('título:') || 
    lowerContent.includes('descrição:') ||
    lowerContent.includes('cta:') ||
    lowerContent.includes('chamada:')
  ) {
    return 'ad';
  }

  // Texto longo (múltiplos parágrafos)
  if (lines.length > 3 || content.length > 200) {
    return 'text';
  }

  // Fallback para texto padrão
  return 'text';
}

export function cleanContent(rawContent: string): string {
  return rawContent
    .replace(/^\*\*(.+?)\*\*$/g, '$1') // Remove ** de títulos
    .replace(/^["'"'](.+?)["'"']$/g, '$1') // Remove aspas externas (todos os tipos)
    .replace(/^\s+|\s+$/g, '') // Trim espaços
    .trim();
}

// Função para converter blocos parseados em estrutura Session[] otimizada com sessões inteligentes
export function convertParsedBlocksToSessions(blocks: ParsedContent[]): any[] {
  if (blocks.length === 0) return [];

  // Detectar se são múltiplos itens independentes (anúncios, headlines, etc)
  const shouldCreateMultipleSessions = blocks.length > 1 && blocks.every(b => 
    b.type === 'headline' || b.type === 'ad' || b.title
  );

  if (shouldCreateMultipleSessions) {
    // Criar uma sessão para cada item
    return blocks.map((block, index) => {
      // Gerar título mais limpo
      let sessionTitle;
      
      if (block.title) {
        // Se tem título (ex: "1."), remover número e usar preview curto
        sessionTitle = block.title.replace(/^\d+\.\s*/, '');
        if (sessionTitle.trim() === '') {
          // Se o título era só número, usar o conteúdo
          const preview = block.content.substring(0, 50).trim();
          sessionTitle = preview + (block.content.length > 50 ? '...' : '');
        }
      } else {
        // Sem título, usar tipo + preview
        const preview = block.content.substring(0, 50).trim();
        sessionTitle = `${getBlockTypeName(block.type)} - ${preview}${block.content.length > 50 ? '...' : ''}`;
      }

      return {
        id: `session-${Date.now()}-${index}`,
        title: sessionTitle,
        blocks: [createBlockFromParsed(block, 0)]
      };
    });
  }

  // Caso contrário, agrupar todos em uma única sessão
  return [{
    id: `session-${Date.now()}`,
    title: 'Conteúdo Gerado pela IA',
    blocks: blocks.map((block, index) => createBlockFromParsed(block, index))
  }];
}

// Helper: Obter nome amigável do tipo de bloco
function getBlockTypeName(type: ParsedContent['type']): string {
  switch (type) {
    case 'headline': return 'Headline';
    case 'ad': return 'Anúncio';
    case 'list': return 'Lista';
    case 'text': return 'Texto';
    default: return 'Conteúdo';
  }
}

// Helper: Criar bloco a partir de conteúdo parseado
function createBlockFromParsed(block: ParsedContent, index: number): any {
  const baseBlock = {
    id: `block-${Date.now()}-${index}-${Math.random()}`,
  };

  switch (block.type) {
    case 'headline':
      return {
        ...baseBlock,
        type: 'headline' as const,
        content: cleanContent(block.content),
        config: {
          fontSize: 'large',
          fontWeight: 'bold',
          textAlign: 'left',
        }
      };

    case 'ad':
      // Anúncios estruturados
      return {
        ...baseBlock,
        type: 'text' as const,
        content: block.content,
        config: {
          fontSize: 'medium',
          fontWeight: 'normal',
          textAlign: 'left',
        }
      };

    case 'list':
      // Tentar dividir conteúdo em items de lista
      const listItems = block.content
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-•*\d+.]\s*/, '').trim())
        .filter(item => item.length > 0);

      return {
        ...baseBlock,
        type: 'list' as const,
        content: listItems.length > 0 ? listItems : [block.content],
        config: {
          listStyle: 'bullets',
          showListIcons: true,
          listIconColor: '#ff6b35',
          textAlign: 'left',
        }
      };

    case 'text':
    default:
      return {
        ...baseBlock,
        type: 'text' as const,
        content: block.content,
        config: {
          fontSize: 'medium',
          fontWeight: 'normal',
          textAlign: 'left',
        }
      };
  }
}
