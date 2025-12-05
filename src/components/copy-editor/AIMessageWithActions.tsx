import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, ChevronRight, Copy, Check } from 'lucide-react';
import { parseAIResponse, convertParsedBlocksToSessions } from '@/lib/ai-content-parser';
import { ChatGeneratedPreviewModal } from './ChatGeneratedPreviewModal';
import { useToast } from '@/hooks/use-toast';
import type { SelectedItem } from '@/hooks/useCopyEditor';
import type { Session } from '@/types/copy-editor';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

interface AIMessageWithActionsProps {
  message: ChatMessage;
  hasSelection: boolean;
  selectedItems: SelectedItem[];
  intent?: 'replace' | 'insert' | 'conversational' | 'default';
  onAddContent: (sessions: Session[]) => Promise<void>;
  onReplaceContent: (sessions: Session[]) => Promise<void>;
  onReplaceAll: (sessions: Session[]) => Promise<void>;
}

export function AIMessageWithActions({ 
  message, 
  hasSelection, 
  selectedItems,
  intent,
  onAddContent,
  onReplaceContent,
  onReplaceAll,
}: AIMessageWithActionsProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyToClipboard = async () => {
    try {
      // Criar elemento temporário para extrair texto sem HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = message.content;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      toast({
        description: "Copiado para área de transferência!",
        duration: 2000,
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast({
        variant: "destructive",
        description: "Erro ao copiar texto",
      });
    }
  };

  // 🚫 BLOQUEAR: Não mostrar ações se for conversacional
  if (intent === 'conversational') {
    return (
      <div className="bg-muted text-foreground rounded-lg p-3 relative group">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopyToClipboard}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
        <div 
          className="prose prose-sm dark:prose-invert max-w-none pr-8"
          dangerouslySetInnerHTML={{ __html: message.content }}
        />
        <p className="text-xs opacity-70 mt-2">
          {new Date(message.created_at).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    );
  }

  // Always use normal parsing - don't force structure
  const parsed = parseAIResponse(message.content);
  
  // ✅ DECISÃO DE CARD: Usar intent do backend como FALLBACK
  // Se intent é insert/replace MAS parser não reconheceu ### → criar bloco único
  const shouldForceCard = (intent === 'insert' || intent === 'replace') && !parsed.hasActionableContent;
  
  // Se deve forçar card mas parser não reconheceu, criar bloco único com conteúdo todo
  let actionableBlocks = parsed.blocks;
  if (shouldForceCard && parsed.blocks.length === 0) {
    // Criar bloco único com todo o conteúdo como fallback
    actionableBlocks = [{
      id: `fallback-${Date.now()}`,
      type: 'text' as const,
      title: intent === 'replace' ? 'Conteúdo Otimizado' : 'Novo Conteúdo',
      content: message.content,
      rawContent: message.content,
      startIndex: 0,
      endIndex: message.content.length,
    }];
  }
  
  // Filter and sanitize blocks based on selection
  const selectedBlocksCount = selectedItems.filter(i => i.type === 'block').length;

  if (hasSelection && selectedBlocksCount > 0 && !shouldForceCard) {
    // 1) Limit generated blocks to match selected blocks count
    actionableBlocks = actionableBlocks.slice(0, selectedBlocksCount);

    // 2) Remove title to prevent extra headline creation
    actionableBlocks = actionableBlocks.map(b => ({
      ...b,
      title: undefined,
    }));
  }

  // ✅ Determinar se deve mostrar card baseado em: parser OU intent forçando
  const showCard = parsed.hasActionableContent || shouldForceCard;
  
  const generatedSessions = showCard 
    ? convertParsedBlocksToSessions(actionableBlocks)
    : [];

  if (!showCard) {
    // Renderizar normalmente sem botões
    return (
      <div className="bg-muted text-foreground rounded-lg p-3 relative group">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopyToClipboard}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
        <div 
          className="prose prose-sm dark:prose-invert max-w-none pr-8"
          dangerouslySetInnerHTML={{ __html: message.content }}
        />
        <p className="text-xs opacity-70 mt-2">
          {new Date(message.created_at).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    );
  }

  // Gerar resumo detalhado do conteúdo gerado
  const getContentSummary = () => {
    const sessionsCount = generatedSessions.length;
    const totalBlocks = generatedSessions.reduce((sum, s) => sum + s.blocks.length, 0);
    
    if (sessionsCount === 1) {
      // Uma sessão - mostrar info dos blocos
      const session = generatedSessions[0];
      
      if (session.blocks.length === 1) {
        const block = session.blocks[0];
        const preview = typeof block.content === 'string' 
          ? block.content.substring(0, 60) + (block.content.length > 60 ? '...' : '')
          : 'Conteúdo gerado';
        
        return {
          title: getBlockTypeName(block.type),
          preview,
          count: '1 item'
        };
      }
      
      // Múltiplos blocos em uma sessão
      const types = session.blocks.map(b => getBlockTypeName(b.type));
      const uniqueTypes = [...new Set(types)];
      const typesSummary = uniqueTypes.length === 1 
        ? `${session.blocks.length} ${uniqueTypes[0]}s`
        : `${session.blocks.length} itens`;
      
      return {
        title: typesSummary,
        preview: session.title,
        count: `${session.blocks.length} ${session.blocks.length === 1 ? 'item' : 'itens'}`
      };
    }
    
    // Múltiplas sessões
    const firstSession = generatedSessions[0];
    const firstBlock = firstSession.blocks[0];
    const preview = typeof firstBlock.content === 'string'
      ? firstBlock.content.substring(0, 50) + '...'
      : firstSession.title;
    
    return {
      title: `${sessionsCount} ${getBlockTypeName(firstBlock.type)}s`,
      preview,
      count: `${sessionsCount} ${sessionsCount === 1 ? 'sessão' : 'sessões'}`
    };
  };

  const getBlockTypeName = (type: string): string => {
    switch (type) {
      case 'headline': return 'Headline';
      case 'list': return 'Lista';
      case 'text': return 'Texto';
      case 'button': return 'Botão';
      default: return 'Item';
    }
  };

  const summary = getContentSummary();

  const handleAdd = async (sessions: Session[]) => {
    await onAddContent(sessions);
  };

  const handleInsertAfter = async (sessions: Session[]) => {
    await onAddContent(sessions);
  };

  const handleReplace = async (sessions: Session[]) => {
    await onReplaceContent(sessions);
  };

  return (
    <>
      <div className="bg-muted text-foreground rounded-lg p-3 space-y-3 relative group">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={handleCopyToClipboard}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
        {/* Explicação inicial se houver */}
        {parsed.explanation && (
          <div 
            className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground mb-3 pr-8"
            dangerouslySetInnerHTML={{ __html: parsed.explanation }}
          />
        )}

        {/* Card clicável com resumo do conteúdo */}
        <Card 
          className="p-5 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent group"
          onClick={() => setShowModal(true)}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md group-hover:scale-110 transition-transform">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-bold text-base text-primary">
                  {hasSelection ? 'Conteúdo Editado' : 'Novo Conteúdo'}
                </h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                  {summary.count}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                {summary.title}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                {summary.preview}
              </p>
              <div className="flex items-center gap-2 text-xs font-medium text-primary group-hover:gap-3 transition-all">
                <span>Clique para visualizar e aplicar</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </Card>

        <p className="text-xs opacity-70 mt-2">
          {new Date(message.created_at).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* Modal de pré-visualização */}
      <ChatGeneratedPreviewModal
        open={showModal}
        onOpenChange={setShowModal}
        generatedSessions={generatedSessions}
        hasSelection={hasSelection}
        selectedCount={selectedItems.length}
        onAdd={handleAdd}
        onInsertAfter={hasSelection ? handleInsertAfter : undefined}
        onReplace={hasSelection ? handleReplace : undefined}
      />
    </>
  );
}
