import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sanitizePreviewText } from '@/lib/html-sanitizer';

export interface DiscoverCard {
  id: string;
  title: string;
  copy_type: string | null;
  copy_count: number;
  likes_count: number;
  created_by: string;
  created_at: string;
  preview_image_url: string | null;
  preview_text: string | null;
  creator: {
    name: string;
    avatar_url: string | null;
  };
}

interface UseDiscoverParams {
  search?: string;
  type?: string | null;
  sort?: 'recent' | 'popular' | 'most_liked';
  limit?: number;
}

interface UseDiscoverReturn {
  copies: DiscoverCard[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
  toggleLike: (copyId: string) => void;
  isLikedByUser: (copyId: string) => boolean;
  copyCopy: (
    copyId: string,
    workspaceId: string,
    projectId: string | null,
    folderId: string | null,
    userId: string,
    onSuccess: (newCopyId: string) => void
  ) => Promise<void>;
}

const PAGE_SIZE = 20;

export const useDiscover = (params: UseDiscoverParams = {}): UseDiscoverReturn => {
  const { search = '', type = null, sort = 'popular', limit = PAGE_SIZE } = params;
  
  const [copies, setCopies] = useState<DiscoverCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [likedCopyIds, setLikedCopyIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const offsetRef = useRef(0);

  // Fetch current user once
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  // Build and execute query with server-side filtering/sorting/pagination
  const fetchDiscoverCards = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      offsetRef.current = 0;
    } else {
      setLoadingMore(true);
    }

    try {
      // Build query with server-side filtering
      let query = supabase
        .from('discover_cards')
        .select('*');

      // Server-side search filter
      if (search.trim()) {
        query = query.ilike('title', `%${search.trim()}%`);
      }

      // Server-side type filter
      if (type) {
        query = query.eq('copy_type', type);
      }

      // Server-side sorting
      switch (sort) {
        case 'most_liked':
          query = query.order('likes_count', { ascending: false });
          break;
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'popular':
        default:
          query = query.order('copy_count', { ascending: false });
          break;
      }

      // Pagination with range
      const from = offsetRef.current;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match component expectations
      const formattedCopies: DiscoverCard[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        copy_type: item.copy_type,
        copy_count: item.copy_count || 0,
        likes_count: item.likes_count || 0,
        created_by: item.created_by,
        created_at: item.created_at,
        preview_image_url: item.preview_image_url,
        preview_text: sanitizePreviewText(item.preview_text),
        creator: {
          name: item.creator_name || 'Usuário',
          avatar_url: item.creator_avatar_url,
        },
      }));

      if (reset) {
        setCopies(formattedCopies);
      } else {
        setCopies(prev => [...prev, ...formattedCopies]);
      }

      // Check if there's more data
      setHasMore(formattedCopies.length === limit);
      offsetRef.current += formattedCopies.length;

      // Fetch user likes for displayed copies
      if (currentUserId && formattedCopies.length > 0) {
        const copyIds = formattedCopies.map(c => c.id);
        const { data: userLikes } = await supabase
          .from('copy_likes')
          .select('copy_id')
          .eq('user_id', currentUserId)
          .in('copy_id', copyIds);

        if (userLikes) {
          setLikedCopyIds(prev => {
            const newSet = new Set(prev);
            userLikes.forEach(l => newSet.add(l.copy_id));
            return newSet;
          });
        }
      }
    } catch (error) {
      console.error('Error fetching discover cards:', error);
      toast.error('Erro ao carregar copies');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, type, sort, limit, currentUserId]);

  // Reset and refetch when filters change
  useEffect(() => {
    fetchDiscoverCards(true);
  }, [search, type, sort]);

  // Load more function for infinite scroll
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    await fetchDiscoverCards(false);
  }, [fetchDiscoverCards, loadingMore, hasMore]);

  // Refetch function
  const refetch = useCallback(async () => {
    await fetchDiscoverCards(true);
  }, [fetchDiscoverCards]);

  // Toggle like with optimistic update
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

  // Copy a copy - fetches full sessions only when needed
  const copyCopy = async (
    copyId: string,
    workspaceId: string,
    projectId: string | null,
    folderId: string | null,
    userId: string,
    onSuccess: (newCopyId: string) => void
  ) => {
    try {
      // Fetch full sessions ONLY when copying (not on initial load)
      const { data: originalCopy, error: fetchError } = await supabase
        .from('public_copies')
        .select('title, copy_type, sessions')
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
      await supabase
        .from('copies')
        .update({ copy_count: copies.find(c => c.id === copyId)?.copy_count || 0 + 1 })
        .eq('id', copyId);

      // Update local state
      setCopies(prev => prev.map(c =>
        c.id === copyId
          ? { ...c, copy_count: c.copy_count + 1 }
          : c
      ));

      toast.success('Copy copiada com sucesso!');
      window.dispatchEvent(new CustomEvent('drive-invalidate'));
      onSuccess(newCopy.id);
    } catch (error) {
      console.error('Error copying copy:', error);
      toast.error('Erro ao copiar copy');
    }
  };

  return {
    copies,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refetch,
    toggleLike,
    isLikedByUser,
    copyCopy,
  };
};
