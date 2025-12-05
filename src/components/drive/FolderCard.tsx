import { Folder, DotsThree, Trash, Pencil, ArrowsDownUp, Check } from "phosphor-react";
import { useState, useRef, useCallback, memo } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDrive } from "@/hooks/useDrive";
import MoveModal from "./MoveModal";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { RenameDialog } from "@/components/ui/rename-dialog";
import { cn } from "@/lib/utils";

interface FolderCardProps {
  id: string;
  title: string;
  folderId?: string | null;
  onClick?: () => void;
  // Props de seleção
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const LONG_PRESS_DURATION = 500;
const MOVE_THRESHOLD = 10;

const FolderCard = memo(({ 
  id, 
  title, 
  folderId, 
  onClick,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: FolderCardProps) => {
  const { deleteFolder, renameFolder, moveFolder } = useDrive();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  // Long press refs
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressStartPos = useRef<{ x: number; y: number } | null>(null);

  // DESATIVAR DRAG/DROP QUANDO EM SELECTION MODE
  const { attributes, listeners, setNodeRef: setDragNodeRef, isDragging } = useDraggable({
    id: id,
    disabled: selectionMode,
    data: {
      type: 'folder',
      folderId: folderId,
    }
  });

  const { setNodeRef: setDropNodeRef, isOver } = useDroppable({
    id: id,
    disabled: selectionMode,
    data: {
      type: 'folder',
    }
  });

  const setNodeRef = (node: HTMLElement | null) => {
    setDragNodeRef(node);
    setDropNodeRef(node);
  };

  const handleRename = async (newName: string) => {
    setIsRenaming(true);
    await renameFolder(id, newName);
    setIsRenaming(false);
    setRenameDialogOpen(false);
  };

  const confirmDelete = async () => {
    await deleteFolder(id);
    setDeleteDialogOpen(false);
  };

  const handleMove = async (targetFolderId: string | null) => {
    await moveFolder(id, targetFolderId);
  };

  // Long press handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (selectionMode) return;
    
    longPressStartPos.current = { x: e.clientX, y: e.clientY };
    
    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      window.dispatchEvent(new CustomEvent('activate-selection-mode'));
      onToggleSelect?.(id);
      longPressStartPos.current = null;
    }, LONG_PRESS_DURATION);
  }, [selectionMode, id, onToggleSelect]);

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
        className={cn(
          "group relative flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:bg-accent/50",
          isOver && !selectionMode && "ring-2 ring-primary shadow-lg scale-102",
          selectionMode && "cursor-pointer",
          !selectionMode && (isDragging ? 'cursor-grabbing opacity-50' : 'cursor-grab'),
          isSelected && "ring-2 ring-primary ring-offset-2 bg-primary/5",
          selectionMode && !isSelected && "hover:ring-2 hover:ring-primary/30"
        )}
        style={{
          backgroundColor: 'rgb(231, 237, 248)',
          opacity: isDragging ? 0.5 : 1
        }}
      >
        {/* Checkbox de Seleção - Sempre renderizado, visibilidade controlada por CSS */}
        <div 
          className={cn(
            "transition-opacity duration-200 shrink-0",
            selectionMode 
              ? "opacity-100" 
              : "opacity-0 group-hover:opacity-50 hover:!opacity-100"
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (!selectionMode) {
              if (navigator.vibrate) navigator.vibrate(50);
              window.dispatchEvent(new CustomEvent('activate-selection-mode'));
            }
            onToggleSelect?.(id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className={cn(
            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer hover:scale-110",
            isSelected 
              ? "bg-primary border-primary text-primary-foreground" 
              : "bg-background/80 border-muted-foreground/40 hover:border-primary/60"
          )}>
            {isSelected && <Check size={12} weight="bold" />}
          </div>
        </div>

        <div className="text-muted-foreground shrink-0">
          <Folder size={24} weight="fill" />
        </div>
        
        <span className="flex-1 text-sm font-medium text-foreground truncate">
          {title}
        </span>
        
        {!selectionMode && (
          <DropdownMenu>
            <DropdownMenuTrigger 
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
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

      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        currentName={title}
        onRename={handleRename}
        isRenaming={isRenaming}
        title="Renomear Pasta"
      />

      <MoveModal
        open={moveModalOpen}
        onOpenChange={setMoveModalOpen}
        itemId={id}
        itemType="folder"
        currentFolderId={folderId || null}
        onMove={handleMove}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={title}
        itemType="pasta"
        onConfirm={confirmDelete}
      />
    </>
  );
});

export default FolderCard;
