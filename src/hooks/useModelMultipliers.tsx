import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ModelMultiplier {
  model_name: string;
  display_name: string;
  multiplier: number;
}

export const useModelMultipliers = () => {
  return useQuery({
    queryKey: ['model-multipliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('model_multipliers')
        .select('model_name, display_name, multiplier');
      
      if (error) throw error;
      
      // Retornar mapa para fácil acesso
      const multiplierMap = data.reduce((acc, item) => ({
        ...acc,
        [item.model_name]: item.multiplier
      }), {} as Record<string, number>);
      
      return {
        multipliers: multiplierMap,
        list: data as ModelMultiplier[]
      };
    }
  });
};
