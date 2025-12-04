import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';
import { useProject } from './useProject';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Folder {
  id: string;
  workspace_id: string;
  project_id: string | null;
  parent_id: string | null;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Copy {
  id: string;
  title: string;
  workspace_id: string;
  project_id: string | null;
  folder_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: {
    name: string;
    avatar_url: string | null;
  };
}

interface DriveContextType {
  folders: Folder[];
  copies: Copy[];
  currentFolder: Folder | null;
  breadcrumbs: Folder[];
  loading: boolean;
  navigateToFolder: (folderId: string | null) => void;
  createFolder: (name: string) => Promise<void>;
  createCopy: (title: string, copyType?: string) => Promise<Copy | null>;
  deleteFolder: (folderId: string) => Promise<void>;
  deleteCopy: (copyId: string) => Promise<void>;
  renameFolder: (folderId: string, newName: string) => Promise<void>;
  renameCopy: (copyId: string, newTitle: string) => Promise<void>;
  moveFolder: (folderId: string, targetFolderId: string | null) => Promise<void>;
  moveCopy: (copyId: string, targetFolderId: string | null) => Promise<void>;
  duplicateCopy: (copyId: string) => Promise<void>;
  refreshDrive: () => Promise<void>;
}

const DriveContext = createContext<DriveContextType | undefined>(undefined);

export const DriveProvider = ({ children }: { children: ReactNode }) => {
  const { activeWorkspace } = useWorkspace();
  const { activeProject } = useProject();
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [copies, setCopies] = useState<Copy[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Refs para controlar fetches duplicados e prevenir race conditions
  const fetchingRef = useRef(false);
  const lastFetchParamsRef = useRef<string>('');

  const fetchDriveContent = useCallback(async (folderId: string | null = null) => {
    if (!activeWorkspace?.id) return;

    // Prevenir chamadas duplicadas simultâneas
    const fetchKey = `${activeWorkspace.id}-${activeProject?.id || 'none'}-${folderId || 'root'}`;
    if (fetchingRef.current && lastFetchParamsRef.current === fetchKey) {
      console.log('⏭️ Fetch já em andamento, ignorando...');
      return;
    }

    fetchingRef.current = true;
    lastFetchParamsRef.current = fetchKey;
    setLoading(true);
    
    try {
      // Forçar bypass de cache
      const timestamp = Date.now();
      // Fetch folders
      const foldersQuery = supabase
        .from('folders')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('name');

      if (folderId) {
        foldersQuery.eq('parent_id', folderId);
      } else {
        foldersQuery.is('parent_id', null);
      }

      if (activeProject?.id) {
        foldersQuery.eq('project_id', activeProject.id);
      }

      const { data: foldersData, error: foldersError } = await foldersQuery;
      if (foldersError) throw foldersError;

      // Fetch copies with creator info (exclude templates)
      const copiesQuery = supabase
        .from('copies')
        .select(`
          *,
          creator:profiles!fk_copies_creator(name, avatar_url)
        `)
        .eq('workspace_id', activeWorkspace.id)
        .eq('is_template', false)
        .order('created_at', { ascending: false });

      if (folderId) {
        copiesQuery.eq('folder_id', folderId);
      } else {
        copiesQuery.is('folder_id', null);
      }

      if (activeProject?.id) {
        copiesQuery.eq('project_id', activeProject.id);
      }

      const { data: copiesData, error: copiesError } = await copiesQuery;
      if (copiesError) throw copiesError;

      console.log(`✅ Fetched ${copiesData?.length || 0} copies (timestamp: ${timestamp})`);

      setFolders(foldersData || []);
      setCopies(copiesData || []);

      // Build breadcrumbs
      if (folderId) {
        const { data: folderData } = await supabase
          .from('folders')
          .select('*')
          .eq('id', folderId)
          .single();
        
        if (folderData) {
          setCurrentFolder(folderData);
          await buildBreadcrumbs(folderData);
        }
      } else {
        setCurrentFolder(null);
        setBreadcrumbs([]);
      }
    } catch (error) {
      console.error('Error fetching drive content:', error);
      toast.error('Erro ao carregar conteúdo');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [activeWorkspace?.id, activeProject?.id]);

  const buildBreadcrumbs = async (folder: Folder) => {
    const crumbs: Folder[] = [folder];
    let currentParentId = folder.parent_id;

    while (currentParentId) {
      const { data } = await supabase
        .from('folders')
        .select('*')
        .eq('id', currentParentId)
        .single();

      if (data) {
        crumbs.unshift(data);
        currentParentId = data.parent_id;
      } else {
        break;
      }
    }

    setBreadcrumbs(crumbs);
  };

  useEffect(() => {
    fetchDriveContent(currentFolder?.id || null);
  }, [activeWorkspace?.id, activeProject?.id, currentFolder?.id]);

  // Listener para invalidação de cache externo (ex: após copiar template/discover)
  useEffect(() => {
    const handleInvalidate = () => {
      console.log('🔄 Drive cache invalidated by external event');
      fetchDriveContent(currentFolder?.id || null);
    };
    
    window.addEventListener('drive-invalidate', handleInvalidate);
    return () => window.removeEventListener('drive-invalidate', handleInvalidate);
  }, [fetchDriveContent, currentFolder?.id]);

  const navigateToFolder = useCallback((folderId: string | null) => {
    if (folderId === null) {
      setCurrentFolder(null);
      setBreadcrumbs([]);
    } else {
      fetchDriveContent(folderId);
    }
  }, [fetchDriveContent]);

  const createFolder = useCallback(async (name: string) => {
    if (!activeWorkspace?.id || !user?.id) {
      toast.error('Workspace ou usuário não encontrado');
      return;
    }

    if (!activeProject?.id) {
      toast.error('Selecione um projeto antes de criar uma pasta');
      return;
    }

    try {
      const { error } = await supabase
        .from('folders')
        .insert({
          workspace_id: activeWorkspace.id,
          project_id: activeProject.id,
          parent_id: currentFolder?.id || null,
          name,
          created_by: user.id,
        });

      if (error) throw error;

      await fetchDriveContent(currentFolder?.id || null);
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Erro ao criar pasta');
    }
  }, [activeWorkspace?.id, activeProject?.id, user?.id, currentFolder?.id, fetchDriveContent]);

  const createCopy = useCallback(async (title: string, copyType: string = 'outro'): Promise<Copy | null> => {
    if (!activeWorkspace?.id || !user?.id) {
      toast.error('Workspace ou usuário não encontrado');
      return null;
    }

    if (!activeProject?.id) {
      toast.error('Selecione um projeto antes de criar uma copy');
      return null;
    }

    try {
      // Verificar limite de copies
      const { data: limitCheck } = await supabase.rpc('check_plan_limit', {
        p_workspace_id: activeWorkspace.id,
        p_limit_type: 'copies'
      });

      const limitData = limitCheck as any;
      if (!limitData?.allowed) {
        // Disparar evento para abrir modal de upgrade
        window.dispatchEvent(new CustomEvent('show-upgrade-modal', {
          detail: {
            limitType: 'copies',
            currentLimit: limitData?.limit,
            currentUsage: limitData?.current
          }
        }));
        return null;
      }

      const { data, error } = await supabase
        .from('copies')
        .insert({
          workspace_id: activeWorkspace.id,
          project_id: activeProject.id,
          folder_id: currentFolder?.id || null,
          title,
          copy_type: copyType,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Copy criada com sucesso!');
      await fetchDriveContent(currentFolder?.id || null);
      return data as Copy;
    } catch (error) {
      console.error('Error creating copy:', error);
      toast.error('Erro ao criar copy');
      return null;
    }
  }, [activeWorkspace?.id, activeProject?.id, user?.id, currentFolder?.id, fetchDriveContent]);

  const deleteFolder = useCallback(async (folderId: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      toast.success('Pasta excluída com sucesso!');
      await fetchDriveContent(currentFolder?.id || null);
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Erro ao excluir pasta');
    }
  }, [currentFolder?.id, fetchDriveContent]);

  const deleteCopy = useCallback(async (copyId: string) => {
    try {
      // 1. ATUALIZAÇÃO OTIMISTA: Remover do estado imediatamente
      setCopies(prevCopies => {
        const filtered = prevCopies.filter(c => c.id !== copyId);
        console.log(`🗑️ Removendo copy ${copyId} do estado (${prevCopies.length} -> ${filtered.length})`);
        return filtered;
      });

      // 2. Deletar no banco
      console.log(`🔥 Deletando copy ${copyId} no banco...`);
      const { error } = await supabase
        .from('copies')
        .delete()
        .eq('id', copyId);

      if (error) {
        console.error('❌ Erro ao deletar:', error);
        // 3. ROLLBACK: Se falhar, recarregar do banco
        await fetchDriveContent(currentFolder?.id || null);
        throw error;
      }

      console.log(`✅ Copy ${copyId} deletada com sucesso`);
      toast.success('Copy excluída com sucesso!');
      
      // 4. Refetch para garantir sincronização
      await fetchDriveContent(currentFolder?.id || null);
    } catch (error) {
      console.error('Error deleting copy:', error);
      toast.error('Erro ao excluir copy');
    }
  }, [currentFolder?.id, fetchDriveContent]);

  const renameFolder = useCallback(async (folderId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .update({ name: newName })
        .eq('id', folderId);

      if (error) throw error;

      toast.success('Pasta renomeada com sucesso!');
      await fetchDriveContent(currentFolder?.id || null);
    } catch (error) {
      console.error('Error renaming folder:', error);
      toast.error('Erro ao renomear pasta');
    }
  }, [currentFolder?.id, fetchDriveContent]);

  const renameCopy = useCallback(async (copyId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('copies')
        .update({ title: newTitle })
        .eq('id', copyId);

      if (error) throw error;

      toast.success('Copy renomeada com sucesso!');
      await fetchDriveContent(currentFolder?.id || null);
    } catch (error) {
      console.error('Error renaming copy:', error);
      toast.error('Erro ao renomear copy');
    }
  }, [currentFolder?.id, fetchDriveContent]);

  const moveFolder = useCallback(async (folderId: string, targetFolderId: string | null) => {
    try {
      const { error } = await supabase
        .from('folders')
        .update({ parent_id: targetFolderId })
        .eq('id', folderId);

      if (error) throw error;

      toast.success('Pasta movida com sucesso!');
      await fetchDriveContent(currentFolder?.id || null);
    } catch (error) {
      console.error('Error moving folder:', error);
      toast.error('Erro ao mover pasta');
    }
  }, [currentFolder?.id, fetchDriveContent]);

  const moveCopy = useCallback(async (copyId: string, targetFolderId: string | null) => {
    try {
      const { error } = await supabase
        .from('copies')
        .update({ folder_id: targetFolderId })
        .eq('id', copyId);

      if (error) throw error;

      toast.success('Copy movida com sucesso!');
      await fetchDriveContent(currentFolder?.id || null);
    } catch (error) {
      console.error('Error moving copy:', error);
      toast.error('Erro ao mover copy');
    }
  }, [currentFolder?.id, fetchDriveContent]);

  const duplicateCopy = useCallback(async (copyId: string) => {
    if (!user?.id) {
      toast.error('Usuário não encontrado');
      return;
    }

    try {
      // Buscar a copy original
      const { data: originalCopy, error: fetchError } = await supabase
        .from('copies')
        .select('*')
        .eq('id', copyId)
        .single();

      if (fetchError) throw fetchError;
      if (!originalCopy) throw new Error('Copy não encontrada');

      // Criar uma nova copy com os mesmos dados
      const { error: insertError } = await supabase
        .from('copies')
        .insert({
          workspace_id: originalCopy.workspace_id,
          project_id: originalCopy.project_id,
          folder_id: originalCopy.folder_id,
          title: `${originalCopy.title} (cópia)`,
          copy_type: originalCopy.copy_type,
          sessions: originalCopy.sessions,
          status: 'draft', // Sempre criar como rascunho
          created_by: user.id,
        });

      if (insertError) throw insertError;

      toast.success('Copy duplicada com sucesso!');
      await fetchDriveContent(currentFolder?.id || null);
    } catch (error) {
      console.error('Error duplicating copy:', error);
      toast.error('Erro ao duplicar copy');
    }
  }, [user?.id, currentFolder?.id, fetchDriveContent]);

  const value: DriveContextType = {
    folders,
    copies,
    currentFolder,
    breadcrumbs,
    loading,
    navigateToFolder,
    createFolder,
    createCopy,
    deleteFolder,
    deleteCopy,
    renameFolder,
    renameCopy,
    moveFolder,
    moveCopy,
    duplicateCopy,
    refreshDrive: () => fetchDriveContent(currentFolder?.id || null),
  };

  return (
    <DriveContext.Provider value={value}>
      {children}
    </DriveContext.Provider>
  );
};

export const useDrive = () => {
  const context = useContext(DriveContext);
  if (!context) {
    throw new Error('useDrive must be used within DriveProvider');
  }
  return context;
};