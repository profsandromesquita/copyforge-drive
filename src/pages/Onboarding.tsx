import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useOnboarding } from "@/hooks/useOnboarding";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import OnboardingStep1 from "@/components/onboarding/OnboardingStep1";
import OnboardingStep2 from "@/components/onboarding/OnboardingStep2";
import OnboardingStep3 from "@/components/onboarding/OnboardingStep3";
import OnboardingStep4 from "@/components/onboarding/OnboardingStep4";
import OnboardingStep5 from "@/components/onboarding/OnboardingStep5";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeWorkspace, workspaces, loading: workspaceLoading } = useWorkspace();
  const { isCompleted, completeOnboarding, saveProgress, loadProgress, clearProgress } = useOnboarding();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [occupation, setOccupation] = useState("");
  const [customOccupation, setCustomOccupation] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectData, setProjectData] = useState({
    name: "",
    sector: "",
    central_purpose: "",
    brand_personality: [] as string[]
  });

  useEffect(() => {
    // Se onboarding já completo, redireciona
    if (isCompleted) {
      navigate('/dashboard');
      return;
    }

    // Carrega progresso salvo
    const saved = loadProgress();
    if (saved) {
      if (saved.currentStep) {
        setCurrentStep(saved.currentStep);
      }
      if (saved.occupation) {
        setOccupation(saved.occupation);
      }
      if (saved.customOccupation) {
        setCustomOccupation(saved.customOccupation);
      }
      if (saved.projectData) {
        setProjectData(saved.projectData);
      }
      if (saved.projectId) {
        setProjectId(saved.projectId);
      }
    }
  }, [isCompleted, navigate, loadProgress]);

  const handleStep1Complete = (selectedOccupation: string, custom?: string) => {
    setOccupation(selectedOccupation);
    setCustomOccupation(custom || "");
    saveProgress({ 
      currentStep: 2,
      occupation: selectedOccupation,
      customOccupation: custom || ""
    });
    setCurrentStep(2);
  };

  const handleStep2Complete = async (workspaceName: string) => {
    setLoading(true);
    try {
      if (!activeWorkspace?.id) {
        toast.error("Workspace não encontrado");
        return;
      }

      // Atualizar nome do workspace
      const { error } = await supabase
        .from('workspaces')
        .update({ name: workspaceName })
        .eq('id', activeWorkspace.id);

      if (error) throw error;

      saveProgress({ 
        currentStep: 3,
        occupation,
        customOccupation 
      });
      setCurrentStep(3);
    } catch (error: any) {
      console.error("Erro ao atualizar workspace:", error);
      toast.error("Erro ao configurar workspace. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Complete = async (data: typeof projectData) => {
    setLoading(true);
    try {
      if (!activeWorkspace?.id) {
        toast.error("Workspace não encontrado");
        return;
      }

      // Cria o projeto
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          workspace_id: activeWorkspace.id,
          created_by: user?.id,
          name: data.name,
          sector: data.sector,
          central_purpose: data.central_purpose,
          brand_personality: data.brand_personality
        })
        .select()
        .single();

      if (error) throw error;

      setProjectId(project.id);
      setProjectData(data);
      saveProgress({ 
        currentStep: 4,
        occupation, 
        customOccupation,
        projectData: data,
        projectId: project.id
      });
      setCurrentStep(4);
    } catch (error: any) {
      console.error("Erro ao criar projeto:", error);
      toast.error("Erro ao criar projeto. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep4Complete = () => {
    saveProgress({ 
      currentStep: 5,
      occupation,
      customOccupation,
      projectData,
      projectId
    });
    setCurrentStep(5);
  };

  const handleOnboardingComplete = async (selectedPlanSlug?: string) => {
    setLoading(true);
    try {
      const finalOccupation = occupation === "Outro" ? customOccupation : occupation;
      const result = await completeOnboarding(finalOccupation);

      if (!result.success) {
        toast.error("Erro ao finalizar onboarding");
        return;
      }

      clearProgress();
      navigate('/dashboard');
    } catch (error) {
      console.error("Erro ao completar onboarding:", error);
      toast.error("Erro ao finalizar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = (currentStep / 5) * 100;
  const firstName = user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário';

  if (workspaceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3">
            <img 
              src="/src/assets/copydrive-logo.png" 
              alt="Copy Drive" 
              className="h-6 sm:h-8"
            />
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">
              {currentStep}/5
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        {currentStep === 1 && (
          <OnboardingStep1 
            firstName={firstName}
            onComplete={handleStep1Complete}
          />
        )}

        {currentStep === 2 && (
          <OnboardingStep2 
            firstName={firstName}
            onComplete={handleStep2Complete}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <OnboardingStep3 
            firstName={firstName}
            onComplete={handleStep3Complete}
            onBack={handleBack}
            loading={loading}
          />
        )}

        {currentStep === 4 && (
          <OnboardingStep4 
            firstName={firstName}
            onComplete={handleStep4Complete}
            onBack={handleBack}
          />
        )}

        {currentStep === 5 && (
          <OnboardingStep5 
            workspaceId={activeWorkspace?.id || ""}
            onComplete={handleOnboardingComplete}
            onBack={handleBack}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default Onboarding;
