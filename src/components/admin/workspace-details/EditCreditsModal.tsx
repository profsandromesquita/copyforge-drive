import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface EditCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  currentBalance: number;
}

export const EditCreditsModal = ({
  open,
  onOpenChange,
  workspaceId,
  currentBalance,
}: EditCreditsModalProps) => {
  const queryClient = useQueryClient();
  const [newBalance, setNewBalance] = useState("");
  const [description, setDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Atualizar o valor quando o modal abrir com o saldo atual
  useEffect(() => {
    if (open) {
      setNewBalance(currentBalance.toFixed(2));
      setDescription("");
    }
  }, [open, currentBalance]);

  const handleUpdateCredits = async () => {
    const numBalance = parseFloat(newBalance);
    
    if (isNaN(numBalance) || numBalance < 0) {
      toast.error("Digite um valor válido maior ou igual a zero");
      return;
    }

    const difference = numBalance - currentBalance;

    setIsUpdating(true);
    try {
      // Se a diferença for zero, não fazer nada
      if (difference === 0) {
        toast.info("O saldo já está no valor especificado");
        onOpenChange(false);
        return;
      }

      // Adicionar ou remover créditos baseado na diferença
      const { data, error } = await supabase.rpc("add_workspace_credits", {
        p_workspace_id: workspaceId,
        amount: difference,
        description: description || `Ajuste manual de créditos (${difference > 0 ? '+' : ''}${difference.toFixed(2)})`,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; balance?: number };

      if (result?.success) {
        toast.success(
          difference > 0 
            ? `${difference.toFixed(2)} créditos adicionados!` 
            : `${Math.abs(difference).toFixed(2)} créditos removidos!`
        );
        queryClient.invalidateQueries({ queryKey: ["workspace-credits", workspaceId] });
        queryClient.invalidateQueries({ queryKey: ["workspace-subscription", workspaceId] });
        onOpenChange(false);
      } else {
        throw new Error(result?.error || "Erro ao atualizar créditos");
      }
    } catch (error: any) {
      console.error("Error updating credits:", error);
      toast.error(error.message || "Erro ao atualizar créditos");
    } finally {
      setIsUpdating(false);
    }
  };

  const difference = parseFloat(newBalance) - currentBalance;
  const isValid = !isNaN(parseFloat(newBalance)) && parseFloat(newBalance) >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Créditos do Workspace</DialogTitle>
          <DialogDescription>
            Ajuste o saldo de créditos do workspace. As alterações serão registradas no histórico de transações.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Saldo atual:</span>
              <span className="font-semibold">{currentBalance.toFixed(2)} créditos</span>
            </div>
            {isValid && difference !== 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Diferença:</span>
                <span className={`font-semibold ${difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {difference > 0 ? '+' : ''}{difference.toFixed(2)} créditos
                </span>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="newBalance">Novo Saldo de Créditos</Label>
            <Input
              id="newBalance"
              type="number"
              placeholder="Ex: 100.00"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              min="0"
              step="0.01"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Digite o novo saldo total de créditos
            </p>
          </div>

          {difference < 0 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                  Atenção: Você está removendo créditos
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  Serão removidos {Math.abs(difference).toFixed(2)} créditos do workspace.
                </p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="description">Motivo da Alteração (Opcional)</Label>
            <Textarea
              id="description"
              placeholder="Ex: Correção de saldo, Ajuste administrativo, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Descreva o motivo desta alteração (aparecerá no histórico)
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateCredits} 
              disabled={isUpdating || !isValid || difference === 0}
              variant={difference < 0 ? "destructive" : "default"}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Atualizando...
                </>
              ) : (
                difference > 0 ? "Adicionar Créditos" : 
                difference < 0 ? "Remover Créditos" : 
                "Atualizar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
