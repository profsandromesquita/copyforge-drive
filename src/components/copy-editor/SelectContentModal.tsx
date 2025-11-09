import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Session, Block } from "@/types/copy-editor";
import { FileText, Type, List, MousePointerClick } from "lucide-react";

interface SelectContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: Session[];
  onConfirm: (selectedSessions: Session[], selectedBlocks: Block[]) => void;
}

const getBlockIcon = (type: Block['type']) => {
  switch (type) {
    case 'headline':
    case 'subheadline':
      return <Type className="h-4 w-4" />;
    case 'list':
      return <List className="h-4 w-4" />;
    case 'button':
      return <MousePointerClick className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getBlockTypeLabel = (type: Block['type']) => {
  const labels = {
    headline: 'Título',
    subheadline: 'Subtítulo',
    text: 'Texto',
    list: 'Lista',
    button: 'Botão'
  };
  return labels[type] || type;
};

export function SelectContentModal({ open, onOpenChange, sessions, onConfirm }: SelectContentModalProps) {
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set());

  const selectAll = () => {
    const allSessionIds = new Set(sessions.map(s => s.id));
    const allBlockIds = new Set(sessions.flatMap(s => s.blocks.map(b => b.id)));
    setSelectedSessionIds(allSessionIds);
    setSelectedBlockIds(allBlockIds);
  };

  const deselectAll = () => {
    setSelectedBlockIds(new Set());
    setSelectedSessionIds(new Set());
  };

  const isAllSelected = () => {
    const totalSessions = sessions.length;
    const totalBlocks = sessions.reduce((sum, s) => sum + s.blocks.length, 0);
    return selectedSessionIds.size === totalSessions && selectedBlockIds.size === totalBlocks;
  };

  const handleSessionToggle = (sessionId: string, blocks: Block[]) => {
    const newSelectedSessions = new Set(selectedSessionIds);
    const newSelectedBlocks = new Set(selectedBlockIds);
    
    if (newSelectedSessions.has(sessionId)) {
      newSelectedSessions.delete(sessionId);
      blocks.forEach(block => newSelectedBlocks.delete(block.id));
    } else {
      newSelectedSessions.add(sessionId);
      blocks.forEach(block => newSelectedBlocks.add(block.id));
    }
    
    setSelectedSessionIds(newSelectedSessions);
    setSelectedBlockIds(newSelectedBlocks);
  };

  const handleBlockToggle = (blockId: string, sessionId: string, sessionBlocks: Block[]) => {
    const newSelectedBlocks = new Set(selectedBlockIds);
    const newSelectedSessions = new Set(selectedSessionIds);
    
    if (newSelectedBlocks.has(blockId)) {
      newSelectedBlocks.delete(blockId);
      const remainingBlocks = sessionBlocks.filter(b => newSelectedBlocks.has(b.id));
      if (remainingBlocks.length === 0) {
        newSelectedSessions.delete(sessionId);
      }
    } else {
      newSelectedBlocks.add(blockId);
      if (sessionBlocks.every(b => newSelectedBlocks.has(b.id))) {
        newSelectedSessions.add(sessionId);
      }
    }
    
    setSelectedBlockIds(newSelectedBlocks);
    setSelectedSessionIds(newSelectedSessions);
  };

  const handleConfirm = () => {
    const selectedSessions = sessions
      .map(session => ({
        ...session,
        blocks: session.blocks.filter(block => selectedBlockIds.has(block.id))
      }))
      .filter(session => session.blocks.length > 0);

    const selectedBlocks = sessions
      .flatMap(s => s.blocks)
      .filter(block => selectedBlockIds.has(block.id));

    onConfirm(selectedSessions, selectedBlocks);
    setSelectedBlockIds(new Set());
    setSelectedSessionIds(new Set());
    onOpenChange(false);
  };

  const truncateContent = (content: string | string[], maxLength = 80) => {
    // Se for array, juntar os itens
    if (Array.isArray(content)) {
      return content.join(', ').substring(0, maxLength) + (content.join(', ').length > maxLength ? '...' : '');
    }
    
    // Remover tags HTML e extrair apenas o texto
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const hasSelection = selectedBlockIds.size > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle>Selecionar Conteúdo para Otimizar</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={isAllSelected() ? deselectAll : selectAll}
              className="shrink-0"
            >
              {isAllSelected() ? 'Desmarcar Tudo' : 'Selecionar Tudo'}
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {sessions.map((session) => {
              const isSessionSelected = selectedSessionIds.has(session.id);
              const sessionBlocksCount = session.blocks.length;
              const selectedInSession = session.blocks.filter(b => selectedBlockIds.has(b.id)).length;
              
              return (
                <div key={session.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSessionSelected}
                      onCheckedChange={() => handleSessionToggle(session.id, session.blocks)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{session.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {selectedInSession}/{sessionBlocksCount} blocos
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 pl-4 border-l-2 border-muted">
                        {session.blocks.map((block) => (
                          <div key={block.id} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 transition-colors">
                            <Checkbox
                              checked={selectedBlockIds.has(block.id)}
                              onCheckedChange={() => handleBlockToggle(block.id, session.id, session.blocks)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {getBlockIcon(block.type)}
                                <span className="text-sm font-medium text-muted-foreground">
                                  {getBlockTypeLabel(block.type)}
                                </span>
                              </div>
                              <p className="text-sm text-foreground/80">
                                {truncateContent(block.content)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!hasSelection}>
            Confirmar Seleção {hasSelection && `(${selectedBlockIds.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
