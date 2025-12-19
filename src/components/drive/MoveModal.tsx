import { useState, useEffect } from "react";
import { Folder } from "phosphor-react";
import { Plus, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useProject } from "@/hooks/useProject";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface FolderOption {
  id: string;
  name: string;
  parent_id: string | null;
}

interface MoveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemType: "copy" | "folder";
  currentFolderId: string | null;
  onMove: (targetFolderId: string | null) => Promise<void>;
}

const MoveModal = ({ open, onOpenChange, itemId, itemType, currentFolderId, onMove }: MoveModalProps) => {
  const { activeWorkspace } = useWorkspace();
  const { activeProject } = useProject();
  const { user } = useAuth();
  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  
  // Estados para criar pasta inline
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchFolders();
      setSelectedFolder(null);
      // Reset do formulário de criação
      setIsCreatingFolder(false);
      setNewFolderName('');
    }
  }, [open, activeWorkspace?.id, activeProject?.id]);

  const fetchFolders = async () => {
    if (!activeWorkspace?.id) return;

    setLoading(true);
    try {
      const query = supabase
        .from('folders')
        .select('id, name, parent_id')
        .eq('workspace_id', activeWorkspace.id)
        .order('name');

      if (activeProject?.id) {
        query.eq('project_id', activeProject.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Se estiver movendo uma pasta, remover ela mesma e suas subpastas da lista
      let availableFolders = data || [];
      if (itemType === 'folder') {
        availableFolders = availableFolders.filter(f => f.id !== itemId);
        // TODO: Remover subpastas também (implementação futura)
      }

      setFolders(availableFolders);
    } catch (error) {
      console.error('Error fetching folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !activeWorkspace?.id || !user?.id) return;
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          name: newFolderName.trim(),
          workspace_id: activeWorkspace.id,
          project_id: activeProject?.id || null,
          parent_id: null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Pasta criada com sucesso!');
      
      // REQUISITO UX: Auto-seleciona a pasta criada
      setSelectedFolder(data.id);
      
      // Atualiza a lista de pastas
      await fetchFolders();
      
      // Limpa o formulário
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Erro ao criar pasta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMove = async () => {
    setIsMoving(true);
    try {
      await onMove(selectedFolder);
      onOpenChange(false);
    } catch (error) {
      console.error('Error moving item:', error);
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>
            Mover {itemType === 'folder' ? 'Pasta' : 'Copy'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Header com botão Nova Pasta */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              Selecione o destino:
            </p>
            {!isCreatingFolder && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreatingFolder(true)}
                className="text-primary h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nova Pasta
              </Button>
            )}
          </div>

          {/* Formulário inline para criar pasta */}
          {isCreatingFolder && (
            <div className="flex gap-2 mb-3 p-2 bg-muted/50 rounded-md">
              <Input
                placeholder="Nome da pasta"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFolderName.trim()) handleCreateFolder();
                  if (e.key === 'Escape') {
                    setIsCreatingFolder(false);
                    setNewFolderName('');
                  }
                }}
                autoFocus
                disabled={isSubmitting}
                className="h-9"
              />
              <Button 
                size="sm" 
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || isSubmitting}
                className="h-9"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar'}
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }}
                disabled={isSubmitting}
                className="h-9 px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <ScrollArea className="h-[300px] border rounded-lg">
            {/* Raiz do Drive */}
            <div
              onClick={() => setSelectedFolder(null)}
              className={`flex items-center gap-3 p-3 hover:bg-accent cursor-pointer transition-colors ${
                selectedFolder === null ? 'bg-accent border-l-2 border-primary' : ''
              }`}
            >
              <Folder size={20} weight="duotone" className="text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">Raiz do Drive</span>
            </div>

            {/* Lista de pastas */}
            {loading ? (
              <div className="p-3 space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : folders.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhuma pasta disponível
                </p>
              </div>
            ) : (
              folders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`flex items-center gap-3 p-3 hover:bg-accent cursor-pointer transition-colors ${
                    selectedFolder === folder.id ? 'bg-accent border-l-2 border-primary' : ''
                  } ${
                    folder.id === currentFolderId ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Folder size={20} weight="duotone" className="text-primary shrink-0" />
                  <span className="text-sm">{folder.name}</span>
                  {folder.id === currentFolderId && (
                    <span className="text-xs text-muted-foreground ml-auto">(atual)</span>
                  )}
                </div>
              ))
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isMoving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleMove}
            disabled={isMoving || selectedFolder === currentFolderId}
          >
            {isMoving ? 'Movendo...' : 'Mover'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveModal;
