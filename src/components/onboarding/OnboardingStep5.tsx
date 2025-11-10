import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { useWorkspacePlan } from "@/hooks/useWorkspacePlan";
import { useChangePlan } from "@/hooks/useChangePlan";
import { usePlanOffersPublic } from "@/hooks/usePlanOffersPublic";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const [selectedOffers, setSelectedOffers] = useState<Record<string, string>>({});

  const activePlans = plans?.filter(plan => plan.is_active) || [];
  const currentPlanSlug = currentPlan?.plan_slug || 'free';

  const planIds = activePlans.map(p => p.id);
  const { data: offersByPlan = {} } = usePlanOffersPublic(planIds);

  // Auto-select first offer for each plan
  useEffect(() => {
    const initialOffers: Record<string, string> = {};
    activePlans.forEach(plan => {
      const planOffers = offersByPlan[plan.id];
      if (planOffers && planOffers.length > 0) {
        initialOffers[plan.id] = planOffers[0].id;
      }
    });
    if (Object.keys(initialOffers).length > 0) {
      setSelectedOffers(initialOffers);
    }
  }, [offersByPlan, activePlans]);

  const handleSelectPlan = async (planId: string, planSlug: string, offerId?: string) => {
    if (planSlug === 'free') {
      onComplete(planSlug);
      return;
    }

    if (!offerId) {
      toast.error("Este plano não possui ofertas disponíveis no momento.");
      return;
    }

    if (!user || !profile) {
      toast.error("Informações do usuário não disponíveis");
      return;
    }

    try {
      // Buscar oferta para obter checkout_url
      const planOffers = offersByPlan[planId] || [];
      const selectedOffer = planOffers.find(o => o.id === offerId);
      
      if (selectedOffer?.checkout_url) {
        // Construir URL com tracking e pré-preenchimento
        const enrichedUrl = buildCheckoutUrl(selectedOffer.checkout_url, {
          workspace_id: workspaceId,
          user_id: user.id,
          email: profile.email,
          name: profile.name,
          phone: profile.phone,
          source: 'onboarding'
        });

        // Abrir checkout em nova aba
        window.open(enrichedUrl, '_blank');
      }

      await changePlan({
        workspaceId,
        planOfferId: offerId,
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
      <div className="text-center mb-4 md:mb-6 px-4">
        <h1 className="text-xl md:text-2xl font-bold mb-2">
          Escolha seu plano
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mb-4">
          Comece grátis e faça upgrade quando precisar
        </p>
      </div>

      <div className="mb-6 space-y-3 px-4 max-w-2xl mx-auto">
        {/* Paid Plans */}
        {activePlans.filter(plan => plan.slug !== 'free').map((plan) => {
          const isCurrentPlan = plan.slug === currentPlanSlug;
          const isPopular = plan.slug === 'pro';
          const planOffers = offersByPlan[plan.id] || [];
          const selectedOfferId = selectedOffers[plan.id];
          const selectedOffer = planOffers.find(o => o.id === selectedOfferId);

          return (
            <Card 
              key={plan.id} 
              className={`relative transition-all ${
                isPopular 
                  ? 'border-2 border-primary shadow-md' 
                  : 'border border-border'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 shadow-md">
                    Mais Popular
                  </Badge>
                </div>
              )}

              <div className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-bold">{plan.name}</h3>
                    {isCurrentPlan && (
                      <Badge variant="secondary" className="text-[10px]">Atual</Badge>
                    )}
                  </div>
                  
                  {planOffers.length > 0 && (
                    <div className="mb-3 space-y-1">
                      {planOffers.map(offer => (
                        <button
                          key={offer.id}
                          onClick={() => setSelectedOffers(prev => ({ ...prev, [plan.id]: offer.id }))}
                          className={`w-full p-2 rounded text-left transition-all text-xs ${
                            selectedOfferId === offer.id 
                              ? 'bg-primary/10 border border-primary' 
                              : 'bg-muted/50 border border-transparent hover:border-primary/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{offer.name}</span>
                            <span className="font-bold">{formatCurrency(offer.price)}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {offer.billing_period_value} {
                              offer.billing_period_unit === 'months' ? 'mês(es)' :
                              offer.billing_period_unit === 'years' ? 'ano(s)' : 
                              offer.billing_period_unit
                            }
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-primary" />
                      </div>
                      <span className="text-xs">
                        {plan.max_projects === null ? 'Projetos ilimitados' : `${plan.max_projects} projeto${plan.max_projects > 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-primary" />
                      </div>
                      <span className="text-xs">
                        {plan.max_copies === null ? 'Copies ilimitadas' : `${plan.max_copies} copies`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-primary" />
                      </div>
                      <span className="text-xs">{plan.credits_per_month} créditos/mês</span>
                    </div>
                  </div>
                </div>

                <div className="ml-4">
                  <Button
                    onClick={() => handleSelectPlan(plan.id, plan.slug, selectedOfferId)}
                    disabled={isCurrentPlan || isChanging || loading || !selectedOfferId}
                    className="h-9 px-4 text-xs font-medium whitespace-nowrap"
                    variant={isPopular ? 'default' : 'outline'}
                  >
                    {isChanging ? <Loader2 className="h-3 w-3 animate-spin" /> : (isCurrentPlan ? 'Atual' : 'Escolher')}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {/* Free Plan */}
        {activePlans.filter(plan => plan.slug === 'free').map((plan) => {
          const isCurrentPlan = plan.slug === currentPlanSlug;

          return (
            <Card 
              key={plan.id} 
              className="border border-border/50 bg-muted/30"
            >
              <div className="flex items-center justify-between p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold">{plan.name}</h3>
                    {isCurrentPlan && (
                      <Badge variant="secondary" className="text-[10px]">Atual</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-lg font-bold">R$ 0</span>
                    <span className="text-[10px] text-muted-foreground">/mês</span>
                  </div>

                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span className="text-[10px] text-muted-foreground">
                      {plan.max_projects} projeto
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {plan.max_copies} copies
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {plan.credits_per_month} créditos/mês
                    </span>
                  </div>
                </div>

                <div className="ml-4">
                  <Button
                    onClick={() => handleSelectPlan(plan.id, plan.slug, undefined)}
                    disabled={isCurrentPlan || isChanging || loading}
                    className="h-8 px-3 text-[10px] font-medium whitespace-nowrap"
                    variant="outline"
                  >
                    {isCurrentPlan ? 'Atual' : 'Escolher'}
                  </Button>
                </div>
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
