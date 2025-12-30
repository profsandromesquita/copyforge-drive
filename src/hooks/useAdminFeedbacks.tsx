import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type FeedbackStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';
export type FeedbackCategory = 'bug' | 'suggestion' | 'question' | 'other';

export interface FeedbackReport {
  id: string;
  user_id: string;
  workspace_id: string | null;
  page_url: string;
  user_agent: string | null;
  screen_resolution: string | null;
  category: FeedbackCategory;
  description: string;
  status: FeedbackStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  workspace_name?: string;
}

interface FeedbackFilters {
  status?: FeedbackStatus | 'all';
  category?: FeedbackCategory | 'all';
  period?: 'today' | 'week' | 'month' | 'all';
}

export function useAdminFeedbacks(filters?: FeedbackFilters) {
  return useQuery({
    queryKey: ['admin-feedbacks', filters],
    queryFn: async () => {
      let query = supabase
        .from('feedback_reports')
        .select(`
          *,
          profiles:user_id (name, email),
          workspaces:workspace_id (name)
        `)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply category filter
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      // Apply period filter
      if (filters?.period && filters.period !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (filters.period) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          default:
            startDate = new Date(0);
        }
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        user_name: item.profiles?.name,
        user_email: item.profiles?.email,
        workspace_name: item.workspaces?.name,
      })) as FeedbackReport[];
    },
  });
}

export function useAdminFeedbacksSummary() {
  return useQuery({
    queryKey: ['admin-feedbacks-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback_reports')
        .select('status');

      if (error) throw error;

      const summary = {
        total: data?.length || 0,
        pending: data?.filter(f => f.status === 'pending').length || 0,
        in_progress: data?.filter(f => f.status === 'in_progress').length || 0,
        resolved: data?.filter(f => f.status === 'resolved').length || 0,
        closed: data?.filter(f => f.status === 'closed').length || 0,
      };

      return summary;
    },
  });
}

export function useUpdateFeedback() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      admin_notes 
    }: { 
      id: string; 
      status?: FeedbackStatus; 
      admin_notes?: string;
    }) => {
      const updates: Partial<FeedbackReport> = {};
      if (status) updates.status = status;
      if (admin_notes !== undefined) updates.admin_notes = admin_notes;

      const { error } = await supabase
        .from('feedback_reports')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedbacks'] });
      queryClient.invalidateQueries({ queryKey: ['admin-feedbacks-summary'] });
      toast({
        title: "Feedback atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
