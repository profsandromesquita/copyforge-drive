import { Plus, PlusCircle } from 'phosphor-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { SessionBlock } from './SessionBlock';
import { Button } from '@/components/ui/button';
import { useCopyEditor } from '@/hooks/useCopyEditor';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import { getImageFromDrop, getImageFromPaste, isValidImage, uploadImage } from '@/lib/image-upload';
import { EmptyStateCards } from './EmptyStateCards';

interface SessionCanvasProps {
  onShowImageAI?: (blockId: string) => void;
  onStartCreation?: () => void;
  onOpenChat?: () => void;
  activeTab?: 'ai' | 'chat';
  isInPromptStep?: boolean;
  isDraggingFromToolbar?: boolean;
}

export const SessionCanvas = ({ 
  onShowImageAI, 
  onStartCreation, 
  onOpenChat, 
  activeTab, 
  isInPromptStep,
  isDraggingFromToolbar 
}: SessionCanvasProps) => {
  const { sessions, addSession, addBlock, selectBlock } = useCopyEditor();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Click-outside handler to deselect blocks
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // If clicked on a block, ignore (block has its own handler)
    if (target.closest('[data-block-id]')) return;
    
    // If clicked inside a dropdown/popover/menu, ignore
    if (target.closest('[data-radix-popper-content-wrapper]')) return;
    if (target.closest('[role="menu"]')) return;
    if (target.closest('[role="dialog"]')) return;
    if (target.closest('.block-toolbar')) return;
    
    // Deselect
    selectBlock(null);
  }, [selectBlock]);

  // Droppable for empty canvas
  const { setNodeRef, isOver } = useDroppable({
    id: 'empty-canvas-dropzone',
    data: { isEmptyCanvas: true },
  });

  // Handler para drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // Handler para drag leave
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // Handler para drop
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = getImageFromDrop(e);
    if (!file) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, arraste uma imagem válida.',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidImage(file)) {
      toast({
        title: 'Imagem inválida',
        description: 'A imagem deve ser JPG, PNG, GIF ou WEBP e ter no máximo 10MB.',
        variant: 'destructive',
      });
      return;
    }

    await handleImageUpload(file);
  };

  // Handler para paste
  const handlePasteImage = async (e: ClipboardEvent) => {
    const file = getImageFromPaste(e);
    if (!file) return;

    if (!isValidImage(file)) {
      toast({
        title: 'Imagem inválida',
        description: 'A imagem deve ser JPG, PNG, GIF ou WEBP e ter no máximo 10MB.',
        variant: 'destructive',
      });
      return;
    }

    await handleImageUpload(file);
  };

  // Função para fazer upload e criar bloco
  const handleImageUpload = async (file: File) => {
    if (!user) return;

    setIsUploading(true);
    try {
      const imageUrl = await uploadImage(file, user.id);

      // Criar bloco de imagem na primeira sessão ou criar uma se não houver
      const targetSessionId = sessions.length > 0 ? sessions[0].id : null;
      
      if (!targetSessionId) {
        toast({
          title: 'Erro',
          description: 'Crie uma sessão antes de adicionar imagens.',
          variant: 'destructive',
        });
        return;
      }

      addBlock(targetSessionId, {
        type: 'image',
        content: '',
        config: {
          imageUrl,
          imageDescription: file.name,
          aspectRatio: '16/9',
          imageSize: 'md',
          roundedBorders: true,
        },
      });

      toast({
        title: 'Imagem adicionada!',
        description: 'A imagem foi carregada com sucesso.',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erro ao fazer upload',
        description: 'Não foi possível fazer upload da imagem. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Adicionar listener de paste
  useEffect(() => {
    const pasteListener = (e: ClipboardEvent) => {
      handlePasteImage(e);
    };

    document.addEventListener('paste', pasteListener);
    return () => document.removeEventListener('paste', pasteListener);
  }, [sessions, user]);

  // Render empty state with Overlay Drop Zone pattern
  const renderEmptyState = () => {
    return (
      <div className="flex-1 min-h-[60vh] relative">
        {/* CAMADA BASE: EmptyStateCards - sempre renderizado */}
        <div className={`transition-opacity duration-200 ${
          isDraggingFromToolbar ? 'opacity-20' : 'opacity-100'
        }`}>
          <EmptyStateCards 
            onStartCreation={onStartCreation}
            onOpenChat={onOpenChat}
            activeTab={activeTab}
            isInPromptStep={isInPromptStep}
          />
        </div>

        {/* CAMADA OVERLAY: Drop Zone - por cima de tudo */}
        <div 
          ref={setNodeRef}
          className={`absolute inset-0 z-50 flex items-center justify-center 
            rounded-xl border-2 border-dashed transition-all duration-200
            ${isDraggingFromToolbar 
              ? `pointer-events-auto ${isOver 
                  ? 'bg-primary/20 border-primary' 
                  : 'bg-background/80 border-muted-foreground/40'
                }` 
              : 'pointer-events-none opacity-0'
            }`}
        >
          {isDraggingFromToolbar && (
            <div className="text-center">
              <PlusCircle 
                size={64} 
                className={`mx-auto mb-4 ${isOver ? 'text-primary' : 'text-muted-foreground/50'}`} 
              />
              <p className={`text-lg font-semibold ${isOver ? 'text-primary' : 'text-muted-foreground'}`}>
                Solte aqui para começar
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                O primeiro bloco será criado automaticamente
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar relative min-h-full ${
        isDragging ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
      style={{ backgroundColor: 'rgb(245, 245, 245)' }}
      onClick={handleCanvasClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-background p-8 rounded-lg shadow-lg border-2 border-dashed border-primary">
            <p className="text-lg font-semibold">Solte a imagem aqui</p>
          </div>
        </div>
      )}
      
      {isUploading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="bg-background p-8 rounded-lg shadow-lg border">
            <p className="text-lg font-semibold">Fazendo upload da imagem...</p>
          </div>
        </div>
      )}
      {sessions.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <SortableContext
            items={sessions.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {sessions.map((session, index) => (
              <SessionBlock 
                key={session.id} 
                session={session} 
                sessionIndex={index}
                totalSessions={sessions.length}
                onShowImageAI={onShowImageAI} 
              />
            ))}
          </SortableContext>

          <Button variant="ghost" onClick={addSession} className="w-full">
            <Plus size={20} className="mr-2" />
            Adicionar Sessão
          </Button>
        </>
      )}
    </div>
  );
};
