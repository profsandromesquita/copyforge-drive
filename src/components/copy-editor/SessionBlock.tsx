import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DotsThree, Copy as CopyIcon, Trash, PencilSimple } from 'phosphor-react';
import { Session } from '@/types/copy-editor';
import { ContentBlock } from './ContentBlock';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCopyEditor } from '@/hooks/useCopyEditor';

interface SessionBlockProps {
  session: Session;
}

interface DropZoneProps {
  sessionId: string;
  index: number;
}

const DropZone = ({ sessionId, index }: DropZoneProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `dropzone-${sessionId}-${index}`,
    data: { sessionId, insertIndex: index },
  });

  return (
    <div
      ref={setNodeRef}
      className={`h-3 transition-all ${isOver ? 'h-8' : ''}`}
    >
      {isOver && (
        <div className="h-1 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50 mx-4" />
      )}
    </div>
  );
};

export const SessionBlock = ({ session }: SessionBlockProps) => {
  const { updateSession, removeSession, duplicateSession, selectBlock } = useCopyEditor();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: session.id,
    data: { session },
  });

  const handleSessionClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the session container (not on blocks)
    if (e.target === e.currentTarget) {
      selectBlock(null);
    }
  };

  return (
    <div
      ref={setNodeRef}
      onClick={handleSessionClick}
      className={`
        p-6 rounded-xl border-2 border-dashed bg-card/50 space-y-4 transition-all
        ${isOver ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border'}
      `}
    >
      <div className="flex items-center justify-between">
        {isEditingTitle ? (
          <Input
            value={session.title}
            onChange={(e) => updateSession(session.id, { title: e.target.value })}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setIsEditingTitle(false);
            }}
            className="max-w-xs"
            autoFocus
          />
        ) : (
          <h2
            className="text-sm font-medium text-orange-400/70 cursor-pointer hover:text-orange-400 flex items-center gap-2 transition-colors"
            onClick={() => setIsEditingTitle(true)}
          >
            {session.title}
            <PencilSimple size={14} className="opacity-0 group-hover:opacity-100" />
          </h2>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <DotsThree size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
              <PencilSimple size={16} className="mr-2" />
              Renomear
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => duplicateSession(session.id)}>
              <CopyIcon size={16} className="mr-2" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => removeSession(session.id)}
              className="text-destructive"
            >
              <Trash size={16} className="mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-1 min-h-[100px]" onClick={handleSessionClick}>
        {session.blocks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Arraste blocos da toolbar para começar
          </div>
        ) : (
          <SortableContext
            items={session.blocks.map(b => b.id)}
            strategy={verticalListSortingStrategy}
          >
            {session.blocks.map((block, index) => (
              <div key={block.id}>
                <DropZone sessionId={session.id} index={index} />
                <ContentBlock block={block} sessionId={session.id} />
              </div>
            ))}
            <DropZone sessionId={session.id} index={session.blocks.length} />
          </SortableContext>
        )}
      </div>
    </div>
  );
};
