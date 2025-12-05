import { useState, useMemo, memo, useRef, useCallback } from 'react';
import { Eye, Copy as CopyIcon, MoreVertical, Trash, FolderInput, Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PreviewModal } from '@/components/copy-editor/PreviewModal';
import { Copy } from '@/types/copy-editor';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MoveModal from '@/components/drive/MoveModal';
import { useAuth } from '@/hooks/useAuth';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { getCopyTypeLabel } from '@/lib/copy-types';
import { cn } from '@/lib/utils';

interface TemplateCardProps {
  template: Copy;
  onUse: (templateId: string) => void;
  onEdit: (templateId: string) => void;
  onDuplicate: (templateId: string) => void;
  onDelete: (templateId: string) => void;
  onMove: (templateId: string, targetFolderId: string | null) => Promise<void> | void;
  isCopying?: boolean;
  copyingId?: string | null;
  // Props de seleção
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const LONG_PRESS_DURATION = 500;
const MOVE_THRESHOLD = 10;

const TemplateCard = memo(({ 
  template, 
  onUse, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onMove,
  isCopying = false,
  copyingId = null,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: TemplateCardProps) => {
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Long press refs
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressStartPos = useRef<{ x: number; y: number } | null>(null);
  
  // Verificar se o usuário é o dono
  const isOwner = user?.id === template.created_by;
  const isThisCopying = isCopying && copyingId === template.id;

  // Memoizar extração de imagem para evitar recálculo a cada render
  const firstImage = useMemo(() => {
    if (!template.sessions || template.sessions.length === 0) return null;
    
    for (const session of template.sessions) {
      for (const block of session.blocks) {
        if (block.type === 'image' && block.config?.imageUrl) {
          return block.config.imageUrl;
        }
      }
    }
    return null;
  }, [template.sessions]);

  // Memoizar preview de conteúdo para evitar recálculo a cada render
  const previewContent = useMemo(() => {
    if (!template.sessions || template.sessions.length === 0) return null;
    const firstSession = template.sessions[0];
    const firstBlocks = firstSession.blocks.slice(0, 6);

    return firstBlocks.map((block) => {
      if (block.type === 'headline') {
        return (
          <h3 key={block.id} className="text-base font-bold line-clamp-1 mb-2">
            {block.content}
          </h3>
        );
      }
      if (block.type === 'subheadline') {
        return (
          <h4 key={block.id} className="text-sm font-semibold line-clamp-1 mb-1.5">
            {block.content}
          </h4>
        );
      }
      if (block.type === 'text') {
        return (
          <p key={block.id} className="text-xs text-muted-foreground/80 line-clamp-2 mb-1.5">
            {block.content}
          </p>
        );
      }
      if (block.type === 'list' && Array.isArray(block.content)) {
        return (
          <ul key={block.id} className="text-xs text-muted-foreground/80 space-y-0.5 mb-1.5">
            {block.content.slice(0, 2).map((item, i) => (
              <li key={i} className="line-clamp-1">• {item}</li>
            ))}
          </ul>
        );
      }
      return null;
    });
  }, [template.sessions]);

  // Memoizar contadores para evitar recálculo a cada render
  const { sessionsCount, blocksCount } = useMemo(() => ({
    sessionsCount: template.sessions?.length || 0,
    blocksCount: template.sessions?.reduce((acc, session) => acc + (session.blocks?.length || 0), 0) || 0
  }), [template.sessions]);

  // Long press handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (selectionMode) return;
    
    longPressStartPos.current = { x: e.clientX, y: e.clientY };
    
    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      window.dispatchEvent(new CustomEvent('activate-selection-mode'));
      onToggleSelect?.(template.id);
      longPressStartPos.current = null;
    }, LONG_PRESS_DURATION);
  }, [selectionMode, template.id, onToggleSelect]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (longPressStartPos.current && longPressTimer.current) {
      const dx = Math.abs(e.clientX - longPressStartPos.current.x);
      const dy = Math.abs(e.clientY - longPressStartPos.current.y);
      
      if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
        longPressStartPos.current = null;
      }
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressStartPos.current = null;
  }, []);

  const handleCardClick = useCallback(() => {
    if (selectionMode) {
      if (navigator.vibrate) navigator.vibrate(30);
      onToggleSelect?.(template.id);
    }
  }, [selectionMode, template.id, onToggleSelect]);

  return (
    <>
      <Card 
        className={cn(
          "h-full flex flex-col hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden",
          isSelected && "ring-2 ring-primary ring-offset-2 bg-primary/5",
          selectionMode && !isSelected && "hover:ring-2 hover:ring-primary/30",
          selectionMode && "cursor-pointer"
        )}
        onClick={handleCardClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Visual Preview Section */}
        <div className="relative h-36 md:h-48 bg-gradient-to-br from-background via-muted/10 to-muted/30 overflow-hidden border-b">
          {/* Checkbox de Seleção */}
          {selectionMode && (
            <div className="absolute top-2 left-2 z-20">
              <div className={cn(
                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                isSelected 
                  ? "bg-primary border-primary text-primary-foreground" 
                  : "bg-background/80 border-muted-foreground/40"
              )}>
                {isSelected && <Check className="h-3 w-3" />}
              </div>
            </div>
          )}

          {firstImage ? (
            // Thumbnail de imagem
            <>
              <img 
                src={firstImage} 
                alt={template.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
            </>
          ) : (
            // Fallback: Preview de texto ou logo
            <>
              <div className="absolute inset-0 p-4 md:p-6 scale-90 opacity-70 origin-top-left">
                <div className="space-y-1">
                  {previewContent}
                </div>
              </div>
              {/* Bottom Fade Overlay */}
              <div className="absolute bottom-0 inset-x-0 h-12 md:h-16 bg-gradient-to-t from-background/90 via-background/50 to-transparent pointer-events-none" />
            </>
          )}
          {/* Preview Icon Badge e Menu */}
          {!selectionMode && (
            <div className="absolute top-2 right-2 flex items-center gap-2">
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger 
                    onClick={(e) => e.stopPropagation()}
                    className="bg-background/80 backdrop-blur-sm p-1.5 rounded-md hover:bg-background transition-colors"
                  >
                    <MoreVertical size={16} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border-border z-50">
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMoveModalOpen(true);
                      }}
                    >
                      <FolderInput size={16} className="mr-2" />
                      Mover
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash size={16} className="mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <div className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md">
                <Eye className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        <CardContent className="flex-1 p-3 md:p-6">
          <div className="space-y-3">
            {/* Title */}
            <div>
              <h2 className="text-lg md:text-xl font-bold truncate">{template.title}</h2>
              {template.copy_type && (
                <p className="text-xs text-muted-foreground/60 mt-1 truncate">
                  {getCopyTypeLabel(template.copy_type)}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  {sessionsCount} {sessionsCount === 1 ? 'sessão' : 'sessões'} • {blocksCount} {blocksCount === 1 ? 'bloco' : 'blocos'}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs">
                Modelo
              </Badge>
            </div>
          </div>
        </CardContent>

        {!selectionMode && (
          <CardFooter className="p-3 md:p-4 pt-0 gap-1.5 md:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 min-w-0"
              onClick={(e) => {
                e.stopPropagation();
                setShowPreview(true);
              }}
            >
              <Eye className="h-4 w-4 xl:mr-2" />
              <span className="hidden xl:inline truncate">Visualizar</span>
            </Button>
            <Button
              size="sm"
              className="flex-1 min-w-0"
              onClick={(e) => {
                e.stopPropagation();
                onUse(template.id);
              }}
              disabled={isThisCopying}
            >
              {isThisCopying ? (
                <Loader2 className="h-4 w-4 animate-spin xl:mr-2" />
              ) : (
                <CopyIcon className="h-4 w-4 xl:mr-2" />
              )}
              <span className="hidden xl:inline truncate">
                {isThisCopying ? 'Copiando...' : 'Copiar'}
              </span>
            </Button>
          </CardFooter>
        )}
      </Card>

      <PreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        title={template.title}
        sessions={template.sessions}
      />

      <MoveModal
        open={moveModalOpen}
        onOpenChange={setMoveModalOpen}
        itemId={template.id}
        itemType="copy"
        currentFolderId={template.folder_id || null}
        onMove={async (targetFolderId) => {
          await onMove(template.id, targetFolderId);
        }}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={template.title}
        itemType="modelo"
        onConfirm={() => {
          onDelete(template.id);
          setDeleteDialogOpen(false);
        }}
      />
    </>
  );
});

export default TemplateCard;
