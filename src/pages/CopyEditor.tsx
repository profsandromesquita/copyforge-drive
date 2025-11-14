import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CopyEditorProvider, useCopyEditor } from '@/hooks/useCopyEditor';
import { EditorHeader } from '@/components/copy-editor/EditorHeader';
import { BlockToolbar } from '@/components/copy-editor/BlockToolbar';
import { SessionCanvas } from '@/components/copy-editor/SessionCanvas';
import { EditorSidebar } from '@/components/copy-editor/EditorSidebar';
import { CopyEditorLoading } from '@/components/copy-editor/CopyEditorLoading';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Block } from '@/types/copy-editor';
import { InsufficientCreditsModal } from '@/components/credits/InsufficientCreditsModal';
import { useCopyGeneration } from '@/hooks/useCopyGeneration';

const CopyEditorContent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loadCopy, setCopyId, addBlock, moveBlock, sessions, isLoading, selectedBlockId } = useCopyEditor();
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [showImageAI, setShowImageAI] = useState(false);
  const [imageBlockId, setImageBlockId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const prevSelectedBlockId = useRef<string | null>(null);
  const { insufficientCredits, creditInfo, closeInsufficientCreditsModal } = useCopyGeneration();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (!id) {
      navigate('/drive');
      return;
    }

    setCopyId(id);
    loadCopy(id);
  }, [id, loadCopy, setCopyId, navigate]);

  // Abrir sidebar quando um bloco é selecionado
  useEffect(() => {
    if (selectedBlockId && selectedBlockId !== prevSelectedBlockId.current) {
      setSidebarOpen(true);
    }
    prevSelectedBlockId.current = selectedBlockId;
  }, [selectedBlockId]);

  // Abrir sidebar quando Image AI é ativado
  useEffect(() => {
    if (showImageAI) {
      setSidebarOpen(true);
    }
  }, [showImageAI]);

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
      
      // Check if dropping on a dropzone
      if (over.id.toString().startsWith('dropzone-')) {
        const parts = over.id.toString().split('-');
        sessionId = parts.slice(1, -1).join('-'); // Get session ID (handling UUIDs with dashes)
        insertIndex = parseInt(parts[parts.length - 1]); // Get index
      }
      // If dropping over a block, insert before it
      else if (overData?.block && overData?.sessionId) {
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
        insertIndex = undefined;
      }
      else if (over.id.toString().startsWith('session-')) {
        sessionId = over.id.toString();
        insertIndex = undefined;
      }

      if (sessionId) {
        const defaultContent = activeData.type === 'list' ? [''] : '';
        const defaultConfig = activeData.type === 'form' ? {
          formTitle: 'Preencha o formulário',
          formButtonText: 'Enviar',
          formButtonColor: '#22c55e',
          formFields: [
            {
              id: `field-${Date.now()}-1`,
              type: 'text' as const,
              label: 'Nome',
              placeholder: 'Digite seu nome',
              required: true,
            },
            {
              id: `field-${Date.now()}-2`,
              type: 'email' as const,
              label: 'E-mail',
              placeholder: 'seu@email.com',
              required: true,
            },
            {
              id: `field-${Date.now()}-3`,
              type: 'phone' as const,
              label: 'WhatsApp',
              placeholder: '(00) 00000-0000',
              required: true,
            },
          ],
        } : activeData.type === 'testimonial' ? {
          testimonialTitle: '',
          showPhotos: true,
          showRatings: true,
          testimonialItems: [],
        } : {};

        addBlock(sessionId, {
          type: activeData.type,
          content: defaultContent,
          config: defaultConfig,
        }, insertIndex);
      }
      return;
    }

    // Moving block between sessions or reordering
    if (activeData?.block) {
      const blockId = activeData.block.id;
      let toSessionId: string | undefined;
      let toIndex: number | undefined;
      
      // Check if dropping on a dropzone
      if (over.id.toString().startsWith('dropzone-')) {
        const parts = over.id.toString().split('-');
        toSessionId = parts.slice(1, -1).join('-');
        toIndex = parseInt(parts[parts.length - 1]);
      }
      // If dropping over a block
      else if (overData?.block && overData?.sessionId) {
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

  const handleShowImageAI = (blockId: string) => {
    setImageBlockId(blockId);
    setShowImageAI(true);
  };

  const handleCloseImageAI = () => {
    setShowImageAI(false);
    setImageBlockId(null);
  };

  // Mostrar loading enquanto carrega
  if (isLoading) {
    return <CopyEditorLoading />;
  }

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
        <div className="flex flex-1 overflow-hidden relative">
          <SessionCanvas onShowImageAI={handleShowImageAI} />
          <EditorSidebar 
            showImageAI={showImageAI} 
            imageBlockId={imageBlockId || undefined} 
            onCloseImageAI={handleCloseImageAI}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
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
      
      <InsufficientCreditsModal
        open={insufficientCredits}
        onOpenChange={closeInsufficientCreditsModal}
        currentBalance={creditInfo?.current_balance || 0}
        estimatedCost={creditInfo?.estimated_debit || 0}
      />
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
