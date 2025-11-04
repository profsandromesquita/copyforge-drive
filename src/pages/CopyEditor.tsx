import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CopyEditorProvider, useCopyEditor } from '@/hooks/useCopyEditor';
import { EditorHeader } from '@/components/copy-editor/EditorHeader';
import { BlockToolbar } from '@/components/copy-editor/BlockToolbar';
import { SessionCanvas } from '@/components/copy-editor/SessionCanvas';
import { EditorSidebar } from '@/components/copy-editor/EditorSidebar';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Block } from '@/types/copy-editor';

const CopyEditorContent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loadCopy, setCopyId, addBlock, moveBlock, sessions } = useCopyEditor();
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (!id) {
      navigate('/dashboard');
      return;
    }

    setCopyId(id);
    loadCopy(id);
  }, [id, loadCopy, setCopyId, navigate]);

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
      let sessionId: string | undefined;
      let insertIndex: number | undefined;
      
      // If dropping over a block, insert before it
      if (overData?.block && overData?.sessionId) {
        sessionId = overData.sessionId;
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
          const blockIndex = session.blocks.findIndex(b => b.id === overData.block.id);
          insertIndex = blockIndex >= 0 ? blockIndex : undefined;
        }
      }
      // If dropping directly over a session
      else if (overData?.session?.id) {
        sessionId = overData.session.id;
        insertIndex = undefined; // Will add at the end
      }
      else if (over.id.toString().startsWith('session-')) {
        sessionId = over.id.toString();
        insertIndex = undefined;
      }

      if (sessionId) {
        addBlock(sessionId, {
          type: activeData.type,
          content: activeData.type === 'list' ? [''] : '',
          config: {},
        }, insertIndex);
      }
      return;
    }

    // Moving block between sessions or reordering
    if (activeData?.block) {
      const blockId = activeData.block.id;
      let toSessionId: string | undefined;
      let toIndex: number | undefined;
      
      // If dropping over a block
      if (overData?.block && overData?.sessionId) {
        toSessionId = overData.sessionId;
        const session = sessions.find(s => s.id === toSessionId);
        if (session) {
          const blockIndex = session.blocks.findIndex(b => b.id === overData.block.id);
          toIndex = blockIndex >= 0 ? blockIndex : session.blocks.length;
        }
      }
      // If dropping over a session
      else if (overData?.session?.id) {
        toSessionId = overData.session.id;
        toIndex = overData.session.blocks.length;
      }

      if (toSessionId !== undefined && toIndex !== undefined) {
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
      <div className="h-screen flex flex-col">
        <EditorHeader />
        <BlockToolbar />
        <div className="flex flex-1 overflow-hidden">
          <SessionCanvas />
          <EditorSidebar />
        </div>
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

const CopyEditor = () => {
  return (
    <CopyEditorProvider>
      <CopyEditorContent />
    </CopyEditorProvider>
  );
};

export default CopyEditor;
