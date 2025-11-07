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
  was_auto_routed: boolean;
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
      // Buscar dados do histórico
      let historyQuery = supabase
        .from("ai_generation_history")
        .select("*", { count: 'exact' })
        .order("created_at", { ascending: false });

      // Aplicar filtros
      if (filters.search) {
        historyQuery = historyQuery.ilike("prompt", `%${filters.search}%`);
      }

      if (filters.workspaceId) {
        historyQuery = historyQuery.eq("workspace_id", filters.workspaceId);
      }

      if (filters.category) {
        historyQuery = historyQuery.eq("generation_category", filters.category);
      }

      if (filters.model) {
        historyQuery = historyQuery.eq("model_used", filters.model);
      }

      if (filters.startDate) {
        historyQuery = historyQuery.gte("created_at", filters.startDate);
      }

      if (filters.endDate) {
        historyQuery = historyQuery.lte("created_at", filters.endDate);
      }

      // Paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      historyQuery = historyQuery.range(from, to);

      const { data: historyData, error: historyError, count } = await historyQuery;

      if (historyError) throw historyError;

      // Buscar dados de profiles e workspaces separadamente
      const userIds = [...new Set((historyData || []).map(h => h.created_by).filter(Boolean))];
      const workspaceIds = [...new Set((historyData || []).map(h => h.workspace_id).filter(Boolean))];

      const [profilesRes, workspacesRes] = await Promise.all([
        userIds.length > 0 
          ? supabase.from("profiles").select("id, name, email, avatar_url").in("id", userIds)
          : Promise.resolve({ data: [], error: null }),
        workspaceIds.length > 0
          ? supabase.from("workspaces").select("id, name, avatar_url").in("id", workspaceIds)
          : Promise.resolve({ data: [], error: null })
      ]);

      // Criar maps para lookup rápido
      const profilesMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
      const workspacesMap = new Map((workspacesRes.data || []).map(w => [w.id, w]));

      // Combinar dados
      const generations = (historyData || []).map(history => ({
        ...history,
        profiles: history.created_by ? profilesMap.get(history.created_by) : null,
        workspaces: history.workspace_id ? workspacesMap.get(history.workspace_id) : null,
      }));

      return {
        generations: generations as any as CopyGeneration[],
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
      // Buscar histórico
      const { data: historyData, error } = await supabase
        .from("ai_generation_history")
        .select("*")
        .eq("id", generationId)
        .single();

      if (error) throw error;
      if (!historyData) throw new Error("Generation not found");

      // Buscar dados relacionados
      const [profileRes, workspaceRes, copyRes] = await Promise.all([
        historyData.created_by 
          ? supabase.from("profiles").select("name, email, avatar_url").eq("id", historyData.created_by).single()
          : Promise.resolve({ data: null, error: null }),
        historyData.workspace_id
          ? supabase.from("workspaces").select("name, avatar_url").eq("id", historyData.workspace_id).single()
          : Promise.resolve({ data: null, error: null }),
        historyData.copy_id
          ? supabase.from("copies").select("title").eq("id", historyData.copy_id).maybeSingle()
          : Promise.resolve({ data: null, error: null })
      ]);

      return {
        ...historyData,
        profiles: profileRes.data,
        workspaces: workspaceRes.data,
        copies: copyRes.data,
      } as any as CopyGeneration & { copies: { title: string } };
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
