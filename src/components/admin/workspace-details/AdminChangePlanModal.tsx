import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { useChangePlan } from "@/hooks/useChangePlan";
import { toast } from "sonner";

interface AdminChangePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  currentPlanId: string | undefined;
}

export const AdminChangePlanModal = ({
  open,
  onOpenChange,
  workspaceId,
  currentPlanId,
}: AdminChangePlanModalProps) => {
  const { plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { changePlan, isChanging } = useChangePlan();
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<"monthly" | "annual">("monthly");

  const handleChangePlan = async () => {
    if (!selectedPlanId) {
      toast.error("Selecione um plano");
      return;
    }

    try {
      await changePlan({
        workspaceId,
        newPlanId: selectedPlanId,
        billingCycle: selectedBillingCycle,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error changing plan:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alterar Plano do Workspace</DialogTitle>
          <DialogDescription>
            Selecione o novo plano e o ciclo de cobrança para este workspace
          </DialogDescription>
        </DialogHeader>

        {plansLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Billing Cycle Selection */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Ciclo de Cobrança</Label>
              <RadioGroup
                value={selectedBillingCycle}
                onValueChange={(value) => setSelectedBillingCycle(value as "monthly" | "annual")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly" className="cursor-pointer">Mensal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="annual" id="annual" />
                  <Label htmlFor="annual" className="cursor-pointer">Anual (economia)</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Plans Selection */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Plano</Label>
              <RadioGroup
                value={selectedPlanId}
                onValueChange={setSelectedPlanId}
                className="space-y-3"
              >
                {plans?.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedPlanId === plan.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "hover:border-primary/50"
                    } ${currentPlanId === plan.id ? "bg-muted/50" : ""}`}
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={plan.id} id={plan.id} />
                        <div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={plan.id} className="text-base font-semibold cursor-pointer">
                              {plan.name}
                            </Label>
                            {currentPlanId === plan.id && (
                              <Badge variant="secondary">Atual</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {plan.description}
                          </p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span>
                              Projetos: {plan.max_projects || "Ilimitados"}
                            </span>
                            <span>
                              Copies: {plan.max_copies || "Ilimitadas"}
                            </span>
                            <span>
                              Copy AI: {plan.copy_ai_enabled ? "✓" : "✗"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {selectedBillingCycle === "monthly"
                            ? formatCurrency(plan.monthly_price)
                            : formatCurrency(plan.annual_price)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedBillingCycle === "monthly" ? "/mês" : "/ano"}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </RadioGroup>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isChanging}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleChangePlan}
                disabled={!selectedPlanId || isChanging || selectedPlanId === currentPlanId}
              >
                {isChanging ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Alterando...
                  </>
                ) : (
                  "Alterar Plano"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
