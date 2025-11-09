import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';

interface LimitCheckResult {
  allowed: boolean;
  current?: number;
  limit?: number;
  unlimited?: boolean;
  error?: string;
}

export const usePlanLimits = () => {
  const { activeWorkspace } = useWorkspace();

  const checkProjectLimit = useCallback(async (): Promise<LimitCheckResult> => {
    if (!activeWorkspace?.id) {
      return { allowed: false, error: 'no_workspace' };
    }

    try {
      const { data, error } = await supabase.rpc('check_plan_limit', {
        p_workspace_id: activeWorkspace.id,
        p_limit_type: 'projects'
      });

      if (error) throw error;
      return (data as any) as LimitCheckResult;
    } catch (error) {
      console.error('Error checking project limit:', error);
      return { allowed: false, error: 'check_failed' };
    }
  }, [activeWorkspace?.id]);

  const checkCopyLimit = useCallback(async (): Promise<LimitCheckResult> => {
    if (!activeWorkspace?.id) {
      return { allowed: false, error: 'no_workspace' };
    }

    try {
      const { data, error } = await supabase.rpc('check_plan_limit', {
        p_workspace_id: activeWorkspace.id,
        p_limit_type: 'copies'
      });

      if (error) throw error;
      return (data as any) as LimitCheckResult;
    } catch (error) {
      console.error('Error checking copy limit:', error);
      return { allowed: false, error: 'check_failed' };
    }
  }, [activeWorkspace?.id]);

  const checkCopyAI = useCallback(async (): Promise<LimitCheckResult> => {
    if (!activeWorkspace?.id) {
      return { allowed: false, error: 'no_workspace' };
    }

    try {
      const { data, error } = await supabase.rpc('check_plan_limit', {
        p_workspace_id: activeWorkspace.id,
        p_limit_type: 'copy_ai'
      });

      if (error) throw error;
      return (data as any) as LimitCheckResult;
    } catch (error) {
      console.error('Error checking Copy AI:', error);
      return { allowed: false, error: 'check_failed' };
    }
  }, [activeWorkspace?.id]);

  return {
    checkProjectLimit,
    checkCopyLimit,
    checkCopyAI,
  };
};
