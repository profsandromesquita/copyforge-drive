import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AICharacteristic {
  id: string;
  category: 'objetivos' | 'estilos' | 'tamanhos' | 'preferencias' | 'frameworks' | 'foco_emocional';
  value: string;
  label: string;
  description?: string;
  ai_instruction?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCharacteristicParams {
  category: string;
  value: string;
  label: string;
  description?: string;
  display_order?: number;
}

export interface UpdateCharacteristicParams {
  id: string;
  label?: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}

export function useAICharacteristics(category?: string) {
  const queryClient = useQueryClient();

  const listCharacteristics = useQuery({
    queryKey: category ? ['ai-characteristics', category] : ['ai-characteristics'],
    queryFn: async () => {
      let query = supabase
        .from('ai_characteristics')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as AICharacteristic[];
    }
  });

  const createCharacteristic = useMutation({
    mutationFn: async (params: CreateCharacteristicParams) => {
      const { error } = await supabase
        .from('ai_characteristics')
        .insert({
          category: params.category,
          value: params.value.toLowerCase().replace(/\s+/g, '_'),
          label: params.label,
          description: params.description,
          display_order: params.display_order || 999,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-characteristics'] });
      toast.success('Característica criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error creating characteristic:', error);
      if (error.code === '23505') {
        toast.error('Já existe uma característica com esse valor nesta categoria');
      } else {
        toast.error('Erro ao criar característica');
      }
    }
  });

  const updateCharacteristic = useMutation({
    mutationFn: async (params: UpdateCharacteristicParams) => {
      const { id, ...updates } = params;
      
      const { error } = await supabase
        .from('ai_characteristics')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-characteristics'] });
      toast.success('Característica atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating characteristic:', error);
      toast.error('Erro ao atualizar característica');
    }
  });

  const deleteCharacteristic = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_characteristics')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-characteristics'] });
      toast.success('Característica deletada com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting characteristic:', error);
      toast.error('Erro ao deletar característica');
    }
  });

  const reorderCharacteristics = useMutation({
    mutationFn: async (items: { id: string; display_order: number }[]) => {
      const updates = items.map(item =>
        supabase
          .from('ai_characteristics')
          .update({ display_order: item.display_order })
          .eq('id', item.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        throw errors[0].error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-characteristics'] });
      toast.success('Ordem atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error reordering characteristics:', error);
      toast.error('Erro ao atualizar ordem');
    }
  });

  return {
    characteristics: listCharacteristics.data || [],
    isLoading: listCharacteristics.isLoading,
    createCharacteristic,
    updateCharacteristic,
    deleteCharacteristic,
    reorderCharacteristics,
  };
}
