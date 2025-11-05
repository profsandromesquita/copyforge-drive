import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CopyGeneration {
  id: string;
  created_at: string;
  created_by: string;
  workspace_id: string;
  copy_id: string;
  generation_type: string;
  copy_type: string;
  prompt: string;
  parameters: any;
  sessions: any;
  original_content: any;
  project_identity: any;
  audience_segment: any;
  offer: any;
  model_used: string;
  generation_category: 'text' | 'image';
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  profiles: {
    name: string;
    email: string;
    avatar_url: string | null;
  };
  workspaces: {
    name: string;
    avatar_url: string | null;
  };
}

export interface CopyFilters {
  search?: string;
  workspaceId?: string;
  category?: string;
  model?: string;
  startDate?: string;
  endDate?: string;
}

export const useAdminCopies = (filters: CopyFilters = {}, page: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: ["admin-copies", filters, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from("ai_generation_history")
        .select(`
          *,
          profiles!created_by (
            name,
            email,
            avatar_url
          ),
          workspaces (
            name,
            avatar_url
          )
        `, { count: 'exact' })
        .order("created_at", { ascending: false });

      // Aplicar filtros
      if (filters.search) {
        query = query.or(`prompt.ilike.%${filters.search}%,profiles.name.ilike.%${filters.search}%,profiles.email.ilike.%${filters.search}%`);
      }

      if (filters.workspaceId) {
        query = query.eq("workspace_id", filters.workspaceId);
      }

      if (filters.category) {
        query = query.eq("generation_category", filters.category);
      }

      if (filters.model) {
        query = query.eq("model_used", filters.model);
      }

      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte("created_at", filters.endDate);
      }

      // Paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        generations: (data || []) as any as CopyGeneration[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
  });
};

export const useAdminCopyDetails = (generationId: string) => {
  return useQuery({
    queryKey: ["admin-copy-details", generationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_generation_history")
        .select(`
          *,
          profiles!created_by (
            name,
            email,
            avatar_url
          ),
          workspaces (
            name,
            avatar_url
          ),
          copies (
            title
          )
        `)
        .eq("id", generationId)
        .single();

      if (error) throw error;

      return data as any as CopyGeneration & { copies: { title: string } };
    },
    enabled: !!generationId,
  });
};

// Hook para obter lista de workspaces para o filtro
export const useWorkspacesList = () => {
  return useQuery({
    queryKey: ["workspaces-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspaces")
        .select("id, name")
        .order("name");

      if (error) throw error;
      return data;
    },
  });
};
