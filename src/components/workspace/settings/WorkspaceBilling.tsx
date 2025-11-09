import { useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useWorkspaceSubscription } from "@/hooks/useWorkspaceSubscription";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanCard } from "@/components/plans/PlanCard";
import { PlanChangeModal } from "./PlanChangeModal";

type BillingCycle = 'monthly' | 'annual';

export const WorkspaceBilling = () => {
  const { activeWorkspace } = useWorkspace();
  const { data: subscription, isLoading: loadingSubscription } = useWorkspaceSubscription(activeWorkspace?.id);
  const { plans, isLoading: loadingPlans } = useSubscriptionPlans();
  
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
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

  const isUpgrade = (plan: any) => {
    if (!subscription) return false;
    const currentPrice = subscription.billing_cycle === 'monthly' 
      ? subscription.plan.monthly_price 
      : subscription.plan.annual_price;
    const newPrice = billingCycle === 'monthly' ? plan.monthly_price : plan.annual_price;
    return newPrice > currentPrice;
  };

  if (loadingSubscription || loadingPlans) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
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

  const activePlans = plans?.filter(p => p.is_active) || [];

  return (
    <div className="space-y-8">
      {/* Current Plan Section */}
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
                  R$ {(subscription.billing_cycle === 'monthly' 
                    ? subscription.plan.monthly_price 
                    : subscription.plan.annual_price / 12
                  ).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">/mês</p>
              </div>
            </div>

            {/* Usage Statistics */}
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

      {/* Available Plans Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Planos Disponíveis</h3>
          <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as BillingCycle)}>
            <TabsList>
              <TabsTrigger value="monthly">Mensal</TabsTrigger>
              <TabsTrigger value="annual">Anual</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePlans.map((plan) => {
            const isCurrent = plan.id === subscription.plan.id;
            const upgrade = isUpgrade(plan);

            return (
              <div key={plan.id} className="relative">
                {!isCurrent && (
                  <div className="absolute -top-3 right-4 z-10">
                    <Badge variant={upgrade ? "default" : "secondary"} className="gap-1">
                      {upgrade ? (
                        <>
                          <TrendingUp className="h-3 w-3" />
                          Upgrade
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3 w-3" />
                          Downgrade
                        </>
                      )}
                    </Badge>
                  </div>
                )}
                <PlanCard
                  plan={plan}
                  billingCycle={billingCycle}
                  isCurrentPlan={isCurrent}
                  onSelect={() => handleSelectPlan(plan)}
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
          billingCycle={billingCycle}
          workspaceId={activeWorkspace?.id || ''}
        />
      )}
    </div>
  );
};
