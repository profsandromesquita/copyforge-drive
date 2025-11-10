import { useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useWorkspaceSubscription } from "@/hooks/useWorkspaceSubscription";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { usePlanOffersPublic } from "@/hooks/usePlanOffersPublic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanCard } from "@/components/plans/PlanCard";
import { PlanChangeModal } from "./PlanChangeModal";
import { formatCurrency } from "@/lib/utils";

export const WorkspaceBilling = () => {
  const { activeWorkspace } = useWorkspace();
  const { data: subscription, isLoading: loadingSubscription } = useWorkspaceSubscription(activeWorkspace?.id);
  const { plans, isLoading: loadingPlans } = useSubscriptionPlans();
  
  const activePlans = plans?.filter(p => p.is_active) || [];
  const planIds = activePlans.map(p => p.id);
  const { data: offersByPlan = {} } = usePlanOffersPublic(planIds);
  
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedOffers, setSelectedOffers] = useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectPlan = (plan: any) => {
    if (!subscription) return;
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any }> = {
      active: { label: 'Ativo', variant: 'default' },
      pending_payment: { label: 'Aguardando Pagamento', variant: 'secondary' },
      cancelled: { label: 'Cancelado', variant: 'destructive' },
      expired: { label: 'Expirado', variant: 'destructive' },
    };

    const config = statusConfig[status] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loadingSubscription || loadingPlans) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhuma assinatura ativa encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Plano Atual</h3>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h4 className="text-lg font-semibold">Assinatura</h4>
                </div>
                <p className="text-2xl font-bold text-primary">{subscription.plan.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">
                    {subscription.billing_cycle === 'monthly' ? 'Mensal' : 
                     subscription.billing_cycle === 'annual' ? 'Anual' : 'Gratuito'}
                  </Badge>
                  {getStatusBadge(subscription.status)}
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">
                  {formatCurrency(subscription.billing_cycle === 'monthly' 
                    ? subscription.plan.monthly_price 
                    : subscription.plan.annual_price / 12
                  )}
                </p>
                <p className="text-sm text-muted-foreground">/mês</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Projetos</p>
                <p className="text-lg font-semibold">
                  {subscription.projects_count} / {subscription.current_max_projects || '∞'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Copies</p>
                <p className="text-lg font-semibold">
                  {subscription.copies_count} / {subscription.current_max_copies || '∞'}
                </p>
              </div>
            </div>

            {subscription.current_period_end && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <p>Renovação em {formatDate(subscription.current_period_end)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Plans */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Planos Disponíveis</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePlans.map((plan) => {
            const isCurrent = plan.id === subscription.plan.id;
            const planOffers = offersByPlan[plan.id] || [];
            const selectedOfferId = selectedOffers[plan.id] || planOffers[0]?.id;

            return (
              <div key={plan.id} className="relative">
                {!isCurrent && (
                  <div className="absolute -top-3 right-4 z-10">
                    <Badge variant="default" className="gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Mudar
                    </Badge>
                  </div>
                )}
                <PlanCard
                  plan={plan}
                  offers={planOffers}
                  selectedOfferId={selectedOfferId}
                  isCurrentPlan={isCurrent}
                  onSelect={() => handleSelectPlan(plan)}
                  onOfferChange={(offerId) => setSelectedOffers(prev => ({ ...prev, [plan.id]: offerId }))}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan Change Modal */}
      {selectedPlan && (
        <PlanChangeModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPlan(null);
          }}
          currentSubscription={subscription}
          newPlan={selectedPlan}
          billingCycle="monthly"
          workspaceId={activeWorkspace?.id || ''}
        />
      )}
    </div>
  );
};
