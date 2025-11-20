import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, ChevronRight } from 'lucide-react';
import { parseAIResponse, convertParsedBlocksToSessions } from '@/lib/ai-content-parser';
import { ChatGeneratedPreviewModal } from './ChatGeneratedPreviewModal';
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
  onAddContent: (sessions: Session[]) => Promise<void>;
  onReplaceContent: (sessions: Session[]) => Promise<void>;
  onReplaceAll: (sessions: Session[]) => Promise<void>;
}

export function AIMessageWithActions({ 
  message, 
  hasSelection, 
  selectedItems,
  onAddContent,
  onReplaceContent,
  onReplaceAll,
}: AIMessageWithActionsProps) {
  const [showModal, setShowModal] = useState(false);

  const parsed = parseAIResponse(message.content);
  const generatedSessions = parsed.hasActionableContent 
    ? convertParsedBlocksToSessions(parsed.blocks)
    : [];

  if (!parsed.hasActionableContent) {
    // Renderizar normalmente sem botões
    return (
      <div className="bg-muted text-foreground rounded-lg p-3">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        <p className="text-xs opacity-70 mt-2">
          {new Date(message.created_at).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    );
  }

  // Gerar resumo do conteúdo gerado
  const contentSummary = parsed.blocks.length === 1
    ? parsed.blocks[0].title || 'Conteúdo gerado'
    : `${parsed.blocks.length} ${parsed.blocks.length === 1 ? 'item gerado' : 'itens gerados'}`;

  const handleAdd = async () => {
    await onAddContent(generatedSessions);
  };

  const handleReplace = async () => {
    await onReplaceContent(generatedSessions);
  };

  const handleReplaceAll = async () => {
    await onReplaceAll(generatedSessions);
  };

  return (
    <>
      <div className="bg-muted text-foreground rounded-lg p-3 space-y-3">
        {/* Explicação inicial se houver */}
        {parsed.explanation && (
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground mb-3">
            <ReactMarkdown>{parsed.explanation}</ReactMarkdown>
          </div>
        )}

        {/* Card clicável com resumo do conteúdo */}
        <Card 
          className="p-4 cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-colors border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
          onClick={() => setShowModal(true)}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm mb-1">
                {hasSelection ? 'Conteúdo Editado' : 'Conteúdo Gerado'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {contentSummary}
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                <span>Clique para visualizar e adicionar</span>
                <ChevronRight className="h-3 w-3" />
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
        onReplace={hasSelection ? handleReplace : undefined}
        onReplaceAll={hasSelection && selectedItems.length > 1 ? handleReplaceAll : undefined}
      />
    </>
  );
}
