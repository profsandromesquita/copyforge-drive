import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@/types/copy-editor';
import { toast } from 'sonner';

interface DiscoverCopy {
  id: string;
  title: string;
  sessions: Session[];
  copy_count: number;
  created_by: string;
  creator: {
    name: string;
    avatar_url: string | null;
  };
}

export const useDiscover = () => {
  const [copies, setCopies] = useState<DiscoverCopy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscoverCopies();
  }, []);

  const fetchDiscoverCopies = async () => {
    try {
      const { data, error } = await supabase
        .from('copies')
        .select(`
          id,
          title,
          sessions,
          copy_count,
          created_by,
          profiles!copies_created_by_fkey (
            name,
            avatar_url
          )
        `)
        .eq('is_public', true)
        .eq('show_in_discover', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedCopies = data.map((copy: any) => ({
        id: copy.id,
        title: copy.title,
        sessions: copy.sessions as Session[],
        copy_count: copy.copy_count || 0,
        created_by: copy.created_by,
        creator: {
          name: copy.profiles?.name || 'Usuário',
          avatar_url: copy.profiles?.avatar_url || null,
        },
      }));

      setCopies(formattedCopies);
    } catch (error) {
      console.error('Error fetching discover copies:', error);
      toast.error('Erro ao carregar copies');
    } finally {
      setLoading(false);
    }
  };

  const copyCopy = async (
    copyId: string,
    workspaceId: string,
    projectId: string | null,
    folderId: string | null,
    userId: string,
    onSuccess: (newCopyId: string) => void
  ) => {
    try {
      // Fetch original copy
      const { data: originalCopy, error: fetchError } = await supabase
        .from('copies')
        .select('*')
        .eq('id', copyId)
        .single();

      if (fetchError) throw fetchError;

      // Create new copy
      const { data: newCopy, error: insertError } = await supabase
        .from('copies')
        .insert({
          title: `${originalCopy.title} - Cópia`,
          workspace_id: workspaceId,
          project_id: projectId,
          folder_id: folderId,
          copy_type: originalCopy.copy_type,
          sessions: originalCopy.sessions,
          status: 'draft',
          created_by: userId,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Increment copy count
      await incrementCopyCount(copyId);

      toast.success('Copy copiada com sucesso!');
      onSuccess(newCopy.id);
    } catch (error) {
      console.error('Error copying copy:', error);
      toast.error('Erro ao copiar copy');
    }
  };

  const incrementCopyCount = async (copyId: string) => {
    try {
      const { data: copy } = await supabase
        .from('copies')
        .select('copy_count')
        .eq('id', copyId)
        .single();

      if (copy) {
        await supabase
          .from('copies')
          .update({ copy_count: (copy.copy_count || 0) + 1 })
          .eq('id', copyId);
      }
    } catch (error) {
      console.error('Error incrementing copy count:', error);
    }
  };

  const deleteCopy = async (copyId: string) => {
    try {
      const { error } = await supabase
        .from('copies')
        .delete()
        .eq('id', copyId);

      if (error) throw error;

      toast.success('Copy excluída com sucesso!');
      await fetchDiscoverCopies();
    } catch (error) {
      console.error('Error deleting copy:', error);
      toast.error('Erro ao excluir copy');
    }
  };

  const moveCopy = async (copyId: string, targetFolderId: string | null) => {
    try {
      const { error } = await supabase
        .from('copies')
        .update({ folder_id: targetFolderId })
        .eq('id', copyId);

      if (error) throw error;

      toast.success('Copy movida com sucesso!');
      await fetchDiscoverCopies();
    } catch (error) {
      console.error('Error moving copy:', error);
      toast.error('Erro ao mover copy');
    }
  };

  return {
    copies,
    loading,
    fetchDiscoverCopies,
    copyCopy,
    deleteCopy,
    moveCopy,
  };
};
