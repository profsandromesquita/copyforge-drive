import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, X, AlertCircle, Loader2 } from "lucide-react";
import { useChangePlan } from "@/hooks/useChangePlan";
import { useWorkspaceOffer } from "@/hooks/useWorkspaceOffer";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { PublicPlanOffer } from "@/hooks/usePlanOffersPublic";

interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  max_projects: number | null;
  max_copies: number | null;
  copy_ai_enabled: boolean;
}

interface WorkspaceSubscription {
  id: string;
  workspace_id: string;
  plan: SubscriptionPlan;
  billing_cycle: 'monthly' | 'annual' | 'free';
  status: string;
  projects_count: number;
  copies_count: number;
  plan_offer_id?: string | null;
}

interface PlanChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubscription: WorkspaceSubscription;
  newPlan: SubscriptionPlan;
  availableOffers: PublicPlanOffer[];
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
  const [selectedOfferId, setSelectedOfferId] = useState<string>('');
  const { data: currentOffer } = useWorkspaceOffer(workspaceId);

  const currentPlan: SubscriptionPlan = currentSubscription.plan;

  useEffect(() => {
    if (availableOffers.length > 0 && !selectedOfferId) {
      setSelectedOfferId(availableOffers[0].id);
    }
  }, [availableOffers, selectedOfferId]);

  const selectedOffer = availableOffers.find(o => o.id === selectedOfferId);
  
  const isUpgrade = selectedOffer && currentOffer
    ? selectedOffer.price > currentOffer.price
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

  const handleConfirm = async () => {
    if (hasBlockingIssues || !selectedOfferId) return;
    
    try {
      await changePlan({
        workspaceId,
        planOfferId: selectedOfferId,
      });
      
      toast.success(
        isUpgrade 
          ? 'Upgrade realizado com sucesso!' 
          : 'Plano alterado com sucesso!'
      );
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar plano');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isUpgrade ? 'Fazer Upgrade de Plano' : 'Alterar Plano'}
          </DialogTitle>
          <DialogDescription>
            Revise as mudanças antes de confirmar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Plano Atual</p>
              <div className="p-4 rounded-lg border bg-muted/50">
                <h3 className="font-semibold">{currentPlan.name}</h3>
                {currentOffer && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">{currentOffer.name}</p>
                    <p className="text-xl font-bold">{formatCurrency(currentOffer.price)}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Novo Plano</p>
              <div className="p-4 rounded-lg border border-primary bg-primary/5">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{newPlan.name}</h3>
                  <Badge variant={isUpgrade ? "default" : "secondary"}>
                    {isUpgrade ? 'Upgrade' : 'Mudança'}
                  </Badge>
                </div>
                {selectedOffer && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">{selectedOffer.name}</p>
                    <p className="text-xl font-bold">{formatCurrency(selectedOffer.price)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Offer Selection */}
          {availableOffers.length > 0 && (
            <div className="space-y-3">
              <Label>Escolha a forma de pagamento:</Label>
              <RadioGroup value={selectedOfferId} onValueChange={setSelectedOfferId}>
                {availableOffers.map(offer => (
                  <div key={offer.id} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value={offer.id} id={offer.id} />
                    <Label htmlFor={offer.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{offer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {offer.billing_period_value} {
                              offer.billing_period_unit === 'months' ? 'mês(es)' :
                              offer.billing_period_unit === 'years' ? 'ano(s)' : 
                              offer.billing_period_unit
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatCurrency(offer.price)}</p>
                          {offer.billing_period_value > 1 && (
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(offer.price / offer.billing_period_value)}/mês
                            </p>
                          )}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Features Comparison */}
          <div className="space-y-2">
            <p className="font-medium">Comparação de Recursos:</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <FeatureRow 
                  label="Projetos" 
                  value={currentPlan.max_projects === null ? '∞' : currentPlan.max_projects} 
                />
                <FeatureRow 
                  label="Copies" 
                  value={currentPlan.max_copies === null ? '∞' : currentPlan.max_copies} 
                />
                <FeatureRow 
                  label="Copy IA" 
                  value={currentPlan.copy_ai_enabled ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-muted-foreground" />} 
                />
              </div>
              <div className="space-y-2">
                <FeatureRow 
                  label="Projetos" 
                  value={newPlan.max_projects === null ? '∞' : newPlan.max_projects}
                  highlight={newPlan.max_projects !== currentPlan.max_projects}
                />
                <FeatureRow 
                  label="Copies" 
                  value={newPlan.max_copies === null ? '∞' : newPlan.max_copies}
                  highlight={newPlan.max_copies !== currentPlan.max_copies}
                />
                <FeatureRow 
                  label="Copy IA" 
                  value={newPlan.copy_ai_enabled ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-muted-foreground" />}
                  highlight={newPlan.copy_ai_enabled !== currentPlan.copy_ai_enabled}
                />
              </div>
            </div>
          </div>

          {/* Warnings */}
          {!isUpgrade && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Mudanças de plano podem afetar recursos disponíveis. Certifique-se de revisar antes de continuar.
              </AlertDescription>
            </Alert>
          )}

          {projectsExceed && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Você possui {currentSubscription.projects_count} projetos, mas o novo plano permite apenas {newPlan.max_projects}. 
                Exclua {currentSubscription.projects_count - (newPlan.max_projects || 0)} projeto(s) antes de continuar.
              </AlertDescription>
            </Alert>
          )}

          {copiesExceed && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Você possui {currentSubscription.copies_count} copies, mas o novo plano permite apenas {newPlan.max_copies}. 
                Exclua {currentSubscription.copies_count - (newPlan.max_copies || 0)} copy(ies) antes de continuar.
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
            disabled={hasBlockingIssues || !selectedOfferId || isChanging}
          >
            {isChanging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Mudança
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const FeatureRow = ({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string; 
  value: React.ReactNode; 
  highlight?: boolean 
}) => (
  <div className={`flex items-center justify-between p-2 rounded ${highlight ? 'bg-primary/10' : ''}`}>
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);
