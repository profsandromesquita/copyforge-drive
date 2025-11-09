import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useWorkspaceCredits } from "@/hooks/useWorkspaceCredits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";

export const WorkspaceCredits = () => {
  const { activeWorkspace } = useWorkspace();
  const { data: credits, refetch } = useWorkspaceCredits();
  const [threshold, setThreshold] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const handleSaveThreshold = async () => {
    if (!activeWorkspace?.id || !threshold) return;

    const numericThreshold = parseFloat(threshold);
    
    if (isNaN(numericThreshold) || numericThreshold < 0) {
      toast.error("Por favor, insira um valor válido");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('workspace_credits')
        .update({ 
          low_credit_threshold: numericThreshold,
          low_credit_alert_shown: false // Reset alert flag ao mudar o limite
        })
        .eq('workspace_id', activeWorkspace.id);

      if (error) throw error;

      toast.success("Limite de alerta atualizado com sucesso!");
      refetch();
      setThreshold("");
    } catch (error) {
      console.error("Error updating threshold:", error);
      toast.error("Erro ao atualizar limite de alerta");
    } finally {
      setSaving(false);
    }
  };

  if (!credits) return null;

  const currentThreshold = credits.low_credit_threshold;
  const isLowBalance = credits.balance < currentThreshold;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Saldo de Créditos</CardTitle>
          <CardDescription className="text-xs">
            Visualize o saldo atual e configure alertas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Saldo Atual</p>
              <p className={`text-2xl font-bold ${isLowBalance ? 'text-red-600' : 'text-green-600'}`}>
                {credits.balance.toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Usado</p>
              <p className="text-2xl font-bold">{credits.total_used.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Adicionado</p>
              <p className="text-2xl font-bold">{credits.total_added.toFixed(2)}</p>
            </div>
          </div>

          {isLowBalance && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertTriangle className="text-red-600 h-5 w-5" />
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                Atenção: Seu saldo está abaixo do limite configurado de {currentThreshold.toFixed(0)} créditos
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configurar Limite de Alerta</CardTitle>
          <CardDescription className="text-xs">
            Defina quando deseja ser notificado sobre créditos baixos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="threshold">Limite atual: {currentThreshold.toFixed(0)} créditos</Label>
            <div className="flex gap-2">
              <Input
                id="threshold"
                type="number"
                min="0"
                step="1"
                placeholder={`Atual: ${currentThreshold.toFixed(0)}`}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="max-w-xs"
              />
              <Button 
                onClick={handleSaveThreshold} 
                disabled={saving || !threshold}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Atualizar Limite
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Recomendamos manter o limite em pelo menos 10 créditos para garantir operação contínua.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
