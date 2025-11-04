import { useState, useEffect } from 'react';
import { ChevronRight, Folder, Home } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
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
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);

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
