import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { Copy } from '@/types/copy-editor';

export const useTemplates = () => {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Copy[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (!activeWorkspace?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('copies')
        .select(`
          *,
          creator:profiles!created_by(name, avatar_url)
        `)
        .eq('workspace_id', activeWorkspace.id)
        .eq('is_template', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTemplates(data as any || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Erro ao carregar modelos');
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace?.id]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createFromTemplate = useCallback(async (
    templateId: string,
    workspaceId?: string,
    projectId?: string | null,
    folderId?: string | null,
    userId?: string
  ): Promise<Copy | null> => {
    const finalWorkspaceId = workspaceId || activeWorkspace?.id;
    const finalUserId = userId || user?.id;

    if (!finalWorkspaceId || !finalUserId) {
      toast.error('Workspace ou usuário não encontrado');
      return null;
    }

    try {
      // Fetch template
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
      return newCopy as any as Copy;
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

      toast.success('Modelo excluído com sucesso!');
      await fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erro ao excluir modelo');
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
      await fetchTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Erro ao duplicar modelo');
    }
  }, [user?.id, fetchTemplates]);

  return {
    templates,
    loading,
    fetchTemplates,
    createFromTemplate,
    deleteTemplate,
    duplicateTemplate,
  };
};
