import { useState, useEffect } from 'react';
import { ChevronRight, Folder, Home, Plus, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CopyDestinationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (folderId: string | null) => void;
  workspaceId: string;
  projectId: string | null;
}

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
}

export const CopyDestinationModal = ({
  open,
  onOpenChange,
  onConfirm,
  workspaceId,
  projectId,
}: CopyDestinationModalProps) => {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchFolders(null);
    }
  }, [open, workspaceId, projectId]);

  const fetchFolders = async (parentId: string | null) => {
    setLoading(true);
    try {
      let query = supabase
        .from('folders')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name');

      if (projectId) {
        query = query.eq('project_id', projectId);
      } else {
        query = query.is('project_id', null);
      }

      if (parentId) {
        query = query.eq('parent_id', parentId);
      } else {
        query = query.is('parent_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error('Erro ao carregar pastas');
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = async (folder: Folder | null) => {
    if (folder) {
      setCurrentFolderId(folder.id);
      setBreadcrumbs([...breadcrumbs, folder]);
      await fetchFolders(folder.id);
    } else {
      setCurrentFolderId(null);
      setBreadcrumbs([]);
      await fetchFolders(null);
    }
  };

  const navigateToBreadcrumb = async (index: number) => {
    if (index === -1) {
      // Root
      setCurrentFolderId(null);
      setBreadcrumbs([]);
      await fetchFolders(null);
    } else {
      const folder = breadcrumbs[index];
      setCurrentFolderId(folder.id);
      setBreadcrumbs(breadcrumbs.slice(0, index + 1));
      await fetchFolders(folder.id);
    }
  };

  const handleConfirm = () => {
    onConfirm(currentFolderId);
    onOpenChange(false);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !workspaceId || !user?.id) return;
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          name: newFolderName.trim(),
          workspace_id: workspaceId,
          project_id: projectId,
          parent_id: currentFolderId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Pasta criada com sucesso!');
      await navigateToFolder(data);
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Erro ao criar pasta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Selecionar Destino</DialogTitle>
          <DialogDescription>
            Escolha onde deseja salvar a cópia
          </DialogDescription>
        </DialogHeader>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto">
          <button
            onClick={() => navigateToBreadcrumb(-1)}
            className="hover:text-foreground flex items-center gap-1"
          >
            <Home className="h-4 w-4" />
            Raiz
          </button>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4" />
              <button
                onClick={() => navigateToBreadcrumb(index)}
                className="hover:text-foreground"
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>

        {/* Header com contador e botão Nova Pasta */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {folders.length} {folders.length === 1 ? 'pasta' : 'pastas'}
          </span>
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

        {/* Folders List */}
        <ScrollArea className="h-[300px] border rounded-md p-4">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center">
              Carregando...
            </p>
          ) : folders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">
              Nenhuma pasta neste local
            </p>
          ) : (
            <div className="space-y-2">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => navigateToFolder(folder)}
                  className="w-full flex items-center gap-2 p-2 hover:bg-accent rounded-md text-left transition-colors"
                >
                  <Folder className="h-5 w-5 text-primary" />
                  <span className="flex-1">{folder.name}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Copiar Aqui
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
