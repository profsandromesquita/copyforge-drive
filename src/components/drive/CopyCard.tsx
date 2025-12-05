import { FileText, DotsThree, Trash, Pencil, ArrowsDownUp, Copy as CopyIcon, Check } from "phosphor-react";
import { useState, useMemo, memo, useRef, useCallback } from "react";
import { useDraggable } from "@dnd-kit/core";
import copyDriveLogo from '@/assets/copydrive-logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useDrive } from "@/hooks/useDrive";
import MoveModal from "./MoveModal";
import { BlockPreview } from "@/components/copy-editor/BlockPreview";
import { Session } from "@/types/copy-editor";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { RenameDialog } from "@/components/ui/rename-dialog";
import { getCopyTypeLabel } from "@/lib/copy-types";
import { cn } from "@/lib/utils";

interface CopyCardProps {
  id: string;
  title: string;
  subtitle?: string;
  creatorName?: string;
  creatorAvatar?: string | null;
  status?: 'draft' | 'published';
  folderId?: string | null;
  sessions?: Session[];
  copyType?: string;
  onClick?: () => void;
  // Props de seleção
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const LONG_PRESS_DURATION = 500; // ms
const MOVE_THRESHOLD = 10; // px

const CopyCard = memo(({ 
  id, 
  title, 
  subtitle, 
  creatorName, 
  creatorAvatar, 
  status, 
  folderId, 
  sessions, 
  copyType, 
  onClick,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: CopyCardProps) => {
  const { deleteCopy, renameCopy, moveCopy, duplicateCopy } = useDrive();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  // Long press refs
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressStartPos = useRef<{ x: number; y: number } | null>(null);

  // Memoizar extração de imagem para evitar recálculo a cada render
  const firstImage = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;
    
    for (const session of sessions) {
      for (const block of session.blocks) {
        if (block.type === 'image' && block.config?.imageUrl) {
          return block.config.imageUrl;
        }
      }
    }
    return null;
  }, [sessions]);

  // Memoizar extração de blocos para evitar recálculo a cada render
  const firstBlocks = useMemo(() => {
    if (!sessions || sessions.length === 0) return [];
    const firstSession = sessions[0];
    return firstSession.blocks.slice(0, 4);
  }, [sessions]);

  // DESATIVAR DRAG QUANDO EM SELECTION MODE
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: id,
    disabled: selectionMode,
    data: {
      type: 'copy',
      folderId: folderId,
    }
  });

  const handleRename = async (newName: string) => {
    setIsRenaming(true);
    await renameCopy(id, newName);
    setIsRenaming(false);
    setRenameDialogOpen(false);
  };

  const confirmDelete = async () => {
    await deleteCopy(id);
    setDeleteDialogOpen(false);
  };

  const handleMove = async (targetFolderId: string | null) => {
    await moveCopy(id, targetFolderId);
  };

  // Long press handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (selectionMode) return;
    
    longPressStartPos.current = { x: e.clientX, y: e.clientY };
    
    longPressTimer.current = setTimeout(() => {
      // Feedback tátil
      if (navigator.vibrate) navigator.vibrate(50);
      window.dispatchEvent(new CustomEvent('activate-selection-mode'));
      onToggleSelect?.(id);
      longPressStartPos.current = null;
    }, LONG_PRESS_DURATION);
  }, [selectionMode, id, onToggleSelect]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Cancelar se mover o dedo (scroll)
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

  const handleCardClick = (e: React.MouseEvent) => {
    if (selectionMode) {
      e.preventDefault();
      e.stopPropagation();
      if (navigator.vibrate) navigator.vibrate(30);
      onToggleSelect?.(id);
      return;
    }
    
    if (!isDragging && onClick) {
      onClick();
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        {...(selectionMode ? {} : { ...attributes, ...listeners })}
        onClick={handleCardClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ opacity: isDragging ? 0.5 : 1 }}
        className={cn(
          "group relative border rounded-lg transition-all duration-200 cursor-pointer overflow-hidden bg-card hover:shadow-md",
          selectionMode && "cursor-pointer",
          !selectionMode && (isDragging ? 'cursor-grabbing opacity-50' : 'cursor-grab'),
          isSelected && "ring-2 ring-primary ring-offset-2 bg-primary/5",
          selectionMode && !isSelected && "hover:ring-2 hover:ring-primary/30"
        )}
      >
        {/* Checkbox de Seleção */}
        {selectionMode && (
          <div className="absolute top-2 left-2 z-20">
            <div className={cn(
              "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
              isSelected 
                ? "bg-primary border-primary text-primary-foreground" 
                : "bg-background/80 border-muted-foreground/40"
            )}>
              {isSelected && <Check size={12} weight="bold" />}
            </div>
          </div>
        )}

        {/* Header Section - Icon, Title and Menu */}
        <div className="p-3 pb-2 border-b" style={{ backgroundColor: 'rgb(231, 237, 248)' }}>
          <div className="flex items-start gap-2">
            <div className={cn("text-primary shrink-0 mt-0.5", selectionMode && "ml-6")}>
              <FileText size={20} weight="duotone" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground truncate leading-tight">
                {title}
              </h3>
              {copyType && (
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                  {getCopyTypeLabel(copyType)}
                </p>
              )}
            </div>
            
            {!selectionMode && (
              <DropdownMenu>
                <DropdownMenuTrigger 
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-accent"
                >
                  <DotsThree size={20} weight="bold" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border z-50">
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameDialogOpen(true);
                    }}
                  >
                    <Pencil size={16} className="mr-2" />
                    Renomear
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateCopy(id);
                    }}
                  >
                    <CopyIcon size={16} className="mr-2" />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMoveModalOpen(true);
                    }}
                  >
                    <ArrowsDownUp size={16} className="mr-2" />
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
          </div>
        </div>

        {/* Preview Section */}
        <div className="aspect-[4/3] bg-gradient-to-br from-background via-muted/10 to-muted/30 relative overflow-hidden px-4">
          {firstImage ? (
            // Thumbnail de imagem
            <>
              <img 
                src={firstImage} 
                alt={title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-40" />
            </>
          ) : firstBlocks.length > 0 ? (
            // Preview de blocos
            <>
              <div className="absolute inset-x-4 top-0 bottom-0 p-2 overflow-hidden">
                <div className="space-y-0.5 scale-[0.55] origin-top-left transform-gpu pointer-events-none" style={{ width: '165%' }}>
                  {firstBlocks.map((block) => (
                    <div key={block.id} className="opacity-90">
                      <BlockPreview block={block} />
                    </div>
                  ))}
                </div>
              </div>
              {/* Bottom Fade Overlay */}
              <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
            </>
          ) : (
            // Fallback: Logo CopyDrive
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src={copyDriveLogo} 
                alt="CopyDrive"
                className="w-24 h-24 object-contain opacity-30"
              />
            </div>
          )}
          
          {/* Status Badge - positioned absolute */}
          {status && (
            <Badge 
              variant="outline"
              className={`absolute top-2 right-2 text-[10px] px-1.5 py-0 h-5 font-medium z-10 ${
                status === 'published' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40' 
                  : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              {status === 'published' ? 'Publicado' : 'Rascunho'}
            </Badge>
          )}
        </div>

        {/* Footer - Appears on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(to top, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.45) 30%, rgba(0, 0, 0, 0.25) 55%, rgba(0, 0, 0, 0.1) 75%, transparent 100%)', paddingTop: '2rem' }}>
          <div className="flex items-center justify-between gap-2">
            {creatorName ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarImage src={creatorAvatar || undefined} />
                  <AvatarFallback className="text-[10px] bg-white/20 text-white">
                    {creatorName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[10px] text-white font-medium drop-shadow-sm">
                  {creatorName}
                </span>
              </div>
            ) : (
              <div />
            )}
            
            {subtitle && (
              <span className="text-[10px] text-white/90 shrink-0 drop-shadow-sm">
                {subtitle}
              </span>
            )}
          </div>
        </div>
      </div>

      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        currentName={title}
        onRename={handleRename}
        isRenaming={isRenaming}
        title="Renomear Copy"
      />

      <MoveModal
        open={moveModalOpen}
        onOpenChange={setMoveModalOpen}
        itemId={id}
        itemType="copy"
        currentFolderId={folderId || null}
        onMove={handleMove}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={title}
        itemType="copy"
        onConfirm={confirmDelete}
      />
    </>
  );
});

export default CopyCard;
