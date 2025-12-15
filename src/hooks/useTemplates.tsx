import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Type para o card de template (vindo da VIEW templates_cards)
export interface TemplateCard {
  id: string;
  title: string;
  copy_type: string | null;
  folder_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  workspace_id: string;
  preview_image_url: string | null;
  preview_text: string | null;
  sessions_count: number;
  blocks_count: number;
  creator_name: string | null;
  creator_avatar_url: string | null;
}

interface UseTemplatesParams {
  searchQuery?: string;
  selectedType?: string | null;
  selectedCreator?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

const PAGE_SIZE = 20;

export const useTemplates = (params: UseTemplatesParams = {}) => {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TemplateCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const { searchQuery, selectedType, selectedCreator, dateFrom, dateTo } = params;

  const fetchTemplates = useCallback(async (reset = false) => {
    if (!activeWorkspace?.id) return;

    const isInitialLoad = reset || templates.length === 0;
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const from = reset ? 0 : templates.length;
      const to = from + PAGE_SIZE - 1;

      // Query na VIEW otimizada (sem sessions JSONB)
      let query = supabase
        .from('templates_cards')
        .select('*', { count: 'exact' })
        .eq('workspace_id', activeWorkspace.id);

      // Filtros server-side
      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }
      if (selectedType) {
        query = query.eq('copy_type', selectedType);
      }
      if (selectedCreator) {
        query = query.eq('created_by', selectedCreator);
      }
      if (dateFrom) {
        query = query.gte('updated_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('updated_at', dateTo);
      }

      // Ordenação e paginação
      query = query
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      const newTemplates = (data || []) as TemplateCard[];

      if (reset) {
        setTemplates(newTemplates);
      } else {
        setTemplates(prev => [...prev, ...newTemplates]);
      }

      setTotalCount(count || 0);
      setHasMore(newTemplates.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Erro ao carregar modelos');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeWorkspace?.id, searchQuery, selectedType, selectedCreator, dateFrom, dateTo, templates.length]);

  // Reset e fetch quando filtros mudam
  useEffect(() => {
    if (activeWorkspace?.id) {
      setTemplates([]);
      setHasMore(true);
      fetchTemplates(true);
    }
  }, [activeWorkspace?.id, searchQuery, selectedType, selectedCreator, dateFrom, dateTo]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchTemplates(false);
    }
  }, [loadingMore, hasMore, fetchTemplates]);

  const createFromTemplate = useCallback(async (
    templateId: string,
    workspaceId?: string,
    projectId?: string | null,
    folderId?: string | null,
    userId?: string
  ) => {
    const finalWorkspaceId = workspaceId || activeWorkspace?.id;
    const finalUserId = userId || user?.id;

    if (!finalWorkspaceId || !finalUserId) {
      toast.error('Workspace ou usuário não encontrado');
      return null;
    }

    try {
      // Fetch template completo (precisa do sessions)
      const { data: template, error: fetchError } = await supabase
        .from('copies')
        .select('*')
        .eq('id', templateId)
        .single();

      if (fetchError) throw fetchError;

      // Create new copy from template
      const { data: newCopy, error: createError } = await supabase
        .from('copies')
        .insert({
          title: `${template.title} (Cópia)`,
          workspace_id: finalWorkspaceId,
          project_id: projectId !== undefined ? projectId : template.project_id,
          folder_id: folderId || null,
          copy_type: template.copy_type,
          sessions: template.sessions,
          is_template: false,
          status: 'draft',
          created_by: finalUserId,
        })
        .select()
        .single();

      if (createError) throw createError;

      toast.success('Copy criada a partir do modelo!');
      
      // Invalidar cache do Drive para que a nova copy apareça
      window.dispatchEvent(new CustomEvent('drive-invalidate'));
      
      return newCopy;
    } catch (error) {
      console.error('Error creating from template:', error);
      toast.error('Erro ao criar copy do modelo');
      return null;
    }
  }, [activeWorkspace?.id, user?.id]);

  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('copies')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      // Otimista: remove do estado local
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast.success('Modelo excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erro ao excluir modelo');
    }
  }, []);

  // Batch delete templates
  const deleteTemplates = useCallback(async (templateIds: string[]) => {
    if (templateIds.length === 0) return;

    try {
      // Otimista
      setTemplates(prev => prev.filter(t => !templateIds.includes(t.id)));

      const { error } = await supabase
        .from('copies')
        .delete()
        .in('id', templateIds);

      if (error) {
        // Rollback - refetch
        fetchTemplates(true);
        throw error;
      }

      toast.success(`${templateIds.length} modelos excluídos com sucesso!`);
    } catch (error) {
      console.error('Error batch deleting templates:', error);
      toast.error('Erro ao excluir modelos');
    }
  }, [fetchTemplates]);

  const duplicateTemplate = useCallback(async (templateId: string) => {
    if (!user?.id) {
      toast.error('Usuário não encontrado');
      return;
    }

    try {
      const { data: template, error: fetchError } = await supabase
        .from('copies')
        .select('*')
        .eq('id', templateId)
        .single();

      if (fetchError) throw fetchError;

      const { error: createError } = await supabase
        .from('copies')
        .insert({
          title: `${template.title} (Cópia)`,
          workspace_id: template.workspace_id,
          project_id: template.project_id,
          copy_type: template.copy_type,
          sessions: template.sessions,
          is_template: true,
          status: 'draft',
          created_by: user.id,
        });

      if (createError) throw createError;

      toast.success('Modelo duplicado com sucesso!');
      fetchTemplates(true);
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Erro ao duplicar modelo');
    }
  }, [user?.id, fetchTemplates]);

  return {
    templates,
    loading,
    loadingMore,
    hasMore,
    totalCount,
    fetchTemplates,
    loadMore,
    createFromTemplate,
    deleteTemplate,
    deleteTemplates,
    duplicateTemplate,
  };
};
