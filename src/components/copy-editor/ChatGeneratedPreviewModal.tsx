import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BlockPreview } from './BlockPreview';
import { Session, BlockType } from '@/types/copy-editor';
import { Copy, Replace, Loader2, Sparkles } from 'lucide-react';

interface ChatGeneratedPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generatedSessions: Session[];
  hasSelection: boolean;
  selectedCount: number;
  onAdd: () => Promise<void>;
  onReplace?: () => Promise<void>;
  onReplaceAll?: () => Promise<void>;
}

export function ChatGeneratedPreviewModal({
  open,
  onOpenChange,
  generatedSessions,
  hasSelection,
  selectedCount,
  onAdd,
  onReplace,
  onReplaceAll,
}: ChatGeneratedPreviewModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [isReplacingAll, setIsReplacingAll] = useState(false);

  const handleAdd = async () => {
    setIsAdding(true);
    try {
      await onAdd();
      onOpenChange(false);
    } finally {
      setIsAdding(false);
    }
  };

  const handleReplace = async () => {
    if (!onReplace) return;
    setIsReplacing(true);
    try {
      await onReplace();
      onOpenChange(false);
    } finally {
      setIsReplacing(false);
    }
  };

  const handleReplaceAll = async () => {
    if (!onReplaceAll) return;
    setIsReplacingAll(true);
    try {
      await onReplaceAll();
      onOpenChange(false);
    } finally {
      setIsReplacingAll(false);
    }
  };

  // Mapear tipo de bloco para emoji e cor
  const getBlockTypeInfo = (type: BlockType) => {
    switch (type) {
      case 'headline':
        return { emoji: '📢', label: 'Headline', color: 'text-orange-600' };
      case 'list':
        return { emoji: '📋', label: 'Lista', color: 'text-blue-600' };
      case 'text':
        return { emoji: '📝', label: 'Texto', color: 'text-gray-600' };
      case 'button':
        return { emoji: '🔘', label: 'Botão', color: 'text-green-600' };
      case 'image':
        return { emoji: '🖼️', label: 'Imagem', color: 'text-purple-600' };
      default:
        return { emoji: '📄', label: 'Conteúdo', color: 'text-gray-600' };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {hasSelection ? '✏️ Editar Conteúdo' : '✨ Pré-visualização da Copy'}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {hasSelection 
                  ? 'Visualize o conteúdo gerado e escolha como aplicar às suas seleções'
                  : 'Visualize o conteúdo gerado pela IA e adicione à sua copy'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-2">
            {generatedSessions.map((session) => (
              <div key={session.id} className="border-2 rounded-xl p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/30 shadow-sm">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-primary/20">
                  <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                  <h3 className="font-bold text-lg text-primary">
                    {session.title}
                  </h3>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {session.blocks.length} {session.blocks.length === 1 ? 'bloco' : 'blocos'}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {session.blocks.map((block) => {
                    const typeInfo = getBlockTypeInfo(block.type);
                    return (
                      <div 
                        key={block.id} 
                        className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg overflow-hidden hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border/50">
                          <span className="text-base">{typeInfo.emoji}</span>
                          <span className={`text-xs font-semibold ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </div>
                        <div className="p-4">
                          <BlockPreview block={block} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>

          {hasSelection && onReplaceAll && (
            <Button
              variant="outline"
              onClick={handleReplaceAll}
              disabled={isReplacingAll || isReplacing || isAdding}
            >
              {isReplacingAll ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Replace className="h-4 w-4 mr-2" />
              )}
              Substituir Tudo
            </Button>
          )}

          {hasSelection && onReplace && (
            <Button
              variant="outline"
              onClick={handleReplace}
              disabled={isReplacing || isReplacingAll || isAdding}
            >
              {isReplacing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Replace className="h-4 w-4 mr-2" />
              )}
              Substituir {selectedCount > 1 ? `(${selectedCount})` : ''}
            </Button>
          )}

          <Button
            onClick={handleAdd}
            disabled={isAdding || isReplacing || isReplacingAll}
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            Adicionar à Copy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
