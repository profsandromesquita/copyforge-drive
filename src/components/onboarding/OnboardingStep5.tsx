import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { useWorkspacePlan } from "@/hooks/useWorkspacePlan";
import { useChangePlan } from "@/hooks/useChangePlan";
import { usePlanOffersPublic } from "@/hooks/usePlanOffersPublic";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { buildCheckoutUrl } from "@/lib/checkout-utils";
import { toast } from "sonner";

interface OnboardingStep5Props {
  workspaceId: string;
  onComplete: (selectedPlanSlug?: string) => void;
  onBack: () => void;
  loading: boolean;
}

const OnboardingStep5 = ({ workspaceId, onComplete, onBack, loading }: OnboardingStep5Props) => {
  const { plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: currentPlan } = useWorkspacePlan(workspaceId);
  const { changePlan, isChanging } = useChangePlan();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<string>("monthly");

  const activePlans = plans?.filter(plan => plan.is_active) || [];
  const currentPlanSlug = currentPlan?.plan_slug || 'free';

  const planIds = activePlans.map(p => p.id);
  const { data: offersByPlan = {} } = usePlanOffersPublic(planIds);

  // Consolidar ofertas únicas por nome
  const uniqueOfferTypes = useMemo(() => {
    const offerNames = new Set<string>();
    Object.values(offersByPlan).forEach((offers: any[]) => {
      offers.forEach(offer => offerNames.add(offer.name));
    });
    return Array.from(offerNames).sort();
  }, [offersByPlan]);

  // Auto-selecionar primeira oferta disponível
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

  const handleSelectPlan = async (planId: string, planSlug: string) => {
    if (planSlug === 'free') {
      onComplete(planSlug);
      return;
    }

    const selectedOffer = getOfferForPlan(planId);
    
    if (!selectedOffer) {
      toast.error("Este plano não possui ofertas disponíveis para o período selecionado.");
      return;
    }

    if (!user || !profile) {
      toast.error("Informações do usuário não disponíveis");
      return;
    }

    try {
      if (selectedOffer.checkout_url) {
        const enrichedUrl = buildCheckoutUrl(selectedOffer.checkout_url, {
          workspace_id: workspaceId,
          user_id: user.id,
          email: profile.email,
          name: profile.name,
          phone: profile.phone,
          source: 'onboarding'
        });

        window.open(enrichedUrl, '_blank');
      }

      await changePlan({
        workspaceId,
        planOfferId: selectedOffer.id,
      });
      
      onComplete(planSlug);
    } catch (error) {
      console.error("Erro ao mudar plano:", error);
    }
  };

  if (plansLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Carregando planos...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-28 md:pb-0">
      <div className="text-center mb-6 md:mb-8 px-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Escolha seu plano
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Comece grátis e faça upgrade quando precisar
        </p>
      </div>

      {/* Tabs para escolher período de cobrança */}
      {uniqueOfferTypes.length > 0 && (
        <div className="flex justify-center mb-6 px-4">
          <Tabs value={selectedBillingPeriod} onValueChange={setSelectedBillingPeriod}>
            <TabsList className="grid w-full max-w-md" style={{ gridTemplateColumns: `repeat(${uniqueOfferTypes.length}, 1fr)` }}>
              {uniqueOfferTypes.map(offerType => (
                <TabsTrigger key={offerType} value={offerType} className="text-sm">
                  {offerType}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      <div className="mb-6 space-y-4 px-4 max-w-4xl mx-auto">
        {/* Grid de planos pagos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activePlans.filter(plan => plan.slug !== 'free').map((plan) => {
            const isCurrentPlan = plan.slug === currentPlanSlug;
            const isPopular = plan.slug === 'pro';
            const offer = getOfferForPlan(plan.id);

            if (!offer) return null;

            return (
              <Card 
                key={plan.id} 
                className={`relative transition-all hover:shadow-lg ${
                  isPopular 
                    ? 'border-2 border-primary shadow-md' 
                    : 'border border-border'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-primary text-primary-foreground text-xs px-3 py-1 shadow-md">
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      {isCurrentPlan && (
                        <Badge variant="secondary" className="text-xs">Atual</Badge>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      {(() => {
                        const isMonthly = offer.billing_period_unit === 'months' && offer.billing_period_value === 1;
                        const monthlyPrice = isMonthly 
                          ? offer.price 
                          : offer.billing_period_unit === 'months'
                            ? offer.price / offer.billing_period_value
                            : offer.billing_period_unit === 'years'
                              ? offer.price / (offer.billing_period_value * 12)
                              : offer.price;

                        return (
                          <>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-bold">{formatCurrency(monthlyPrice)}</span>
                              <span className="text-sm text-muted-foreground">/mês</span>
                            </div>
                            {!isMonthly && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatCurrency(offer.price)} total por {offer.billing_period_value} {
                                  offer.billing_period_unit === 'months' ? 'meses' :
                                  offer.billing_period_unit === 'years' ? (offer.billing_period_value > 1 ? 'anos' : 'ano') : 
                                  offer.billing_period_unit
                                }
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm">
                        {plan.max_projects === null ? 'Projetos ilimitados' : `${plan.max_projects} projeto${plan.max_projects > 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm">
                        {plan.max_copies === null ? 'Copies ilimitadas' : `${plan.max_copies} copies`}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm font-semibold">{plan.credits_per_month} créditos/mês</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSelectPlan(plan.id, plan.slug)}
                    disabled={isCurrentPlan || isChanging || loading}
                    className="w-full"
                    variant={isPopular ? 'default' : 'outline'}
                  >
                    {isChanging ? <Loader2 className="h-4 w-4 animate-spin" /> : (isCurrentPlan ? 'Plano Atual' : 'Escolher Plano')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Plano Free - destacado separadamente */}
        {activePlans.filter(plan => plan.slug === 'free').map((plan) => {
          const isCurrentPlan = plan.slug === currentPlanSlug;

          return (
            <Card 
              key={plan.id} 
              className="border-2 border-dashed border-border/50 bg-muted/30"
            >
              <div className="flex flex-col md:flex-row items-center justify-between p-6 gap-4">
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    {isCurrentPlan && (
                      <Badge variant="secondary" className="text-xs">Atual</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-baseline justify-center md:justify-start gap-1 mb-3">
                    <span className="text-2xl font-bold">R$ 0</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{plan.max_projects} projeto</span>
                    <span>•</span>
                    <span>{plan.max_copies} copies</span>
                    <span>•</span>
                    <span>{plan.credits_per_month} créditos/mês</span>
                  </div>
                </div>

                <Button
                  onClick={() => handleSelectPlan(plan.id, plan.slug)}
                  disabled={isCurrentPlan || isChanging || loading}
                  className="w-full md:w-auto"
                  variant="outline"
                >
                  {isCurrentPlan ? 'Plano Atual' : 'Continuar Grátis'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border md:relative md:border-t-0 md:p-0 md:bg-transparent">
        <div className="max-w-2xl mx-auto">
          <Button 
            onClick={() => onComplete()} 
            variant="ghost"
            size="lg"
            className="w-full h-10 text-sm text-muted-foreground hover:text-foreground"
          >
            Continuar no Plano Gratuito
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep5;
