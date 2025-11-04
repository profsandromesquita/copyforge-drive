import { Plus } from 'phosphor-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SessionBlock } from './SessionBlock';
import { Button } from '@/components/ui/button';
import { useCopyEditor } from '@/hooks/useCopyEditor';
import { useState } from 'react';
import { Block } from '@/types/copy-editor';

export const SessionCanvas = () => {
  const { sessions, addSession, addBlock, moveBlock } = useCopyEditor();
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.block) {
      setActiveBlock(active.data.current.block);
    } else if (active.data.current?.fromToolbar) {
      setActiveType(active.data.current.type);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveBlock(null);
    setActiveType(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Dragging from toolbar
    if (activeData?.fromToolbar) {
      let sessionId = overData?.session?.id;
      
      // If dropping over a block, get the session from that block
      if (!sessionId && overData?.sessionId) {
        sessionId = overData.sessionId;
      }
      
      // If dropping directly over a session
      if (!sessionId && over.id.toString().startsWith('session-')) {
        sessionId = over.id.toString();
      }

      if (sessionId) {
        addBlock(sessionId, {
          type: activeData.type,
          content: activeData.type === 'list' ? [''] : '',
          config: {},
        });
      }
      return;
    }

    // Moving block between sessions or reordering
    if (activeData?.block) {
      const blockId = activeData.block.id;
      let toSessionId = overData?.session?.id;
      
      // If dropping over a block, get the session from that block
      if (!toSessionId && overData?.sessionId) {
        toSessionId = overData.sessionId;
      }

      if (toSessionId) {
        const toIndex = overData?.session?.blocks.length || 0;
        moveBlock(blockId, toSessionId, toIndex);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">
              Nenhuma sessão criada ainda. Comece adicionando uma sessão!
            </p>
            <Button onClick={addSession}>
              <Plus size={20} className="mr-2" />
              Adicionar Sessão
            </Button>
          </div>
        ) : (
          <>
            <SortableContext
              items={sessions.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {sessions.map((session) => (
                <SessionBlock key={session.id} session={session} />
              ))}
            </SortableContext>

            <Button variant="outline" onClick={addSession} className="w-full">
              <Plus size={20} className="mr-2" />
              Adicionar Sessão
            </Button>
          </>
        )}
      </div>

      <DragOverlay>
        {activeBlock ? (
          <div className="p-4 rounded-lg border-2 border-primary bg-card shadow-lg">
            <span className="font-medium">{activeBlock.type}</span>
          </div>
        ) : activeType ? (
          <div className="p-4 rounded-lg border-2 border-primary bg-card shadow-lg">
            <span className="font-medium">{activeType}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
