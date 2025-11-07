import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useWorkspaceCredits } from "./useWorkspaceCredits";
import { useWorkspace } from "./useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";

export const useCreditAlert = () => {
  const { data: credits } = useWorkspaceCredits();
  const { activeWorkspace } = useWorkspace();
  const hasShownAlert = useRef(false);

  useEffect(() => {
    const checkAndNotify = async () => {
      if (!credits || !activeWorkspace?.id || hasShownAlert.current) return;

      const { balance, low_credit_threshold, low_credit_alert_shown } = credits;
      
      // Verifica se o saldo está abaixo do limite e se o alerta ainda não foi mostrado
      if (balance < low_credit_threshold && !low_credit_alert_shown) {
        // Marca o alerta como exibido no banco de dados
        await supabase
          .from('workspace_credits')
          .update({ low_credit_alert_shown: true })
          .eq('workspace_id', activeWorkspace.id);

        // Mostra o toast de alerta
        toast.error("Créditos baixos!", {
          description: `Seu saldo está em ${balance.toFixed(2)} créditos. Limite configurado: ${low_credit_threshold.toFixed(0)} créditos.`,
          icon: <AlertTriangle className="text-red-600" />,
          duration: 10000,
          action: {
            label: "Ver detalhes",
            onClick: () => {
              // Pode navegar para página de créditos ou settings
              window.location.href = "/";
            },
          },
        });

        hasShownAlert.current = true;
      }

      // Se créditos foram adicionados e o saldo voltou acima do limite, reseta o flag
      if (balance >= low_credit_threshold && low_credit_alert_shown) {
        await supabase
          .from('workspace_credits')
          .update({ low_credit_alert_shown: false })
          .eq('workspace_id', activeWorkspace.id);
        
        hasShownAlert.current = false;
      }
    };

    checkAndNotify();
  }, [credits, activeWorkspace?.id]);

  return {
    isLowBalance: credits ? credits.balance < credits.low_credit_threshold : false,
    threshold: credits?.low_credit_threshold || 10,
  };
};
