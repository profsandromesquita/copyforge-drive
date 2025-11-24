import type { BlockType } from '@/types/copy-editor';
import { markdownToHtml } from './markdown-utils';

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

export interface ExpectedStructure {
  sessions: Array<{
    title: string;
    blockCount: number;
    blockTypes: BlockType[];
  }>;
}

// Remover prefixos de identificação do conteúdo
function stripMetaPrefixes(text: string): string {
  return text
    .replace(/^(BLOCO|OPÇÃO|OPÇÃO|VERSÃO|VERSAO)\s+\d+:\s*/i, '')
    .replace(/^(Opção|Opcao)\s+\d+:\s*/i, '')
    .replace(/^\d+\.\s+/, '') // Remove "1. ", "2. "
    .trim();
}

// Helper to detect if a title indicates a high-level independent item
function isHighLevelTitle(title: string): boolean {
  const lower = title.toLowerCase();
  const highLevelKeywords = [
    'anúncio', 'anuncio', 'roteiro', 'vídeo', 'video',
    'script', 'variação', 'variacao', 'copy', 'versão', 'versao',
    'headline', 'título', 'titulo', 'email', 'post',
    'opção', 'opcao' // ✅ FORÇAR separação de opções
  ];
  return highLevelKeywords.some(k => lower.includes(k));
}

export function parseAIResponse(markdown: string): ParsedMessage {
  console.log('🔍 [Parser] Iniciando parse de:', markdown.substring(0, 100) + '...');
  
  const blocks: ParsedContent[] = [];
  let explanation = '';
  let contentForParsing = markdown;

  // PRÉ-PROCESSAMENTO: Separar explicação conversacional do conteúdo estruturado
  // Heurística 1: Encontrar "###" no meio do texto
  const headingIndex = markdown.indexOf('### ');
  if (headingIndex > 0) {
    explanation = markdown.substring(0, headingIndex).trim();
    contentForParsing = markdown.substring(headingIndex).trim();
  } else {
    // Heurística 2: Procurar padrão "1. " como início de conteúdo
    const numberedMatch = markdown.match(/(\n|^)\s*1\.\s+/);
    if (numberedMatch && numberedMatch.index !== undefined && numberedMatch.index > 0) {
      explanation = markdown.substring(0, numberedMatch.index).trim();
      contentForParsing = markdown.substring(numberedMatch.index).trim();
    }
  }

  // Detectar blocos numerados de nível superior (### 1. ou ### **1. ou simplesmente 1.)
  // Este regex procura por linhas que começam com número seguido de ponto
  const topLevelRegex = /^(?:#{1,3}\s+)?(?:\*\*)?\s*(\d+)\.\s*(?:\*\*)?(.+?)(?:\*\*)?$/gm;
  const matches = Array.from(contentForParsing.matchAll(topLevelRegex));

  if (matches.length > 1) { // Só usar este método se houver múltiplos itens numerados
    // Explicação já foi extraída no pré-processamento, não precisa fazer novamente aqui

    // Processar cada bloco numerado com agrupamento inteligente
    let currentBlock: ParsedContent | null = null;
    
    matches.forEach((match, index) => {
      const number = match[1];
      const title = match[2].trim();
      const startIndex = match.index || 0;
      
      // Determinar fim do bloco (início do próximo número de nível superior ou fim do texto)
      let endIndex: number;
      if (index < matches.length - 1) {
        endIndex = matches[index + 1].index || contentForParsing.length;
      } else {
        endIndex = contentForParsing.length;
      }

      // Extrair conteúdo completo do bloco (inclui tudo até o próximo item numerado)
      const fullBlockContent = contentForParsing.substring(startIndex, endIndex).trim();
      
      // Remover apenas a primeira linha de numeração, mantendo o restante da estrutura
      const contentLines = fullBlockContent.split('\n');
      contentLines.shift(); // Remove primeira linha (o título numerado)
      let cleanedContent = contentLines.join('\n').trim();
      
      // 🛡️ FALLBACK: Processar Markdown para HTML
      cleanedContent = markdownToHtml(cleanedContent);
      cleanedContent = stripMetaPrefixes(cleanedContent); // ✅ Limpar prefixos

      // Se ficou vazio, pode ser porque o conteúdo está na próxima linha
      if (!cleanedContent && contentLines.length > 0) {
        cleanedContent = fullBlockContent.replace(/^(?:#{1,3}\s+)?(?:\*\*)?\s*\d+\.\s*(?:\*\*)?(.+?)(?:\*\*)?$/m, '').trim();
      }

      // Check if this is a high-level item or if we don't have a current block yet
      if (isHighLevelTitle(title) || !currentBlock) {
        // Create a new block for high-level items
        const type = inferBlockType(cleanedContent, title);
        
        // Só adicionar bloco se tiver conteúdo
        if (cleanedContent) {
          // Processar título para remover Markdown (se houver)
          const processedTitle = title.replace(/^###\s+/, '').replace(/\*\*/g, '').trim();
          const cleanTitle = stripMetaPrefixes(processedTitle); // ✅ Limpar prefixos
          
          currentBlock = {
            id: `block-${Date.now()}-${index}`,
            type,
            title: `${number}. ${cleanTitle}`,
            content: cleanedContent,
            rawContent: fullBlockContent,
            startIndex,
            endIndex,
          };
          
          blocks.push(currentBlock);
        }
      } else {
        // This is a sub-item (like a scene), append to current block
        currentBlock.content += '\n\n' + cleanedContent;
        currentBlock.rawContent += '\n\n' + fullBlockContent;
        currentBlock.endIndex = endIndex;
      }
    });
  }
  // Detectar blocos de código
  else if (contentForParsing.includes('```')) {
    const codeBlockRegex = /```[\s\S]*?```/g;
    const codeMatches = Array.from(contentForParsing.matchAll(codeBlockRegex));

    if (codeMatches.length > 0) {
      // Explicação já foi extraída no pré-processamento

      codeMatches.forEach((match, index) => {
        const fullContent = match[0];
        const content = fullContent.replace(/```\w*\n?/g, '').trim();
        
        // 🛡️ FALLBACK: Processar Markdown para HTML
        const processedContent = markdownToHtml(content);
        
        blocks.push({
          id: `block-${Date.now()}-${index}`,
          type: inferBlockType(processedContent, explanation),
          content: processedContent,
          rawContent: fullContent,
          startIndex: match.index || 0,
          endIndex: (match.index || 0) + fullContent.length,
        });
      });
    }
  }
  // Detectar seções com títulos ### (removendo ** como separador de seção)
  else if (contentForParsing.match(/^#{1,3}\s+.+$/gm)) {
    const sectionRegex = /^#{1,3}\s+(.+)$/gm;
    const sectionMatches = Array.from(contentForParsing.matchAll(sectionRegex));

    if (sectionMatches.length > 1) {
      // Processar múltiplas seções com SEPARAÇÃO FORÇADA para "Opção N:" e numerados
      let currentBlock: ParsedContent | null = null;
      
      sectionMatches.forEach((match, index) => {
        const title = match[1].trim();
        const startIndex = match.index || 0;
        
        // Encontrar conteúdo até próxima seção
        let endIndex: number;
        if (index < sectionMatches.length - 1) {
          endIndex = sectionMatches[index + 1].index || contentForParsing.length;
        } else {
          endIndex = contentForParsing.length;
        }

        const sectionContent = contentForParsing.substring(startIndex, endIndex).trim();
        
        // 🛡️ FALLBACK: Processar Markdown para HTML antes de armazenar
        let content = sectionContent.replace(/^#{1,3}\s+/, '').trim();
        content = markdownToHtml(content);
        content = stripMetaPrefixes(content); // ✅ Limpar prefixos

        // ✅ FORÇAR separação de blocos "Opção N:" e numerados "1.", "2."
        const isOptionBlock = /^Opção\s+\d+:/i.test(title);
        const isNumberedBlock = /^\d+\.\s+/.test(title);
        
        // Check if this is a high-level heading or if we don't have a current block yet
        if (isHighLevelTitle(title) || isOptionBlock || isNumberedBlock || !currentBlock) {
          // Create a new block for high-level headings, options, and numbered blocks
          const type = inferBlockType(content, title);
          
          // Processar título para remover Markdown
          const processedTitle = title.replace(/^###\s+/, '').replace(/\*\*/g, '').trim();
          
          currentBlock = {
            id: `block-${Date.now()}-${index}`,
            type,
            title: processedTitle,
            content,
            rawContent: sectionContent,
            startIndex,
            endIndex,
          };
          
          blocks.push(currentBlock);
        } else {
          // This is a sub-heading (like internal scene/step), append to current block
          currentBlock.content += '\n\n' + content;
          currentBlock.rawContent += '\n\n' + sectionContent;
          currentBlock.endIndex = endIndex;
        }
      });
    }
  }

  // Verificar se há conteúdo acionável
  const hasActionableContent = blocks.length > 0;

  // Se não detectou nenhum padrão mas o texto parece ser conteúdo (não apenas explicação)
  if (!hasActionableContent && contentForParsing.length > 50 && !contentForParsing.toLowerCase().includes('aqui está')) {
    // Considerar todo o conteúdo como um único bloco
    const seemsLikeContent = 
      contentForParsing.includes('"') || 
      contentForParsing.includes('**') ||
      contentForParsing.split('\n').length < 10;

    if (seemsLikeContent) {
      blocks.push({
        id: `block-${Date.now()}-0`,
        type: inferBlockType(contentForParsing, ''),
        content: contentForParsing.trim(),
        rawContent: contentForParsing,
        startIndex: 0,
        endIndex: contentForParsing.length,
      });
    }
  }

  console.log('✅ [Parser] Blocos detectados:', blocks.length);
  blocks.forEach((b, i) => {
    console.log(`  Block ${i}: type="${b.type}", title="${b.title}", content length=${b.content.length}`);
  });

  return {
    hasActionableContent: blocks.length > 0,
    blocks,
    explanation: blocks.length > 0 ? explanation : undefined,
  };
}

function inferBlockType(content: string, context: string): ParsedContent['type'] {
  const lowerContent = content.toLowerCase();
  const lowerContext = context.toLowerCase();

  // 1. PRIORIDADE: Verificar palavras-chave no CONTEXTO PRIMEIRO
  if (lowerContext.includes('headline') || lowerContext.includes('título')) {
    return 'headline';
  }
  if (lowerContext.includes('anúncio') || lowerContext.includes('ad') || 
      lowerContext.includes('roteiro') || lowerContext.includes('vídeo') || 
      lowerContext.includes('script')) {
    return 'ad';
  }

  // 2. Verificar estrutura do CONTEÚDO
  const lines = content.split('\n').filter(l => l.trim());
  
  // Headlines: curtas, uma linha, com aspas ou pontuação enfática
  if (lines.length === 1 && content.length < 150) {
    if (content.includes('"') || content.includes('"') || content.includes('"') ||
        content.includes('?') || content.includes('!')) {
      return 'headline';
    }
    return 'headline';
  }

  // Anúncios: conteúdo estruturado com campos
  if (lowerContent.includes('título:') || 
      lowerContent.includes('descrição:') ||
      lowerContent.includes('cta:') ||
      lowerContent.includes('chamada:') ||
      lowerContent.includes('duração:') ||
      lowerContent.includes('cena')) {
    return 'ad';
  }

  // Listas: SOMENTE se houver MÚLTIPLAS linhas COM marcadores CONSISTENTES
  const listPatterns = /^[\s]*[-•*]\s+/; // Removido \d+. para evitar falsos positivos
  const linesWithMarkers = lines.filter(line => listPatterns.test(line));
  
  // Só é lista se tiver pelo menos 2 linhas com marcadores
  if (linesWithMarkers.length >= 2 && linesWithMarkers.length >= lines.length * 0.5) {
    return 'list';
  }

  // Texto longo (múltiplos parágrafos)
  if (lines.length > 2 || content.length > 150) {
    return 'text';
  }

  // Fallback: texto padrão
  return 'text';
}

export function cleanContent(rawContent: string): string {
  return rawContent
    .replace(/^["'"'](.+?)["'"']$/g, '$1') // Remove aspas externas (todos os tipos)
    .replace(/^\s+|\s+$/g, '') // Trim espaços
    .trim();
}

// Função para converter blocos parseados em estrutura Session[] otimizada com sessões inteligentes
/**
 * Parse AI response with forced structure matching
 * Forces the parsed content to match expected session/block structure
 */
export function parseAIResponseWithStructure(
  markdown: string,
  expectedStructure: ExpectedStructure
): ParsedMessage {
  // 1. Try normal parsing first
  const normalParsed = parseAIResponse(markdown);

  // 2. Calculate expected total blocks
  const expectedTotalBlocks = expectedStructure.sessions.reduce(
    (sum, s) => sum + s.blockCount,
    0
  );

  // 3. If structure matches, return normal result
  if (normalParsed.blocks.length === expectedTotalBlocks) {
    return normalParsed;
  }

  // 4. Force structure: intelligently split markdown to match expected structure
  const forcedBlocks: ParsedContent[] = [];
  const lines = markdown.split('\n');

  // Find all potential section headings
  const headingIndices: number[] = [];
  lines.forEach((line, index) => {
    if (line.match(/^#{1,3}\s+/)) {
      headingIndices.push(index);
    }
  });

  // If we have the right number of headings for sessions, use them
  if (headingIndices.length === expectedStructure.sessions.length) {
    expectedStructure.sessions.forEach((expectedSession, sessionIndex) => {
      const startLine = headingIndices[sessionIndex];
      const endLine =
        sessionIndex < headingIndices.length - 1
          ? headingIndices[sessionIndex + 1]
          : lines.length;

      const sessionContent = lines.slice(startLine, endLine).join('\n');
      const title = lines[startLine].replace(/^#{1,3}\s+/, '').trim();

      // Split session content into expected number of blocks
      const sessionLines = lines.slice(startLine + 1, endLine);
      const blockSize = Math.ceil(sessionLines.length / expectedSession.blockCount);

      for (let i = 0; i < expectedSession.blockCount; i++) {
        const blockStart = i * blockSize;
        const blockEnd = Math.min((i + 1) * blockSize, sessionLines.length);
        const blockContent = sessionLines.slice(blockStart, blockEnd).join('\n').trim();

        if (blockContent) {
          // Map expected block type to ParsedContent type
          const expectedType = expectedSession.blockTypes[i];
          const blockType: ParsedContent['type'] = 
            expectedType === 'headline' || expectedType === 'text' || expectedType === 'list'
              ? expectedType
              : expectedType === 'subheadline'
              ? 'headline'
              : 'text';

          forcedBlocks.push({
            id: `forced-block-${sessionIndex}-${i}`,
            type: blockType,
            title: i === 0 ? title : `${title} - Parte ${i + 1}`,
            content: blockContent,
            rawContent: blockContent,
            startIndex: startLine + blockStart,
            endIndex: startLine + blockEnd,
          });
        }
      }
    });
  } else {
    // Fallback: split content evenly across expected blocks
    const contentPerBlock = Math.ceil(lines.length / expectedTotalBlocks);
    let blockIndex = 0;

    expectedStructure.sessions.forEach((expectedSession, sessionIndex) => {
      for (let i = 0; i < expectedSession.blockCount; i++) {
        const startLine = blockIndex * contentPerBlock;
        const endLine = Math.min((blockIndex + 1) * contentPerBlock, lines.length);
        const blockContent = lines.slice(startLine, endLine).join('\n').trim();

        if (blockContent) {
          // Map expected block type to ParsedContent type
          const expectedType = expectedSession.blockTypes[i];
          const blockType: ParsedContent['type'] = 
            expectedType === 'headline' || expectedType === 'text' || expectedType === 'list'
              ? expectedType
              : expectedType === 'subheadline'
              ? 'headline'
              : 'text';

          forcedBlocks.push({
            id: `forced-block-${sessionIndex}-${i}`,
            type: blockType,
            title: expectedSession.title || `Sessão ${sessionIndex + 1}`,
            content: blockContent,
            rawContent: blockContent,
            startIndex: startLine,
            endIndex: endLine,
          });
        }

        blockIndex++;
      }
    });
  }

  return {
    hasActionableContent: forcedBlocks.length > 0,
    blocks: forcedBlocks,
    explanation: normalParsed.explanation,
  };
}

export function convertParsedBlocksToSessions(blocks: ParsedContent[]): any[] {
  if (blocks.length === 0) return [];

  // Nova lógica: Agrupar blocos que pertencem à mesma sessão conceitual
  const sessions: any[] = [];
  let currentSession: any = null;

  blocks.forEach((block, index) => {
    // ✅ FORÇAR separação para opções e numerados
    const isOptionBlock = block.title && /^Opção\s+\d+:/i.test(block.title);
    const isNumberedBlock = block.title && /^\d+\.\s+/.test(block.title);
    
    // Decidir se este bloco inicia uma nova sessão
    const isNewSession = 
      !currentSession || // Primeira sessão
      (block.title && isHighLevelTitle(block.title)) || // Título de alto nível
      isOptionBlock || // ✅ SEMPRE separar opções
      isNumberedBlock || // ✅ SEMPRE separar numerados
      (block.type === 'ad' && currentSession.blocks.length > 0); // Ad sempre é nova sessão

    if (isNewSession) {
      // Se o bloco tem título mas NÃO é de alto nível, tratar o título como headline
      const shouldTitleBeContent = block.title && !isHighLevelTitle(block.title);
      
      const sessionTitle = shouldTitleBeContent
        ? `Conteúdo ${sessions.length + 1}` // Título genérico
        : (block.title ? block.title.replace(/^\d+\.\s*/, '') : `${getBlockTypeName(block.type)}`);

      const sessionBlocks = [];
      
      // Se o título vira conteúdo, criar um bloco headline primeiro
      if (shouldTitleBeContent) {
        sessionBlocks.push({
          id: `block-${Date.now()}-${index}-title`,
          type: 'headline' as const,
          content: markdownToHtml(cleanContent(block.title!)),
          config: {
            fontSize: 'large',
            fontWeight: 'bold',
            textAlign: 'left',
          }
        });
      }
      
      // Adicionar o bloco principal (se tiver conteúdo além do título)
      if (block.content && block.content.trim()) {
        sessionBlocks.push(createBlockFromParsed(block, sessionBlocks.length));
      }

      currentSession = {
        id: `session-${Date.now()}-${index}`,
        title: sessionTitle,
        blocks: sessionBlocks.length > 0 ? sessionBlocks : [createBlockFromParsed(block, 0)]
      };
      sessions.push(currentSession);
    } else {
      // Adicionar à sessão atual
      currentSession.blocks.push(
        createBlockFromParsed(block, currentSession.blocks.length)
      );
    }
  });

  // Se não criou nenhuma sessão (edge case), criar uma padrão
  if (sessions.length === 0) {
    return [{
      id: `session-${Date.now()}`,
      title: 'Conteúdo Gerado pela IA',
      blocks: blocks.map((block, index) => createBlockFromParsed(block, index))
    }];
  }

  console.log('🎯 [Parser] Sessões criadas:', sessions.length);
  sessions.forEach((s, i) => {
    console.log(`  Session ${i}: title="${s.title}", blocks=${s.blocks.length}`);
  });

  return sessions;
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
        content: markdownToHtml(cleanContent(block.content)),
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
        content: markdownToHtml(block.content),
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
        content: markdownToHtml(block.content),
        config: {
          fontSize: 'medium',
          fontWeight: 'normal',
          textAlign: 'left',
        }
      };
  }
}
