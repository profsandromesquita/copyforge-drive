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
import { ScrollArea } from '@/components/ui/scroll-area';
import { BlockPreview } from './BlockPreview';
import { Session } from '@/types/copy-editor';
import { Copy, Replace, Loader2 } from 'lucide-react';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {hasSelection ? 'Editar Conteúdo' : 'Pré-visualização da Copy'}
          </DialogTitle>
          <DialogDescription>
            {hasSelection 
              ? 'Visualize o conteúdo gerado e escolha como aplicar às suas seleções'
              : 'Visualize o conteúdo gerado pela IA e adicione à sua copy'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-2">
            {generatedSessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4 bg-primary/5 border-primary/20">
                <h3 className="font-semibold text-lg mb-3 text-primary">
                  {session.title}
                </h3>
                <div className="space-y-2">
                  {session.blocks.map((block) => (
                    <BlockPreview
                      key={block.id}
                      block={block}
                    />
                  ))}
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
