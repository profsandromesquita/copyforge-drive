import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useToast } from '@/hooks/use-toast';

export type FeedbackCategory = 'bug' | 'suggestion' | 'question' | 'other';

interface FeedbackContext {
  pageUrl: string;
  userAgent: string;
  screenResolution: string;
}

function captureContext(): FeedbackContext {
  return {
    pageUrl: window.location.href,
    userAgent: navigator.userAgent,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
  };
}

export function useFeedback() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { toast } = useToast();

  const submitFeedback = async (
    category: FeedbackCategory,
    description: string
  ): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para enviar feedback.',
        variant: 'destructive',
      });
      return false;
    }

    if (!description.trim() || description.trim().length < 10) {
      toast({
        title: 'Erro',
        description: 'A descrição deve ter pelo menos 10 caracteres.',
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);

    try {
      const context = captureContext();

      const { error } = await supabase.from('feedback_reports').insert({
        user_id: user.id,
        workspace_id: activeWorkspace?.id || null,
        page_url: context.pageUrl,
        user_agent: context.userAgent,
        screen_resolution: context.screenResolution,
        category,
        description: description.trim(),
      });

      if (error) throw error;

      toast({
        title: 'Feedback enviado!',
        description: 'Obrigado por nos ajudar a melhorar o CopyDrive.',
      });

      return true;
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar seu feedback. Tente novamente.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    submitFeedback,
    isLoading,
  };
}
