import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AIPromptTemplate, AIPromptHistory, UpdatePromptParams } from '@/types/ai-prompts';
import { toast } from 'sonner';

export function useAIPrompts() {
  const queryClient = useQueryClient();

  const listPrompts = useQuery({
    queryKey: ['ai-prompts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_prompt_templates')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as AIPromptTemplate[];
    }
  });

  const updatePrompt = useMutation({
    mutationFn: async (params: UpdatePromptParams) => {
      const { id, current_prompt, change_reason } = params;
      
      // Buscar prompt atual para histórico
      const { data: currentData } = await supabase
        .from('ai_prompt_templates')
        .select('current_prompt, prompt_key')
        .eq('id', id)
        .single();

      // Atualizar prompt
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: updateError } = await supabase
        .from('ai_prompt_templates')
        .update({
          current_prompt,
          last_modified_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Salvar no histórico
      if (currentData) {
        await supabase
          .from('ai_prompt_history')
          .insert({
            template_id: id,
            prompt_key: currentData.prompt_key,
            old_prompt: currentData.current_prompt,
            new_prompt: current_prompt,
            modified_by: user?.id,
            change_reason
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-prompts'] });
      toast.success('Prompt atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating prompt:', error);
      toast.error('Erro ao atualizar prompt');
    }
  });

  const restoreDefault = useMutation({
    mutationFn: async (id: string) => {
      // Buscar default_prompt
      const { data: template } = await supabase
        .from('ai_prompt_templates')
        .select('default_prompt, current_prompt, prompt_key')
        .eq('id', id)
        .single();

      if (!template) throw new Error('Template não encontrado');

      const { data: { user } } = await supabase.auth.getUser();

      // Restaurar para default
      const { error } = await supabase
        .from('ai_prompt_templates')
        .update({
          current_prompt: template.default_prompt,
          last_modified_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Registrar no histórico
      await supabase
        .from('ai_prompt_history')
        .insert({
          template_id: id,
          prompt_key: template.prompt_key,
          old_prompt: template.current_prompt,
          new_prompt: template.default_prompt,
          modified_by: user?.id,
          change_reason: 'Restaurado para padrão'
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-prompts'] });
      toast.success('Prompt restaurado para padrão!');
    },
    onError: (error) => {
      console.error('Error restoring prompt:', error);
      toast.error('Erro ao restaurar prompt');
    }
  });

  return {
    prompts: listPrompts.data || [],
    isLoading: listPrompts.isLoading,
    updatePrompt,
    restoreDefault
  };
}
