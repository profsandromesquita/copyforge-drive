import { useState, useEffect, useMemo } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useWorkspacePlan } from "@/hooks/useWorkspacePlan";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { usePlanOffersPublic } from "@/hooks/usePlanOffersPublic";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { buildCheckoutUrl } from "@/lib/checkout-utils";
import { PlanOffer } from "@/hooks/usePlanOffers";
import { toast } from "sonner";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  max_projects: number | null;
  max_copies: number | null;
  copy_ai_enabled: boolean;
  display_order: number;
}

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limitType: 'projects' | 'copies' | 'copy_ai' | 'general';
  currentLimit?: number;
  currentUsage?: number;
}

const MESSAGES = {
  projects: {
    title: 'Limite de Projetos Atingido',
    description: 'Você atingiu o limite de projetos do seu plano atual. Faça upgrade para criar mais projetos e expandir suas possibilidades.',
  },
  copies: {
    title: 'Limite de Copies Atingido',
    description: 'Você atingiu o limite de copies do seu plano atual. Faça upgrade para criar mais copies e aumentar sua produtividade.',
  },
  copy_ai: {
    title: 'Copy IA Não Disponível',
    description: 'A funcionalidade Copy IA não está disponível no seu plano atual. Faça upgrade para usar inteligência artificial na criação de copies.',
  },
  general: {
    title: 'Escolha Seu Plano',
    description: 'Selecione o plano ideal para suas necessidades e desbloqueie todo o potencial da plataforma.',
  },
};

export const UpgradeModal = ({
  open,
  onOpenChange,
  limitType,
  currentLimit,
  currentUsage,
}: UpgradeModalProps) => {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<string>("");
  
  const planIds = plans.map(p => p.id);
  const { data: offersByPlan = {} } = usePlanOffersPublic(planIds);

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

  useEffect(() => {
    if (open && activeWorkspace) {
      loadPlansAndCurrentPlan();
    }
  }, [open, activeWorkspace]);

  const loadPlansAndCurrentPlan = async () => {
    try {
      setLoading(true);
      
      // Load available plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // Load current workspace subscription
      if (!activeWorkspace?.id) return;
      
      const { data: subData, error: subError } = await supabase
        .from('workspace_subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('workspace_id', activeWorkspace.id)
        .eq('status', 'active')
        .single();

      if (subError) throw subError;
      
      if (subData?.subscription_plans) {
        setCurrentPlan(subData.subscription_plans as any);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFeatureValue = (plan: SubscriptionPlan, feature: 'projects' | 'copies' | 'copy_ai') => {
    if (feature === 'projects') return plan.max_projects;
    if (feature === 'copies') return plan.max_copies;
    if (feature === 'copy_ai') return plan.copy_ai_enabled;
    return null;
  };

  const isPlanBetter = (plan: SubscriptionPlan) => {
    // Se for upgrade geral, mostrar todos os planos exceto o atual
    if (limitType === 'general') {
      return !currentPlan || plan.id !== currentPlan.id;
    }

    if (!currentPlan) return true;

    const currentValue = getFeatureValue(currentPlan, limitType as 'projects' | 'copies' | 'copy_ai');
    const planValue = getFeatureValue(plan, limitType as 'projects' | 'copies' | 'copy_ai');

    if (limitType === 'copy_ai') {
      return planValue === true && currentValue === false;
    }

    if (typeof currentValue === 'number' && typeof planValue === 'number') {
      return planValue > currentValue;
    }
    
    if (currentValue === null && planValue !== null) {
      return true;
    }

    return false;
  };

  const getRecommendedPlan = () => {
    const betterPlans = plans.filter(isPlanBetter);
    return betterPlans.length > 0 ? betterPlans[0] : null;
  };

  const recommendedPlan = getRecommendedPlan();

  const handleUpgrade = (planId: string) => {
    const offer = getOfferForPlan(planId);
    
    if (!offer) {
      toast.error("Oferta não disponível para o período selecionado");
      return;
    }

    if (!offer.checkout_url) {
      toast.error("Link de checkout não disponível");
      return;
    }

    if (!activeWorkspace || !user || !profile) {
      toast.error("Informações do usuário não disponíveis");
      return;
    }

    const enrichedUrl = buildCheckoutUrl(offer.checkout_url, {
      workspace_id: activeWorkspace.id,
      user_id: user.id,
      email: profile.email,
      name: profile.name,
      phone: profile.phone,
      source: 'upgrade_modal'
    });

    window.open(enrichedUrl, '_blank');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{MESSAGES[limitType].title}</DialogTitle>
          <DialogDescription className="text-base">
            {MESSAGES[limitType].description}
          </DialogDescription>
        </DialogHeader>

        {currentLimit !== undefined && currentUsage !== undefined && (
          <div className="bg-muted p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Uso Atual</span>
              <span className="font-semibold">
                {currentUsage} / {currentLimit}
              </span>
            </div>
          </div>
        )}

        {/* Tabs para escolher período de cobrança */}
        {uniqueOfferTypes.length > 0 && (
          <div className="flex justify-center mb-6">
            <Tabs value={selectedBillingPeriod} onValueChange={setSelectedBillingPeriod}>
              <TabsList className="grid w-full max-w-md" style={{ gridTemplateColumns: `repeat(${uniqueOfferTypes.length}, 1fr)` }}>
                {uniqueOfferTypes.map(offerType => (
                  <TabsTrigger key={offerType} value={offerType}>
                    {offerType}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[400px]" />
              ))}
            </>
          ) : (
            <>
              {plans.filter(isPlanBetter).map((plan) => {
                const offer = getOfferForPlan(plan.id);
                const isRecommended = recommendedPlan?.id === plan.id;

                if (!offer) return null;

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
                      isRecommended ? 'border-2 border-primary shadow-md' : 'border border-border'
                    }`}
                  >
                    {isRecommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <Badge className="bg-primary text-primary-foreground text-xs px-3 py-1 shadow-md">
                          Recomendado
                        </Badge>
                      </div>
                    )}

                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                        
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold">
                              R$ {parseInt(integerPart).toLocaleString('pt-BR')}
                              {hasDecimals && (
                                <span className="text-xl">,{decimalPart}</span>
                              )}
                            </span>
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
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                            <Check className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-sm">
                            {plan.max_projects === null 
                              ? 'Projetos ilimitados' 
                              : `Até ${plan.max_projects} projeto${plan.max_projects > 1 ? 's' : ''}`}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                            <Check className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-sm">
                            {plan.max_copies === null 
                              ? 'Copies ilimitadas' 
                              : `Até ${plan.max_copies} cop${plan.max_copies > 1 ? 'ies' : 'y'}`}
                          </span>
                        </div>
                        {plan.copy_ai_enabled && (
                          <div className="flex items-start gap-2">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                              <Check className="w-3 h-3 text-primary" />
                            </div>
                            <span className="text-sm font-semibold">IA para geração de copies</span>
                          </div>
                        )}
                      </div>

                      <Button 
                        className="w-full" 
                        variant={isRecommended ? "default" : "outline"}
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        Selecionar Plano
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
