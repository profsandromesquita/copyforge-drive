import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface OnboardingData {
  occupation: string;
  projectData: {
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

  const saveProgress = (data: Partial<OnboardingData>) => {
    localStorage.setItem('onboarding_progress', JSON.stringify(data));
  };

  const loadProgress = (): Partial<OnboardingData> | null => {
    const saved = localStorage.getItem('onboarding_progress');
    return saved ? JSON.parse(saved) : null;
  };

  const clearProgress = () => {
    localStorage.removeItem('onboarding_progress');
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
