import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DotsThree, Copy as CopyIcon, Trash, PencilSimple, ChatCircle, CaretUp, CaretDown } from 'phosphor-react';
import { Check } from 'lucide-react';
import { Session } from '@/types/copy-editor';
import { ContentBlock } from './ContentBlock';
import { CommentsButton } from './CommentsButton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCopyEditor } from '@/hooks/useCopyEditor';
import { useAuth } from '@/hooks/useAuth';

interface SessionBlockProps {
  session: Session;
  sessionIndex: number;
  totalSessions: number;
  onShowImageAI?: (blockId: string) => void;
}

interface DropZoneProps {
  sessionId: string;
  index: number;
}

const DropZone = ({ sessionId, index, onClickBackground }: DropZoneProps & { onClickBackground: () => void }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `dropzone-${sessionId}-${index}`,
    data: { sessionId, insertIndex: index },
  });

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => {
        e.stopPropagation();
        onClickBackground();
      }}
      className={`h-3 transition-all cursor-default ${isOver ? 'h-8' : ''}`}
    >
      {isOver && (
        <div className="h-1 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50 mx-4" />
      )}
    </div>
  );
};

export const SessionBlock = ({ session, sessionIndex, totalSessions, onShowImageAI }: SessionBlockProps) => {
  const { 
    updateSession, 
    removeSession, 
    duplicateSession, 
    selectBlock, 
    reorderSessions,
    isSelectionMode,
    selectedItems,
    toggleItemSelection
  } = useCopyEditor();
  const { user } = useAuth();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: session.id,
    data: { session },
  });

  const isSessionSelected = selectedItems.some(item => item.id === session.id && item.type === 'session');

  const handleSessionClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // If clicked on a block, ignore (block handles its own selection)
    if (target.closest('[data-block-id]')) return;
    
    // Deselect current block
    selectBlock(null);
  };

  const handleSessionClickForSelection = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // If clicked on a block, let the block handle it
    if (target.closest('[data-block-id]')) return;
    
    if (isSelectionMode) {
      e.stopPropagation();
      toggleItemSelection(session.id, 'session');
    } else {
      selectBlock(null);
    }
  };

  const handleAddComment = (text: string) => {
    const newComment = {
      id: crypto.randomUUID(),
      text,
      author: user?.user_metadata?.name || user?.email || 'Usuário',
      createdAt: new Date().toISOString(),
    };
    
    updateSession(session.id, {
      comments: [...(session.comments || []), newComment],
    });
  };

  const handleUpdateComment = (commentId: string, text: string) => {
    updateSession(session.id, {
      comments: (session.comments || []).map(c => 
        c.id === commentId ? { ...c, text } : c
      ),
    });
  };

  const handleDeleteComment = (commentId: string) => {
    updateSession(session.id, {
      comments: (session.comments || []).filter(c => c.id !== commentId),
    });
  };

  return (
    <div
      ref={setNodeRef}
      onClick={handleSessionClickForSelection}
      className={`
        relative p-6 rounded-xl bg-card space-y-4 transition-all group border border-border
        ${isOver ? 'border-2 border-dashed border-primary bg-primary/5 scale-[1.02]' : ''}
        ${isSelectionMode ? 'cursor-pointer hover:ring-2 hover:ring-primary/50' : ''}
        ${isSessionSelected ? 'ring-2 ring-green-500 bg-green-50/50 dark:bg-green-950/20' : ''}
      `}
    >
      {isSessionSelected && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-green-500 text-white rounded-full p-1">
            <Check className="h-3 w-3" />
          </div>
        </div>
      )}
      <div 
        className="flex items-center justify-between"
        onClick={(e) => {
          // Deselect if clicked on the header background (not on buttons/inputs)
          if (e.target === e.currentTarget) {
            selectBlock(null);
          }
        }}
      >
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
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h2
            className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-2 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
          >
            {session.title}
            <PencilSimple size={14} className="opacity-0 group-hover:opacity-100" />
          </h2>
        )}

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {sessionIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => reorderSessions(sessionIndex, sessionIndex - 1)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              title="Mover sessão para cima"
            >
              <CaretUp size={20} />
            </Button>
          )}
          
          {sessionIndex < totalSessions - 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => reorderSessions(sessionIndex, sessionIndex + 1)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              title="Mover sessão para baixo"
            >
              <CaretDown size={20} />
            </Button>
          )}

          <CommentsButton 
            comments={session.comments}
            onAddComment={handleAddComment}
            onUpdateComment={handleUpdateComment}
            onDeleteComment={handleDeleteComment}
          />

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
      </div>

      <div className="flex flex-col gap-1 min-h-[100px]" onClick={handleSessionClick}>
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
              <React.Fragment key={block.id}>
                <DropZone sessionId={session.id} index={index} onClickBackground={() => selectBlock(null)} />
                <ContentBlock block={block} sessionId={session.id} onShowImageAI={onShowImageAI} />
              </React.Fragment>
            ))}
            <DropZone sessionId={session.id} index={session.blocks.length} onClickBackground={() => selectBlock(null)} />
          </SortableContext>
        )}
      </div>
    </div>
  );
};
