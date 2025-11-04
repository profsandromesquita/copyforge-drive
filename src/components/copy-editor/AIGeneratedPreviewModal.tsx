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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Session, Block } from '@/types/copy-editor';
import { useCopyEditor } from '@/hooks/useCopyEditor';
import { useToast } from '@/hooks/use-toast';

interface AIGeneratedPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generatedSessions: Session[];
  onClose: () => void;
  onSuccess: () => void;
}

export const AIGeneratedPreviewModal = ({
  open,
  onOpenChange,
  generatedSessions,
  onClose,
  onSuccess,
}: AIGeneratedPreviewModalProps) => {
  const { importSessions } = useCopyEditor();
  const { toast } = useToast();

  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);

  const toggleSession = (sessionId: string) => {
    if (selectedSessions.includes(sessionId)) {
      // Deselect session and all its blocks
      setSelectedSessions(selectedSessions.filter((id) => id !== sessionId));
      const session = generatedSessions.find((s) => s.id === sessionId);
      if (session) {
        const blockIds = session.blocks.map((b) => b.id);
        setSelectedBlocks(selectedBlocks.filter((id) => !blockIds.includes(id)));
      }
    } else {
      // Select session and all its blocks
      setSelectedSessions([...selectedSessions, sessionId]);
      const session = generatedSessions.find((s) => s.id === sessionId);
      if (session) {
        const blockIds = session.blocks.map((b) => b.id);
        setSelectedBlocks([...new Set([...selectedBlocks, ...blockIds])]);
      }
    }
  };

  const toggleBlock = (blockId: string, sessionId: string) => {
    if (selectedBlocks.includes(blockId)) {
      setSelectedBlocks(selectedBlocks.filter((id) => id !== blockId));
      // If deselecting a block, also deselect the session
      setSelectedSessions(selectedSessions.filter((id) => id !== sessionId));
    } else {
      setSelectedBlocks([...selectedBlocks, blockId]);
      // Check if all blocks in session are now selected
      const session = generatedSessions.find((s) => s.id === sessionId);
      if (session) {
        const allBlocksSelected = session.blocks.every(
          (b) => selectedBlocks.includes(b.id) || b.id === blockId
        );
        if (allBlocksSelected && !selectedSessions.includes(sessionId)) {
          setSelectedSessions([...selectedSessions, sessionId]);
        }
      }
    }
  };

  const renderBlockPreview = (block: Block) => {
    if (block.type === 'list' && Array.isArray(block.content)) {
      return block.content.slice(0, 2).join(', ') + (block.content.length > 2 ? '...' : '');
    }
    return typeof block.content === 'string' ? block.content : '';
  };

  const selectedCount = selectedBlocks.length;
  const hasSelection = selectedCount > 0;

  const handleAddToCopy = () => {
    const sessionsToAdd = generatedSessions
      .map((session) => {
        // If entire session is selected
        if (selectedSessions.includes(session.id)) {
          return session;
        }

        // If only some blocks are selected
        const selectedBlocksInSession = session.blocks.filter((block) =>
          selectedBlocks.includes(block.id)
        );

        if (selectedBlocksInSession.length > 0) {
          return {
            ...session,
            blocks: selectedBlocksInSession,
          };
        }

        return null;
      })
      .filter((s): s is Session => s !== null);

    if (sessionsToAdd.length === 0) {
      toast({
        title: 'Nenhum conteúdo selecionado',
        description: 'Selecione ao menos uma sessão ou bloco.',
        variant: 'destructive',
      });
      return;
    }

    importSessions(sessionsToAdd);

    toast({
      title: 'Conteúdo adicionado!',
      description: `${sessionsToAdd.length} sessão(ões) adicionada(s) à sua copy.`,
    });

    // Reset and close
    setSelectedSessions([]);
    setSelectedBlocks([]);
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Copy Gerada pela IA</DialogTitle>
          <DialogDescription>
            Selecione as sessões e blocos que deseja adicionar à sua copy
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4 pb-4">
            {generatedSessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4">
                {/* Session checkbox */}
                <div className="flex items-center gap-2 mb-3">
                  <Checkbox
                    checked={selectedSessions.includes(session.id)}
                    onCheckedChange={() => toggleSession(session.id)}
                  />
                  <h3 className="font-semibold text-lg">{session.title}</h3>
                </div>

                {/* Blocks */}
                <div className="ml-6 space-y-2">
                  {session.blocks.map((block) => (
                    <div
                      key={block.id}
                      className="flex items-start gap-2 p-2 border-l-2 border-muted hover:bg-muted/50 rounded"
                    >
                      <Checkbox
                        checked={selectedBlocks.includes(block.id)}
                        onCheckedChange={() => toggleBlock(block.id, session.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <Badge variant="outline" className="mb-1 text-xs">
                          {block.type}
                        </Badge>
                        <div className="text-sm text-muted-foreground line-clamp-2 break-words">
                          {renderBlockPreview(block)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleAddToCopy} disabled={!hasSelection}>
            Adicionar à Copy ({selectedCount} {selectedCount === 1 ? 'item' : 'itens'})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
