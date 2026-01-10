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
  copy_type: string | null;
  status: string | null;
  // Campos projetados da VIEW drive_cards (substituem sessions)
  preview_image_url: string | null;
  preview_text: string | null;
  creator_name: string | null;
  creator_avatar_url: string | null;
  // Flag para auto-heal de thumbnails
  has_pending_thumbnail: boolean;
}

interface DriveContextType {
  folders: Folder[];
  copies: Copy[];
  currentFolder: Folder | null;
  breadcrumbs: Folder[];
  loading: boolean;
  isInitialLoading: boolean;
  navigateToFolder: (folderId: string | null) => void;
  createFolder: (name: string) => Promise<void>;
  createCopy: (title: string, copyType?: string) => Promise<Copy | null>;
  deleteFolder: (folderId: string) => Promise<void>;
  deleteCopy: (copyId: string) => Promise<void>;
  deleteCopies: (copyIds: string[]) => Promise<void>;
  deleteFolders: (folderIds: string[]) => Promise<void>;
  countCopiesInFolders: (folderIds: string[]) => Promise<number>;
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
  const { activeProject, loading: projectLoading } = useProject();
  const { user, authReady } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [copies, setCopies] = useState<Copy[]>([]);
  
  // NOVA ARQUITETURA: Separar navegação (ID) de dados (objeto)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Folder[]>([]);
  
  // Estados de loading separados
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  
  // Refs para controlar fetches duplicados e prevenir race conditions
  const fetchingRef = useRef(false);
  const lastContextRef = useRef<string>('');
  const requestIdRef = useRef(0); // Anti-race condition: só o request mais recente atualiza estado

  const fetchDriveContent = useCallback(async (
    folderId: string | null = null, 
    source: string = 'unknown'
  ) => {
    if (!activeWorkspace?.id) return;

    // CRÍTICO: Não buscar sem projeto ativo (evita flash de "todas as copies")
    if (!activeProject?.id) {
      console.log('⏸️ Drive: Sem projeto ativo, limpando estado...');
      setFolders([]);
      setCopies([]);
      setIsInitialLoading(false);
      setLoading(false);
      return;
    }

    // Gerar requestId único para este fetch
    const thisRequestId = ++requestIdRef.current;
    const timestamp = Date.now();
    
    console.log(`🔄 [${thisRequestId}] Fetch iniciado (source: ${source}) - workspace: ${activeWorkspace.id}, project: ${activeProject.id}, folder: ${folderId || 'root'}`);

    // Se não é o primeiro load, não mostrar spinner central (apenas refresh)
    if (hasLoadedOnce) {
      setLoading(true);
    } else {
      setIsInitialLoading(true);
    }
    
    fetchingRef.current = true;
    
    try {
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

      // Fetch copies usando VIEW otimizada
      const copiesQuery = supabase
        .from('drive_cards')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
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

      // Anti-race condition: só atualizar se este ainda é o request mais recente
      if (thisRequestId !== requestIdRef.current) {
        console.log(`⏭️ [${thisRequestId}] Fetch obsoleto, ignorando resultado (atual: ${requestIdRef.current})`);
        return;
      }

      console.log(`✅ [${thisRequestId}] Fetched ${copiesData?.length || 0} copies (timestamp: ${timestamp})`);

      setFolders(foldersData || []);
      setCopies(copiesData || []);
      setHasLoadedOnce(true);

      // Build breadcrumbs e currentFolder
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
      setIsInitialLoading(false);
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

  // ====== EFEITO PRINCIPAL: ÚNICO GATILHO DE FETCH ======
  // Depende de: workspace, project, folderId, authReady, projectLoading
  useEffect(() => {
    // Gating #1: Auth precisa estar pronto
    if (!authReady) {
      console.log('⏸️ Drive: Aguardando auth...');
      return;
    }
    
    // Gating #2: Workspace precisa existir
    const workspaceId = activeWorkspace?.id;
    if (!workspaceId) {
      console.log('⏸️ Drive: Sem workspace ativo');
      setFolders([]);
      setCopies([]);
      setCurrentFolder(null);
      setBreadcrumbs([]);
      setIsInitialLoading(false);
      lastContextRef.current = '';
      return;
    }
    
    // Gating #3: Aguardar projeto carregar (evita "fetch sem projeto" + "fetch com projeto")
    if (projectLoading) {
      console.log('⏸️ Drive: Aguardando projetos carregarem...');
      return;
    }
    
    // Gating #4: CRÍTICO - Não fazer fetch sem projeto ativo
    // Isso evita o flash de "todas as copies" antes do projeto ser selecionado
    if (!activeProject?.id) {
      console.log('⏸️ Drive: Sem projeto ativo, aguardando seleção...');
      setFolders([]);
      setCopies([]);
      setIsInitialLoading(false);
      lastContextRef.current = '';
      return;
    }
    
    // Construir contextKey baseado no estado atual
    const projectId = activeProject.id;
    const folderId = currentFolderId || 'root';
    const contextKey = `${workspaceId}-${projectId}-${folderId}`;
    
    // Skip se o contexto não mudou
    if (contextKey === lastContextRef.current) {
      console.log(`⏭️ Drive: Contexto não mudou (${contextKey}), skip fetch`);
      return;
    }
    
    console.log(`📍 Drive: Contexto mudou ${lastContextRef.current || '(inicial)'} -> ${contextKey}`);
    lastContextRef.current = contextKey;
    
    // Delay pequeno para debounce de mudanças rápidas
    const timeoutId = setTimeout(() => {
      fetchDriveContent(currentFolderId, 'effect');
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [activeWorkspace?.id, activeProject?.id, currentFolderId, authReady, projectLoading, fetchDriveContent]);

  // Auto-heal: gerar thumbnails para copies com base64 pendente
  const thumbnailQueueRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    const pendingCopies = copies.filter(c => c.has_pending_thumbnail && !thumbnailQueueRef.current.has(c.id));
    
    if (pendingCopies.length === 0) return;
    
    // Processar uma copy por vez para não sobrecarregar
    const processNext = async () => {
      const copy = pendingCopies[0];
      if (!copy || thumbnailQueueRef.current.has(copy.id)) return;
      
      thumbnailQueueRef.current.add(copy.id);
      console.log(`🖼️ Gerando thumbnail para copy: ${copy.id}`);
      
      try {
        const { data, error } = await supabase.functions.invoke('generate-thumbnail', {
          body: { copyId: copy.id }
        });
        
        if (error) {
          console.error('Erro ao gerar thumbnail:', error);
          return;
        }
        
        if (data?.thumbnailUrl) {
          // Atualizar estado local imediatamente
          setCopies(prev => prev.map(c => 
            c.id === copy.id 
              ? { ...c, preview_image_url: data.thumbnailUrl, has_pending_thumbnail: false }
              : c
          ));
          console.log(`✅ Thumbnail gerado: ${data.thumbnailUrl}`);
        }
      } catch (err) {
        console.error('Erro ao invocar generate-thumbnail:', err);
      }
    };
    
    processNext();
  }, [copies]);

  // Listener para invalidação de cache externo (ex: após copiar template/discover)
  useEffect(() => {
    const handleInvalidate = () => {
      console.log('🔄 Drive cache invalidated by external event');
      // Força um novo fetch invalidando o contexto
      lastContextRef.current = '';
      fetchDriveContent(currentFolderId, 'invalidate');
    };
    
    window.addEventListener('drive-invalidate', handleInvalidate);
    return () => window.removeEventListener('drive-invalidate', handleInvalidate);
  }, [fetchDriveContent, currentFolderId]);

  // NAVEGAÇÃO: Apenas atualiza o ID, o useEffect principal faz o fetch
  const navigateToFolder = useCallback((folderId: string | null) => {
    console.log(`📂 navigateToFolder: ${folderId || 'root'}`);
    
    // Se navegando para raiz, limpar breadcrumbs imediatamente (UX)
    if (folderId === null) {
      setBreadcrumbs([]);
      setCurrentFolder(null);
    }
    
    // Atualizar o ID - o useEffect principal vai disparar o fetch
    setCurrentFolderId(folderId);
  }, []);

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
          parent_id: currentFolderId || null,
          name,
          created_by: user.id,
        });

      if (error) throw error;

      await fetchDriveContent(currentFolderId, 'createFolder');
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Erro ao criar pasta');
    }
  }, [activeWorkspace?.id, activeProject?.id, user?.id, currentFolderId, fetchDriveContent]);

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
          folder_id: currentFolderId || null,
          title,
          copy_type: copyType,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Copy criada com sucesso!');
      await fetchDriveContent(currentFolderId, 'createCopy');
      // Retorna dados básicos para navegação (não precisa dos campos da VIEW)
      return {
        ...data,
        preview_image_url: null,
        preview_text: null,
        creator_name: null,
        creator_avatar_url: null,
        has_pending_thumbnail: false,
      } as Copy;
    } catch (error) {
      console.error('Error creating copy:', error);
      toast.error('Erro ao criar copy');
      return null;
    }
  }, [activeWorkspace?.id, activeProject?.id, user?.id, currentFolderId, fetchDriveContent]);

  const deleteFolder = useCallback(async (folderId: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      toast.success('Pasta excluída com sucesso!');
      await fetchDriveContent(currentFolderId, 'deleteFolder');
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Erro ao excluir pasta');
    }
  }, [currentFolderId, fetchDriveContent]);

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
        await fetchDriveContent(currentFolderId, 'deleteCopy-rollback');
        throw error;
      }

      console.log(`✅ Copy ${copyId} deletada com sucesso`);
      toast.success('Copy excluída com sucesso!');
      
      // 4. Refetch para garantir sincronização
      await fetchDriveContent(currentFolderId, 'deleteCopy');
    } catch (error) {
      console.error('Error deleting copy:', error);
      toast.error('Erro ao excluir copy');
    }
  }, [currentFolderId, fetchDriveContent]);

  // Batch delete copies
  const deleteCopies = useCallback(async (copyIds: string[]) => {
    if (copyIds.length === 0) return;

    try {
      // 1. ATUALIZAÇÃO OTIMISTA
      setCopies(prev => prev.filter(c => !copyIds.includes(c.id)));

      // 2. Deletar no banco com .in()
      const { error } = await supabase
        .from('copies')
        .delete()
        .in('id', copyIds);

      if (error) {
        // ROLLBACK
        await fetchDriveContent(currentFolderId, 'deleteCopies-rollback');
        throw error;
      }

      toast.success(`${copyIds.length} copies excluídas com sucesso!`);
      await fetchDriveContent(currentFolderId, 'deleteCopies');
    } catch (error) {
      console.error('Error batch deleting copies:', error);
      toast.error('Erro ao excluir copies');
    }
  }, [currentFolderId, fetchDriveContent]);

  // Contar copies dentro de pastas (para warning de cascade delete)
  const countCopiesInFolders = useCallback(async (folderIds: string[]): Promise<number> => {
    if (folderIds.length === 0) return 0;
    
    try {
      const { count, error } = await supabase
        .from('copies')
        .select('id', { count: 'exact', head: true })
        .in('folder_id', folderIds);
        
      if (error) {
        console.error('Error counting copies in folders:', error);
        return 0;
      }
      return count || 0;
    } catch (error) {
      console.error('Error counting copies in folders:', error);
      return 0;
    }
  }, []);

  // Batch delete folders (com cascade delete de copies)
  const deleteFolders = useCallback(async (folderIds: string[]) => {
    if (folderIds.length === 0) return;

    try {
      // 1. PRIMEIRO: Deletar copies dentro das pastas (CASCADE manual)
      const { error: copiesError } = await supabase
        .from('copies')
        .delete()
        .in('folder_id', folderIds);
        
      if (copiesError) {
        console.error('Error deleting copies in folders:', copiesError);
        throw copiesError;
      }

      // 2. ATUALIZAÇÃO OTIMISTA das pastas
      setFolders(prev => prev.filter(f => !folderIds.includes(f.id)));
      // Também remover copies das pastas do estado local
      setCopies(prev => prev.filter(c => !c.folder_id || !folderIds.includes(c.folder_id)));

      // 3. Deletar pastas no banco com .in()
      const { error } = await supabase
        .from('folders')
        .delete()
        .in('id', folderIds);

      if (error) {
        // ROLLBACK
        await fetchDriveContent(currentFolderId, 'deleteFolders-rollback');
        throw error;
      }

      toast.success(`${folderIds.length} pastas excluídas com sucesso!`);
      await fetchDriveContent(currentFolderId, 'deleteFolders');
    } catch (error) {
      console.error('Error batch deleting folders:', error);
      toast.error('Erro ao excluir pastas');
    }
  }, [currentFolderId, fetchDriveContent]);

  const renameFolder = useCallback(async (folderId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .update({ name: newName })
        .eq('id', folderId);

      if (error) throw error;

      toast.success('Pasta renomeada com sucesso!');
      await fetchDriveContent(currentFolderId, 'renameFolder');
    } catch (error) {
      console.error('Error renaming folder:', error);
      toast.error('Erro ao renomear pasta');
    }
  }, [currentFolderId, fetchDriveContent]);

  const renameCopy = useCallback(async (copyId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('copies')
        .update({ title: newTitle })
        .eq('id', copyId);

      if (error) throw error;

      toast.success('Copy renomeada com sucesso!');
      await fetchDriveContent(currentFolderId, 'renameCopy');
    } catch (error) {
      console.error('Error renaming copy:', error);
      toast.error('Erro ao renomear copy');
    }
  }, [currentFolderId, fetchDriveContent]);

  const moveFolder = useCallback(async (folderId: string, targetFolderId: string | null) => {
    try {
      const { error } = await supabase
        .from('folders')
        .update({ parent_id: targetFolderId })
        .eq('id', folderId);

      if (error) throw error;

      toast.success('Pasta movida com sucesso!');
      await fetchDriveContent(currentFolderId, 'moveFolder');
    } catch (error) {
      console.error('Error moving folder:', error);
      toast.error('Erro ao mover pasta');
    }
  }, [currentFolderId, fetchDriveContent]);

  const moveCopy = useCallback(async (copyId: string, targetFolderId: string | null) => {
    try {
      const { error } = await supabase
        .from('copies')
        .update({ folder_id: targetFolderId })
        .eq('id', copyId);

      if (error) throw error;

      toast.success('Copy movida com sucesso!');
      await fetchDriveContent(currentFolderId, 'moveCopy');
    } catch (error) {
      console.error('Error moving copy:', error);
      toast.error('Erro ao mover copy');
    }
  }, [currentFolderId, fetchDriveContent]);

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
      await fetchDriveContent(currentFolderId, 'duplicateCopy');
    } catch (error) {
      console.error('Error duplicating copy:', error);
      toast.error('Erro ao duplicar copy');
    }
  }, [user?.id, currentFolderId, fetchDriveContent]);

  const value: DriveContextType = {
    folders,
    copies,
    currentFolder,
    breadcrumbs,
    loading,
    isInitialLoading,
    navigateToFolder,
    createFolder,
    createCopy,
    deleteFolder,
    deleteCopy,
    deleteCopies,
    deleteFolders,
    countCopiesInFolders,
    renameFolder,
    renameCopy,
    moveFolder,
    moveCopy,
    duplicateCopy,
    refreshDrive: () => fetchDriveContent(currentFolderId, 'manual-refresh'),
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
