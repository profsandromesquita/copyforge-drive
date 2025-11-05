import { FileText, DotsThree, Trash, Pencil, ArrowsDownUp, Copy as CopyIcon } from "phosphor-react";
import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useDrive } from "@/hooks/useDrive";
import MoveModal from "./MoveModal";

interface CopyCardProps {
  id: string;
  title: string;
  subtitle?: string;
  creatorName?: string;
  creatorAvatar?: string | null;
  status?: 'draft' | 'published';
  folderId?: string | null;
  onClick?: () => void;
}

const CopyCard = ({ id, title, subtitle, creatorName, creatorAvatar, status, folderId, onClick }: CopyCardProps) => {
  const { deleteCopy, renameCopy, moveCopy, duplicateCopy } = useDrive();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [newName, setNewName] = useState(title);
  const [isRenaming, setIsRenaming] = useState(false);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: id,
    data: {
      type: 'copy',
      folderId: folderId,
    }
  });

  const handleRename = async () => {
    if (!newName.trim()) return;
    
    setIsRenaming(true);
    await renameCopy(id, newName.trim());
    setIsRenaming(false);
    setRenameDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Deseja realmente excluir "${title}"?`)) return;
    await deleteCopy(id);
  };

  const handleMove = async (targetFolderId: string | null) => {
    await moveCopy(id, targetFolderId);
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
        style={{ opacity: isDragging ? 0.5 : 1 }}
        className={`group relative border rounded-lg transition-all duration-200 cursor-pointer overflow-hidden bg-card hover:shadow-md ${
          isDragging ? 'cursor-grabbing opacity-50' : 'cursor-grab'
        }`}
      >
        {/* Preview Section - Placeholder com texto */}
        <div className="aspect-[4/3] bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center border-b">
          <div className="text-center p-6 max-w-[90%]">
            <FileText size={48} weight="duotone" className="text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-xs text-muted-foreground/60 line-clamp-3 leading-relaxed">
              {title}
            </p>
          </div>
        </div>

        {/* Header Section */}
        <div className="p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div className="text-muted-foreground/60 shrink-0 mt-0.5">
              <FileText size={16} weight="duotone" />
            </div>
            
            <h3 className="flex-1 text-sm font-medium text-foreground line-clamp-2 leading-snug">
              {title}
            </h3>
            
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
                    handleDelete();
                  }}
                >
                  <Trash size={16} className="mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {status && (
            <Badge 
              variant="outline"
              className={`text-[10px] px-1.5 py-0 h-5 font-medium w-fit ${
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
        <div className="absolute bottom-0 left-0 right-0 p-3 pt-4 bg-gradient-to-t from-background via-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center justify-between gap-2">
            {creatorName ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarImage src={creatorAvatar || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {creatorName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[10px] text-muted-foreground">
                  {creatorName}
                </span>
              </div>
            ) : (
              <div />
            )}
            
            {subtitle && (
              <span className="text-[10px] text-muted-foreground/70 shrink-0">
                {subtitle}
              </span>
            )}
          </div>
        </div>
      </div>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Renomear Copy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Novo Nome</Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRename();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
              disabled={isRenaming}
            >
              Cancelar
            </Button>
            <Button onClick={handleRename} disabled={isRenaming || !newName.trim()}>
              {isRenaming ? 'Renomeando...' : 'Renomear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MoveModal
        open={moveModalOpen}
        onOpenChange={setMoveModalOpen}
        itemId={id}
        itemType="copy"
        currentFolderId={folderId || null}
        onMove={handleMove}
      />
    </>
  );
};

export default CopyCard;
