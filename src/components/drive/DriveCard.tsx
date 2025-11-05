import { Folder, FileText, FunnelSimple, DotsThree, Trash, Pencil } from "phosphor-react";
import { useState } from "react";
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

type CardType = "folder" | "copy" | "funnel";

interface DriveCardProps {
  id: string;
  type: CardType;
  title: string;
  subtitle?: string;
  creatorName?: string;
  creatorAvatar?: string | null;
  status?: 'draft' | 'published';
  onClick?: () => void;
}

const iconMap = {
  folder: { icon: Folder, color: "text-primary" },
  copy: { icon: FileText, color: "text-foreground" },
  funnel: { icon: FunnelSimple, color: "text-foreground" },
};

const DriveCard = ({ id, type, title, subtitle, creatorName, creatorAvatar, status, onClick }: DriveCardProps) => {
  const { icon: Icon, color } = iconMap[type];
  const { deleteFolder, deleteCopy, renameFolder, renameCopy } = useDrive();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState(title);
  const [isRenaming, setIsRenaming] = useState(false);

  const handleRename = async () => {
    if (!newName.trim()) return;
    
    setIsRenaming(true);
    if (type === 'folder') {
      await renameFolder(id, newName.trim());
    } else if (type === 'copy') {
      await renameCopy(id, newName.trim());
    }
    setIsRenaming(false);
    setRenameDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Deseja realmente excluir "${title}"?`)) return;
    
    if (type === 'folder') {
      await deleteFolder(id);
    } else if (type === 'copy') {
      await deleteCopy(id);
    }
  };

  return (
    <>
      <div
        onClick={onClick}
        className={`group relative border rounded-xl p-3 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden h-[100px] flex flex-col ${
          type === 'folder' 
            ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-800/40 hover:border-blue-300 dark:hover:border-blue-700' 
            : 'bg-card border-border/50 hover:border-primary/30'
        }`}
      >
        {/* Subtle gradient overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
          type === 'folder' ? 'from-blue-100/30 to-transparent dark:from-blue-900/20' : 'from-primary/5 to-transparent'
        }`} />
        
        <div className="relative flex-1 flex flex-col">
          <div className="flex items-start gap-2.5">
            {/* Icon */}
            <div className="text-muted-foreground/60 shrink-0 transition-transform duration-300 group-hover:scale-110">
              <Icon size={24} weight="duotone" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-xs text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                {title}
              </h3>
            </div>
            
            {/* Menu */}
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

          {/* Footer - Avatar and status badge in same line */}
          <div className="pt-2 mt-auto border-t border-border/30">
            <div className="flex items-center justify-between gap-2">
              {type === 'copy' && creatorName ? (
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarImage src={creatorAvatar || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {creatorName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <span className="text-[10px] text-muted-foreground">
                  {subtitle || (type === 'folder' ? 'Pasta' : 'Copy')}
                </span>
              )}
              
              {subtitle && type === 'copy' && (
                <span className="text-[10px] text-muted-foreground/70 shrink-0">
                  {subtitle}
                </span>
              )}
              
              {type === 'copy' && status && (
                <Badge 
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 h-5 font-medium shrink-0 ml-auto ${
                    status === 'published' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40' 
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {status === 'published' ? 'Publicado' : 'Rascunho'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Renomear {type === 'folder' ? 'Pasta' : 'Copy'}</DialogTitle>
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
    </>
  );
};

export default DriveCard;
