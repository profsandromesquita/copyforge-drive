import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWorkspace } from "./useWorkspace";

interface CreditCheckResult {
  has_sufficient_credits: boolean;
  current_balance: number;
  estimated_debit: number;
  error?: string;
}

export const useCopyGeneration = () => {
  const [checking, setChecking] = useState(false);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [creditInfo, setCreditInfo] = useState<{ current_balance: number; estimated_debit: number } | null>(null);
  const { activeWorkspace } = useWorkspace();

  const checkCreditsBeforeGenerate = async (): Promise<boolean> => {
    if (!activeWorkspace?.id) {
      toast.error("Workspace não encontrado");
      return false;
    }

    setChecking(true);
    try {
      const { data, error } = await supabase.rpc('check_workspace_credits', {
        p_workspace_id: activeWorkspace.id,
        estimated_tokens: 5000,
        p_model_name: 'google/gemini-2.5-flash'
      });

      if (error) {
        console.error('Error checking credits:', error);
        toast.error('Erro ao verificar créditos');
        return false;
      }

      const result = data as unknown as CreditCheckResult;

      if (!result.has_sufficient_credits) {
        setCreditInfo({
          current_balance: result.current_balance,
          estimated_debit: result.estimated_debit
        });
        setInsufficientCredits(true);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking credits:', error);
      toast.error('Erro ao verificar créditos');
      return false;
    } finally {
      setChecking(false);
    }
  };

  const closeInsufficientCreditsModal = () => {
    setInsufficientCredits(false);
    setCreditInfo(null);
  };

  return {
    checking,
    insufficientCredits,
    creditInfo,
    checkCreditsBeforeGenerate,
    closeInsufficientCreditsModal
  };
};
