import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/hooks/useWorkspace';
import { CopyType } from '@/lib/ai-models';

interface UserPromptResponse {
  prompt: string;
  isCustomized: boolean;
}

export const useUserPromptCustomization = (copyType: CopyType) => {
  const { toast } = useToast();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  // Buscar prompt do usuário
  const { data, isLoading, error } = useQuery({
    queryKey: ['user-prompt', copyType, activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) {
        throw new Error('Workspace não encontrado');
      }

      const { data, error } = await supabase.functions.invoke<UserPromptResponse>('get-user-prompt', {
        body: {
          promptKey: copyType,
          workspaceId: activeWorkspace.id,
        },
      });

      if (error) throw error;
      return data;
    },
    enabled: !!activeWorkspace?.id && !!copyType,
  });

  // Salvar personalização
  const saveMutation = useMutation({
    mutationFn: async (customPrompt: string) => {
      if (!activeWorkspace?.id) {
        throw new Error('Workspace não encontrado');
      }

      const { data, error } = await supabase.functions.invoke('save-user-prompt', {
        body: {
          promptKey: copyType,
          workspaceId: activeWorkspace.id,
          customPrompt,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-prompt', copyType, activeWorkspace?.id] });
      toast({
        title: 'Prompt personalizado salvo!',
        description: 'Suas próximas gerações usarão este prompt.',
      });
    },
    onError: (error: Error) => {
      if (error.message.includes('Limite')) {
        toast({
          title: 'Limite atingido',
          description: 'Você atingiu o limite de 10 edições por hora. Aguarde um pouco.',
          variant: 'destructive',
        });
      } else if (error.message.includes('muito longo')) {
        toast({
          title: 'Prompt muito longo',
          description: 'O prompt deve ter no máximo 5000 caracteres.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao salvar',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });

  // Restaurar padrão
  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (!activeWorkspace?.id) {
        throw new Error('Workspace não encontrado');
      }

      const { data, error } = await supabase.functions.invoke('restore-default-prompt', {
        body: {
          promptKey: copyType,
          workspaceId: activeWorkspace.id,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-prompt', copyType, activeWorkspace?.id] });
      toast({
        title: 'Prompt restaurado',
        description: 'O prompt padrão do sistema foi restaurado.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao restaurar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    prompt: data?.prompt || '',
    isCustomized: data?.isCustomized || false,
    isLoading,
    error,
    saveCustomization: saveMutation.mutateAsync,
    restoreDefault: restoreMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isRestoring: restoreMutation.isPending,
  };
};
