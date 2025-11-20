import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Loader2 } from 'lucide-react';
import { parseAIResponse, ParsedContent } from '@/lib/ai-content-parser';
import type { SelectedItem } from '@/hooks/useCopyEditor';

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
  onAddContent: (content: string, type: ParsedContent['type']) => Promise<void>;
  onReplaceContent: (content: string, type: ParsedContent['type']) => Promise<void>;
}

export function AIMessageWithActions({ 
  message, 
  hasSelection, 
  selectedItems,
  onAddContent, 
  onReplaceContent 
}: AIMessageWithActionsProps) {
  const [addingBlockId, setAddingBlockId] = useState<string | null>(null);
  const [replacingBlockId, setReplacingBlockId] = useState<string | null>(null);

  const parsed = parseAIResponse(message.content);

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

  const handleAdd = async (block: ParsedContent) => {
    setAddingBlockId(block.id);
    try {
      await onAddContent(block.content, block.type);
    } finally {
      setAddingBlockId(null);
    }
  };

  const handleReplace = async (block: ParsedContent) => {
    setReplacingBlockId(block.id);
    try {
      await onReplaceContent(block.content, block.type);
    } finally {
      setReplacingBlockId(null);
    }
  };

  return (
    <div className="bg-muted text-foreground rounded-lg p-3 space-y-3">
      {/* Explicação inicial se houver */}
      {parsed.explanation && (
        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
          <ReactMarkdown>{parsed.explanation}</ReactMarkdown>
        </div>
      )}

      {/* Renderizar cada bloco com seus botões */}
      {parsed.blocks.map((block) => (
        <div key={block.id} className="space-y-2">
          {/* Título do bloco se houver */}
          {block.title && (
            <p className="text-xs font-medium text-muted-foreground">
              {block.title}
            </p>
          )}

          {/* Conteúdo do bloco */}
          <div className="bg-background border border-border rounded-md p-3">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{block.rawContent}</ReactMarkdown>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => handleAdd(block)}
              disabled={addingBlockId === block.id}
              className="text-xs h-7"
            >
              {addingBlockId === block.id ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Plus className="h-3 w-3 mr-1" />
              )}
              Adicionar
            </Button>

            {hasSelection && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleReplace(block)}
                disabled={replacingBlockId === block.id}
                className="text-xs h-7"
              >
                {replacingBlockId === block.id ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Substituir {selectedItems.length > 1 ? `(${selectedItems.length})` : ''}
              </Button>
            )}
          </div>
        </div>
      ))}

      <p className="text-xs opacity-70 mt-2">
        {new Date(message.created_at).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
    </div>
  );
}
