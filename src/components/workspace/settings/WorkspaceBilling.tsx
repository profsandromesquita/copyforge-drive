import { useState, useMemo, useEffect } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useWorkspaceSubscription } from "@/hooks/useWorkspaceSubscription";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { usePlanOffersPublic } from "@/hooks/usePlanOffersPublic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Calendar, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Consolidar ofertas únicas por nome e ordenar por período (maior primeiro)
  const uniqueOfferTypes = useMemo(() => {
    const offerNamesWithPeriod = new Map<string, { name: string; value: number; unit: string }>();
    
    Object.values(offersByPlan).forEach((offers: any[]) => {
      offers.forEach(offer => {
        if (!offerNamesWithPeriod.has(offer.name)) {
          offerNamesWithPeriod.set(offer.name, {
            name: offer.name,
            value: offer.billing_period_value,
            unit: offer.billing_period_unit
          });
        }
      });
    });
    
    // Ordenar por período (maior primeiro)
    return Array.from(offerNamesWithPeriod.values())
      .sort((a, b) => {
        const aMonths = a.unit === 'years' ? a.value * 12 : a.value;
        const bMonths = b.unit === 'years' ? b.value * 12 : b.value;
        return bMonths - aMonths;
      })
      .map(o => o.name);
  }, [offersByPlan]);

  // Auto-selecionar primeira oferta disponível (maior período)
  useEffect(() => {
    if (uniqueOfferTypes.length > 0 && !selectedBillingPeriod) {
      setSelectedBillingPeriod(uniqueOfferTypes[0]);
    }
  }, [uniqueOfferTypes]);

  // Mapear ofertas por plano para o período selecionado
  const getOfferForPlan = (planId: string) => {
    const planOffers = offersByPlan[planId] || [];
    return planOffers.find(offer => offer.name === selectedBillingPeriod);
  };

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
    <div className="space-y-6">
      {/* Current Plan */}
      <div>
        <h3 className="text-base font-semibold mb-3">Plano Atual</h3>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">Assinatura</h4>
                </div>
                <p className="text-xl font-bold text-primary">{subscription.plan.name}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <Badge variant="outline" className="text-xs">
                    {subscription.billing_cycle === 'monthly' ? 'Mensal' : 
                     subscription.billing_cycle === 'annual' ? 'Anual' : 'Gratuito'}
                  </Badge>
                  {getStatusBadge(subscription.status)}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-2xl sm:text-3xl font-bold">
                  {formatCurrency(subscription.billing_cycle === 'monthly' 
                    ? subscription.plan.monthly_price 
                    : subscription.plan.annual_price / 12
                  )}
                </p>
                <p className="text-xs text-muted-foreground">/mês</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Projetos</p>
                <p className="text-base font-semibold">
                  {subscription.projects_count} / {subscription.current_max_projects || '∞'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Copies</p>
                <p className="text-base font-semibold">
                  {subscription.copies_count} / {subscription.current_max_copies || '∞'}
                </p>
              </div>
            </div>

            {subscription.current_period_end && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <p>Renovação em {formatDate(subscription.current_period_end)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Plans */}
      <div>
        <h3 className="text-base font-semibold mb-3">Planos Disponíveis</h3>
        
        {/* Tabs para escolher período de cobrança */}
        {uniqueOfferTypes.length > 0 && (
          <div className="flex justify-center mb-4">
            <Tabs value={selectedBillingPeriod} onValueChange={setSelectedBillingPeriod}>
              <TabsList className="grid w-full max-w-sm text-xs sm:text-sm" style={{ gridTemplateColumns: `repeat(${uniqueOfferTypes.length}, 1fr)` }}>
                {uniqueOfferTypes.map(offerType => (
                  <TabsTrigger key={offerType} value={offerType} className="text-xs sm:text-sm px-2 py-1.5">
                    {offerType}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activePlans.map((plan) => {
            const isCurrent = plan.id === subscription.plan.id;
            const offer = getOfferForPlan(plan.id);
            const isPopular = plan.slug === 'pro';

            if (!offer) {
              return (
                <Card key={plan.id} className="relative">
                  {isCurrent && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5">
                        Seu Plano
                      </Badge>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-bold mb-1.5">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">Nenhuma oferta disponível</p>
                  </div>
                </Card>
              );
            }

            // Calcular preço mensal
            const isMonthly = offer.billing_period_unit === 'months' && offer.billing_period_value === 1;
            const monthlyPrice = isMonthly 
              ? offer.price 
              : offer.billing_period_unit === 'months'
                ? offer.price / offer.billing_period_value
                : offer.billing_period_unit === 'years'
                  ? offer.price / (offer.billing_period_value * 12)
                  : offer.price;

            // Separar parte inteira e decimal
            const priceStr = monthlyPrice.toFixed(2);
            const [integerPart, decimalPart] = priceStr.split('.');
            const hasDecimals = decimalPart && decimalPart !== '00';

            return (
              <Card 
                key={plan.id}
                className={`relative transition-all hover:shadow-lg ${
                  isCurrent 
                    ? 'border-2 border-primary ring-2 ring-primary/20' 
                    : isPopular 
                      ? 'border-2 border-primary shadow-md' 
                      : 'border border-border'
                }`}
              >
                {isCurrent ? (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5 shadow-md">
                      Seu Plano
                    </Badge>
                  </div>
                ) : isPopular ? (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5 shadow-md">
                      Mais Popular
                    </Badge>
                  </div>
                ) : null}

                <div className="p-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{plan.description || 'Plano personalizado'}</p>
                    
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-bold">
                          R$ {parseInt(integerPart).toLocaleString('pt-BR')}
                          {hasDecimals && (
                            <span className="text-lg sm:text-xl">,{decimalPart}</span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">/mês</span>
                      </div>
                      {!isMonthly && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatCurrency(offer.price)} total por {offer.billing_period_value} {
                            offer.billing_period_unit === 'months' ? 'meses' :
                            offer.billing_period_unit === 'years' ? (offer.billing_period_value > 1 ? 'anos' : 'ano') : 
                            offer.billing_period_unit
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                        <Check className="w-2.5 h-2.5 text-primary" />
                      </div>
                      <span className="text-xs">
                        {plan.max_projects === null 
                          ? 'Projetos Ilimitados' 
                          : `${plan.max_projects} Projeto${plan.max_projects > 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                        <Check className="w-2.5 h-2.5 text-primary" />
                      </div>
                      <span className="text-xs">
                        {plan.max_copies === null 
                          ? 'Copies Ilimitadas' 
                          : `${plan.max_copies} Cop${plan.max_copies > 1 ? 'ies' : 'y'}`}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                        <Check className="w-2.5 h-2.5 text-primary" />
                      </div>
                      <span className="text-xs">{plan.credits_per_month} Créditos/mês</span>
                    </div>
                    {plan.copy_ai_enabled && (
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                          <Check className="w-2.5 h-2.5 text-primary" />
                        </div>
                        <span className="text-xs font-semibold">Copy IA Habilitada</span>
                      </div>
                    )}
                    {plan.rollover_enabled && (
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                          <Check className="w-2.5 h-2.5 text-primary" />
                        </div>
                        <span className="text-xs">Rollover de {plan.rollover_percentage}% dos créditos</span>
                      </div>
                    )}
                  </div>

                  <Button 
                    className="w-full text-sm h-9" 
                    variant={isCurrent ? "outline" : isPopular ? "default" : "outline"}
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrent}
                  >
                    {isCurrent ? 'Plano Atual' : 'Selecionar Plano'}
                  </Button>
                </div>
              </Card>
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
          availableOffers={offersByPlan[selectedPlan.id] || []}
          workspaceId={activeWorkspace?.id || ''}
        />
      )}
    </div>
  );
};
