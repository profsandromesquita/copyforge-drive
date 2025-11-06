import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Coins } from "phosphor-react";
import { useNavigate } from "react-router-dom";

interface InsufficientCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance?: number;
  estimatedCost?: number;
}

export const InsufficientCreditsModal = ({ 
  open, 
  onOpenChange,
  currentBalance = 0,
  estimatedCost = 0
}: InsufficientCreditsModalProps) => {
  const navigate = useNavigate();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-red-100">
              <Coins size={24} className="text-red-600" weight="fill" />
            </div>
            <AlertDialogTitle className="text-xl">Créditos Insuficientes</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 text-base">
            <p>Seu workspace não tem créditos suficientes para realizar esta geração.</p>
            
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo atual:</span>
                <span className="font-semibold">{currentBalance.toFixed(2)} créditos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custo estimado:</span>
                <span className="font-semibold text-red-600">{estimatedCost.toFixed(2)} créditos</span>
              </div>
            </div>

            <p className="text-sm">
              Entre em contato com um administrador do workspace para adicionar mais créditos.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={() => {
            onOpenChange(false);
            navigate('/dashboard');
          }}>
            Voltar ao Dashboard
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
