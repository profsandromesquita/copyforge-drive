import { useState, useEffect } from "react";
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
import { usePlanOffersPublic } from "@/hooks/usePlanOffersPublic";
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
  const planIds = plans?.map(p => p.id) || [];
  const { data: offersByPlan, isLoading: offersLoading } = usePlanOffersPublic(planIds);
  const { changePlan, isChanging } = useChangePlan();
  
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedOfferId, setSelectedOfferId] = useState<string>("");

  // Quando seleciona um plano, automaticamente seleciona a primeira oferta disponível
  useEffect(() => {
    if (selectedPlanId && offersByPlan?.[selectedPlanId]?.[0]) {
      setSelectedOfferId(offersByPlan[selectedPlanId][0].id);
    }
  }, [selectedPlanId, offersByPlan]);

  const handleChangePlan = async () => {
    if (!selectedOfferId) {
      toast.error("Selecione uma oferta");
      return;
    }

    try {
      await changePlan({
        workspaceId,
        planOfferId: selectedOfferId,
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

  const selectedPlan = plans?.find(p => p.id === selectedPlanId);
  const availableOffers = selectedPlanId && offersByPlan ? offersByPlan[selectedPlanId] || [] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alterar Plano do Workspace</DialogTitle>
          <DialogDescription>
            Selecione o novo plano e a forma de pagamento para este workspace
          </DialogDescription>
        </DialogHeader>

        {plansLoading || offersLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Plans Selection */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Plano</Label>
              <RadioGroup
                value={selectedPlanId}
                onValueChange={setSelectedPlanId}
                className="space-y-3"
              >
                {plans?.map((plan) => {
                  const planOffers = offersByPlan?.[plan.id] || [];
                  const hasOffers = planOffers.length > 0;
                  
                  return (
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
                              {!hasOffers && (
                                <Badge variant="outline" className="text-xs">Sem ofertas</Badge>
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
                        {hasOffers && (
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {planOffers.length} oferta{planOffers.length > 1 ? 's' : ''} disponível{planOffers.length > 1 ? 'is' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </RadioGroup>
            </div>

            {/* Offer Selection */}
            {selectedPlan && availableOffers.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-3 block">Forma de Pagamento</Label>
                <RadioGroup
                  value={selectedOfferId}
                  onValueChange={setSelectedOfferId}
                  className="space-y-2"
                >
                  {availableOffers.map((offer) => (
                    <Card
                      key={offer.id}
                      className={`p-3 cursor-pointer transition-all ${
                        selectedOfferId === offer.id
                          ? "border-primary ring-2 ring-primary/20"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedOfferId(offer.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={offer.id} id={offer.id} />
                          <div>
                            <Label htmlFor={offer.id} className="font-medium cursor-pointer">
                              {offer.name}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {offer.billing_period_value} {
                                offer.billing_period_unit === 'months' ? 'meses' :
                                offer.billing_period_unit === 'days' ? 'dias' :
                                offer.billing_period_unit === 'years' ? 'anos' : 'vitalício'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">
                            {formatCurrency(offer.price)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </RadioGroup>
              </div>
            )}

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
                disabled={!selectedOfferId || isChanging || selectedPlanId === currentPlanId}
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
