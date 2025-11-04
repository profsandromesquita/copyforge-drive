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
import { useDrive } from "@/hooks/useDrive";

type CardType = "folder" | "copy" | "funnel";

interface DriveCardProps {
  id: string;
  type: CardType;
  title: string;
  subtitle?: string;
  onClick?: () => void;
}

const iconMap = {
  folder: { icon: Folder, color: "text-primary" },
  copy: { icon: FileText, color: "text-foreground" },
  funnel: { icon: FunnelSimple, color: "text-foreground" },
};

const DriveCard = ({ id, type, title, subtitle, onClick }: DriveCardProps) => {
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
        className="group relative bg-card border border-border/50 rounded-xl p-4 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
      >
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative flex items-start gap-3">
          {/* Icon */}
          <div className={`${color} shrink-0 transition-transform duration-300 group-hover:scale-110`}>
            <Icon size={28} weight="duotone" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground mb-0.5 line-clamp-1 group-hover:text-primary transition-colors">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>
            )}
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
