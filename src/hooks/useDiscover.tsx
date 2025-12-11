import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@/types/copy-editor';
import { toast } from 'sonner';

interface DiscoverCopy {
  id: string;
  title: string;
  sessions: Session[];
  copy_count: number;
  likes_count: number;
  created_by: string;
  creator: {
    name: string;
    avatar_url: string | null;
  };
}

export const useDiscover = () => {
  const [copies, setCopies] = useState<DiscoverCopy[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedCopyIds, setLikedCopyIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchDiscoverCopies();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchDiscoverCopies = async () => {
    try {
      // Usar VIEW public_copies que expõe apenas dados seguros (oculta system_instruction, prompts, IDs internos)
      const { data, error } = await supabase
        .from('public_copies')
        .select('*')
        .eq('show_in_discover', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedCopies = data.map((copy: any) => ({
        id: copy.id,
        title: copy.title,
        sessions: copy.sessions as Session[],
        copy_count: copy.copy_count || 0,
        likes_count: copy.likes_count || 0,
        created_by: copy.created_by,
        creator: {
          name: copy.creator_name || 'Usuário',
          avatar_url: copy.creator_avatar_url || null,
        },
      }));

      setCopies(formattedCopies);
      
      // Fetch user likes for these copies
      const { data: { user } } = await supabase.auth.getUser();
      if (user && data.length > 0) {
        const copyIds = data.map((c: any) => c.id);
        const { data: userLikes } = await supabase
          .from('copy_likes')
          .select('copy_id')
          .eq('user_id', user.id)
          .in('copy_id', copyIds);
        
        if (userLikes) {
          setLikedCopyIds(new Set(userLikes.map(l => l.copy_id)));
        }
      }
    } catch (error) {
      console.error('Error fetching discover copies:', error);
      toast.error('Erro ao carregar copies');
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = useCallback(async (copyId: string) => {
    if (!currentUserId) {
      toast.error('Faça login para curtir');
      return;
    }

    const isCurrentlyLiked = likedCopyIds.has(copyId);

    // Optimistic update
    setCopies(prev => prev.map(c =>
      c.id === copyId
        ? { ...c, likes_count: c.likes_count + (isCurrentlyLiked ? -1 : 1) }
        : c
    ));
    setLikedCopyIds(prev => {
      const next = new Set(prev);
      if (isCurrentlyLiked) {
        next.delete(copyId);
      } else {
        next.add(copyId);
      }
      return next;
    });

    try {
      if (isCurrentlyLiked) {
        const { error } = await supabase
          .from('copy_likes')
          .delete()
          .eq('copy_id', copyId)
          .eq('user_id', currentUserId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('copy_likes')
          .insert({
            copy_id: copyId,
            user_id: currentUserId
          });
        
        if (error) throw error;
      }
    } catch (error) {
      // Revert optimistic update on error
      console.error('Error toggling like:', error);
      setCopies(prev => prev.map(c =>
        c.id === copyId
          ? { ...c, likes_count: c.likes_count + (isCurrentlyLiked ? 1 : -1) }
          : c
      ));
      setLikedCopyIds(prev => {
        const next = new Set(prev);
        if (isCurrentlyLiked) {
          next.add(copyId);
        } else {
          next.delete(copyId);
        }
        return next;
      });
      toast.error('Erro ao processar curtida');
    }
  }, [currentUserId, likedCopyIds]);

  const isLikedByUser = useCallback((copyId: string) => {
    return likedCopyIds.has(copyId);
  }, [likedCopyIds]);

  const copyCopy = async (
    copyId: string,
    workspaceId: string,
    projectId: string | null,
    folderId: string | null,
    userId: string,
    onSuccess: (newCopyId: string) => void
  ) => {
    try {
      // Usar VIEW public_copies para buscar dados seguros da copy original
      const { data: originalCopy, error: fetchError } = await supabase
        .from('public_copies')
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
      
      // Invalidar cache do Drive para que a nova copy apareça
      window.dispatchEvent(new CustomEvent('drive-invalidate'));
      
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
    toggleLike,
    isLikedByUser,
  };
};
