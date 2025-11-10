import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { PlanComparisonCard } from "./PlanComparisonCard";
import { useChangePlan } from "@/hooks/useChangePlan";
import { WorkspaceSubscription } from "@/hooks/useWorkspaceSubscription";
import { PlanOffer } from "@/hooks/usePlanOffers";
import { formatCurrency } from "@/lib/utils";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  monthly_price: number;
  annual_price: number;
  max_projects: number | null;
  max_copies: number | null;
  copy_ai_enabled: boolean;
  credits_per_month: number;
}

interface PlanChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubscription: WorkspaceSubscription;
  newPlan: SubscriptionPlan;
  availableOffers: PlanOffer[];
  workspaceId: string;
}

export const PlanChangeModal = ({ 
  isOpen, 
  onClose, 
  currentSubscription, 
  newPlan, 
  availableOffers,
  workspaceId 
}: PlanChangeModalProps) => {
  const { changePlan, isChanging } = useChangePlan();
  const [selectedOfferId, setSelectedOfferId] = useState<string>(availableOffers[0]?.id || "");

  const currentPlan = currentSubscription.plan;
  const selectedOffer = availableOffers.find(o => o.id === selectedOfferId);
  
  const isUpgrade = selectedOffer 
    ? selectedOffer.price > (currentSubscription.billing_cycle === 'monthly' ? currentPlan.monthly_price : currentPlan.annual_price)
    : false;
  
  const newPrice = selectedOffer?.price || 0;
  const monthlyEquivalent = selectedOffer?.billing_period_unit === 'months' && selectedOffer.billing_period_value > 1
    ? newPrice / selectedOffer.billing_period_value
    : newPrice;

  // Validações de downgrade
  const projectsExceed = newPlan.max_projects !== null && 
                         currentSubscription.projects_count > newPlan.max_projects;
  const copiesExceed = newPlan.max_copies !== null && 
                       currentSubscription.copies_count > newPlan.max_copies;
  const hasBlockingIssues = projectsExceed || copiesExceed;

  const handleConfirm = () => {
    if (hasBlockingIssues || !selectedOfferId) return;
    
    changePlan({
      workspaceId,
      planOfferId: selectedOfferId,
    }, {
      onSuccess: (data) => {
        if (data?.success && !data.requires_payment) {
          onClose();
        }
      }
    });
  };

  const features = [
    {
      label: "Projetos",
      current: currentSubscription.current_max_projects,
      new: newPlan.max_projects,
      isLimit: true,
    },
    {
      label: "Copies",
      current: currentSubscription.current_max_copies,
      new: newPlan.max_copies,
      isLimit: true,
    },
    {
      label: "Créditos/Mês",
      current: currentPlan.credits_per_month,
      new: newPlan.credits_per_month,
    },
    {
      label: "Copy IA",
      current: currentPlan.copy_ai_enabled,
      new: newPlan.copy_ai_enabled,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isUpgrade ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-orange-500" />
            )}
            <DialogTitle>
              {isUpgrade ? 'Fazer Upgrade' : 'Fazer Downgrade'} de Plano
            </DialogTitle>
          </div>
          <DialogDescription>
            Revise as mudanças antes de confirmar a alteração do plano
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Comparação de Planos */}
          <PlanComparisonCard
            currentPlanName={currentPlan.name}
            newPlanName={newPlan.name}
            features={features}
          />

          {/* Seleção de Oferta */}
          {availableOffers.length > 1 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Selecione a forma de pagamento</Label>
              <RadioGroup value={selectedOfferId} onValueChange={setSelectedOfferId}>
                {availableOffers.map((offer) => (
                  <div key={offer.id} className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value={offer.id} id={offer.id} />
                    <Label htmlFor={offer.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{offer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {offer.billing_period_value} {offer.billing_period_unit === 'months' ? 'meses' : offer.billing_period_unit === 'days' ? 'dias' : 'anos'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(offer.price)}</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Informações de Preço */}
          {selectedOffer && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Novo valor</span>
                <Badge variant={isUpgrade ? "default" : "secondary"}>
                  {selectedOffer.name}
                </Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{formatCurrency(monthlyEquivalent)}</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              {selectedOffer.billing_period_value > 1 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Cobrado {formatCurrency(newPrice)} a cada {selectedOffer.billing_period_value} {
                    selectedOffer.billing_period_unit === 'months' ? 'meses' : selectedOffer.billing_period_unit === 'days' ? 'dias' : 'anos'
                  }
                </p>
              )}
            </div>
          )}

          {/* Avisos de Validação */}
          {hasBlockingIssues && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">Não é possível fazer downgrade:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {projectsExceed && (
                    <li>
                      Você possui {currentSubscription.projects_count} projetos, mas o plano {newPlan.name} permite apenas {newPlan.max_projects}. 
                      Delete {currentSubscription.projects_count - newPlan.max_projects!} projeto(s) primeiro.
                    </li>
                  )}
                  {copiesExceed && (
                    <li>
                      Você possui {currentSubscription.copies_count} copies, mas o plano {newPlan.name} permite apenas {newPlan.max_copies}. 
                      Delete {currentSubscription.copies_count - newPlan.max_copies!} cop{currentSubscription.copies_count - newPlan.max_copies! > 1 ? 'ies' : 'y'} primeiro.
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {!hasBlockingIssues && isUpgrade && newPrice > 0 && (
            <Alert>
              <AlertDescription className="text-sm">
                A mudança será processada imediatamente. Você receberá os créditos do novo plano automaticamente.
              </AlertDescription>
            </Alert>
          )}

          {!hasBlockingIssues && !isUpgrade && (
            <Alert>
              <AlertDescription className="text-sm">
                O downgrade entrará em vigor imediatamente. Os créditos do novo plano serão adicionados ao seu saldo atual.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isChanging}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={hasBlockingIssues || isChanging || !selectedOfferId}
            variant={isUpgrade ? "default" : "secondary"}
          >
            {isChanging ? 'Processando...' : 'Confirmar Mudança'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
