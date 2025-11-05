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
import { BlockPreview } from "@/components/copy-editor/BlockPreview";
import { Session } from "@/types/copy-editor";

interface CopyCardProps {
  id: string;
  title: string;
  subtitle?: string;
  creatorName?: string;
  creatorAvatar?: string | null;
  status?: 'draft' | 'published';
  folderId?: string | null;
  sessions?: Session[];
  onClick?: () => void;
}

const CopyCard = ({ id, title, subtitle, creatorName, creatorAvatar, status, folderId, sessions, onClick }: CopyCardProps) => {
  const { deleteCopy, renameCopy, moveCopy, duplicateCopy } = useDrive();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [newName, setNewName] = useState(title);
  const [isRenaming, setIsRenaming] = useState(false);

  const getFirstBlocks = () => {
    if (!sessions || sessions.length === 0) return [];
    const firstSession = sessions[0];
    return firstSession.blocks.slice(0, 4);
  };

  const firstBlocks = getFirstBlocks();

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
        {/* Header Section - Icon, Title and Menu */}
        <div className="p-3 pb-2 border-b bg-background/50">
          <div className="flex items-center gap-2">
            <div className="text-primary shrink-0">
              <FileText size={20} weight="duotone" />
            </div>
            
            <h3 className="flex-1 text-sm font-medium text-foreground truncate">
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
        </div>

        {/* Preview Section */}
        <div className="aspect-[4/3] bg-gradient-to-br from-background via-muted/10 to-muted/30 relative overflow-hidden">
          <div className="absolute inset-0 p-2 overflow-hidden">
            <div className="space-y-0.5 scale-[0.55] origin-top-left transform-gpu pointer-events-none" style={{ width: '165%' }}>
              {firstBlocks.length > 0 ? (
                firstBlocks.map((block) => (
                  <div key={block.id} className="opacity-90">
                    <BlockPreview block={block} />
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText size={48} weight="duotone" className="text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground/60">Sem conteúdo</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Bottom Fade Overlay */}
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
          
          {/* Status Badge - positioned absolute */}
          {status && (
            <Badge 
              variant="outline"
              className={`absolute top-2 right-2 text-[10px] px-1.5 py-0 h-5 font-medium ${
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
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background via-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-t border-border/50">
          <div className="flex items-center justify-between gap-2">
            {creatorName ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarImage src={creatorAvatar || undefined} />
                  <AvatarFallback className="text-[10px] bg-primary/10">
                    {creatorName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[10px] text-muted-foreground font-medium">
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
