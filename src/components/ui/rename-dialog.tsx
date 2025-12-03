import { useState, useEffect } from "react";
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

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  onRename: (newName: string) => void | Promise<void>;
  isRenaming?: boolean;
  title?: string;
  label?: string;
}

export const RenameDialog = ({
  open,
  onOpenChange,
  currentName,
  onRename,
  isRenaming = false,
  title = "Renomear",
  label = "Novo Nome",
}: RenameDialogProps) => {
  const [newName, setNewName] = useState(currentName);

  // Sync with currentName when dialog opens
  useEffect(() => {
    if (open) {
      setNewName(currentName);
    }
  }, [open, currentName]);

  const handleRename = async () => {
    if (!newName.trim()) return;
    await onRename(newName.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rename-input">{label}</Label>
            <Input
              id="rename-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
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
            onClick={() => onOpenChange(false)}
            disabled={isRenaming}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleRename}
            disabled={isRenaming || !newName.trim()}
          >
            {isRenaming ? "Renomeando..." : "Renomear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
