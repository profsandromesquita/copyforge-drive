import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface OnboardingData {
  currentStep?: number;
  occupation?: string;
  customOccupation?: string;
  projectId?: string;
  projectData?: {
    name: string;
    sector: string;
    central_purpose: string;
    brand_personality: string[];
  };
}

export const useOnboarding = () => {
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setIsCompleted(data.onboarding_completed ?? false);
      }
      setLoading(false);
    };

    checkOnboardingStatus();
  }, [user]);

  const completeOnboarding = async (occupation: string) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const { error } = await supabase
      .from('profiles')
      .update({ 
        occupation, 
        onboarding_completed: true 
      })
      .eq('id', user.id);

    if (error) {
      console.error('Erro ao completar onboarding:', error);
      return { success: false, error: error.message };
    }

    setIsCompleted(true);
    return { success: true };
  };

  const saveProgress = async (data: Partial<OnboardingData>) => {
    if (!user) return;
    
    const updateData: any = {};
    
    if (data.currentStep !== undefined) {
      updateData.onboarding_current_step = data.currentStep;
    }
    if (data.occupation !== undefined) {
      updateData.occupation = data.occupation;
    }
    if (data.customOccupation !== undefined) {
      updateData.onboarding_custom_occupation = data.customOccupation;
    }
    if (data.projectId !== undefined) {
      updateData.onboarding_project_id = data.projectId;
    }
    if (data.projectData !== undefined) {
      updateData.onboarding_project_data = data.projectData;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (error) {
      console.error('Erro ao salvar progresso:', error);
    }
  };

  const loadProgress = async (): Promise<Partial<OnboardingData> | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_current_step, occupation, onboarding_custom_occupation, onboarding_project_id, onboarding_project_data')
      .eq('id', user.id)
      .single();

    if (error || !data) return null;

    return {
      currentStep: data.onboarding_current_step ?? 1,
      occupation: data.occupation ?? undefined,
      customOccupation: data.onboarding_custom_occupation ?? undefined,
      projectId: data.onboarding_project_id ?? undefined,
      projectData: data.onboarding_project_data ? data.onboarding_project_data as {
        name: string;
        sector: string;
        central_purpose: string;
        brand_personality: string[];
      } : undefined
    };
  };

  const clearProgress = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        onboarding_current_step: 1,
        onboarding_custom_occupation: null,
        onboarding_project_id: null,
        onboarding_project_data: null
      })
      .eq('id', user.id);

    if (error) {
      console.error('Erro ao limpar progresso:', error);
    }
  };

  return {
    isCompleted,
    loading,
    completeOnboarding,
    saveProgress,
    loadProgress,
    clearProgress
  };
};
