import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface AdminAddCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

export const AdminAddCreditsModal = ({
  open,
  onOpenChange,
  workspaceId,
}: AdminAddCreditsModalProps) => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddCredits = async () => {
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error("Digite um valor válido maior que zero");
      return;
    }

    setIsAdding(true);
    try {
      const { data, error } = await supabase.rpc("add_workspace_credits", {
        p_workspace_id: workspaceId,
        amount: numAmount,
        description: description || null,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; balance?: number };

      if (result?.success) {
        toast.success(`${numAmount} créditos adicionados com sucesso!`);
        queryClient.invalidateQueries({ queryKey: ["workspace-credits", workspaceId] });
        queryClient.invalidateQueries({ queryKey: ["workspace-subscription", workspaceId] });
        setAmount("");
        setDescription("");
        onOpenChange(false);
      } else {
        throw new Error(result?.error || "Erro ao adicionar créditos");
      }
    } catch (error: any) {
      console.error("Error adding credits:", error);
      toast.error(error.message || "Erro ao adicionar créditos");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Créditos</DialogTitle>
          <DialogDescription>
            Adicione créditos manualmente ao workspace. Esta ação será registrada no histórico de transações.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Quantidade de Créditos</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Ex: 100.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Digite a quantidade de créditos a adicionar
            </p>
          </div>

          <div>
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Textarea
              id="description"
              placeholder="Ex: Créditos promocionais, Bônus de upgrade, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Motivo da adição de créditos (aparecerá no histórico)
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAdding}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddCredits} disabled={isAdding}>
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adicionando...
                </>
              ) : (
                "Adicionar Créditos"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
