import { Folder, DotsThree, Trash, Pencil, ArrowsDownUp } from "phosphor-react";
import { useState } from "react";
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

interface FolderCardProps {
  id: string;
  title: string;
  folderId?: string | null;
  onClick?: () => void;
}

const FolderCard = ({ id, title, folderId, onClick }: FolderCardProps) => {
  const { deleteFolder, renameFolder, moveFolder } = useDrive();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  const { attributes, listeners, setNodeRef: setDragNodeRef, isDragging } = useDraggable({
    id: id,
    data: {
      type: 'folder',
      folderId: folderId,
    }
  });

  const { setNodeRef: setDropNodeRef, isOver } = useDroppable({
    id: id,
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

  const handleCardClick = (e: React.MouseEvent) => {
    if (!isDragging && onClick) {
      onClick();
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        onClick={handleCardClick}
        className={`group relative flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:bg-accent/50 ${
          isOver ? 'ring-2 ring-primary shadow-lg scale-102' : ''
        } ${isDragging ? 'cursor-grabbing opacity-50' : 'cursor-grab'}`}
        style={{
          backgroundColor: 'rgb(231, 237, 248)',
          opacity: isDragging ? 0.5 : 1
        }}
      >
        <div className="text-muted-foreground shrink-0">
          <Folder size={24} weight="fill" />
        </div>
        
        <span className="flex-1 text-sm font-medium text-foreground truncate">
          {title}
        </span>
        
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
};

export default FolderCard;
