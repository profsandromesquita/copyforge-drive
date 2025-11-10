import { useState, useEffect } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { usePlanOffersPublic } from "@/hooks/usePlanOffersPublic";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, TrendingUp, Users, FileText, Brain } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { PlanOffer } from "@/hooks/usePlanOffers";

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
  limitType: 'projects' | 'copies' | 'copy_ai';
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
};

export const UpgradeModal = ({
  open,
  onOpenChange,
  limitType,
  currentLimit,
  currentUsage,
}: UpgradeModalProps) => {
  const { activeWorkspace } = useWorkspace();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOffers, setSelectedOffers] = useState<Record<string, string>>({});
  
  const planIds = plans.map(p => p.id);
  const { data: offersByPlan = {} } = usePlanOffersPublic(planIds);

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
    if (!currentPlan) return true;

    const currentValue = getFeatureValue(currentPlan, limitType);
    const planValue = getFeatureValue(plan, limitType);

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

  const handleSelectOffer = (planId: string, offerId: string) => {
    setSelectedOffers(prev => ({ ...prev, [planId]: offerId }));
  };

  const handleUpgrade = (offer: PlanOffer) => {
    window.open(offer.checkout_url, '_blank');
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
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Uso Atual</span>
              <span className="font-semibold">
                {currentUsage} / {currentLimit}
              </span>
            </div>
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
                const planOffers = offersByPlan[plan.id] || [];
                const selectedOfferId = selectedOffers[plan.id] || planOffers[0]?.id;
                const selectedOffer = planOffers.find(o => o.id === selectedOfferId);

                return (
                  <Card 
                    key={plan.id}
                    className={recommendedPlan?.id === plan.id ? "border-primary shadow-lg" : ""}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        {recommendedPlan?.id === plan.id && (
                          <Badge className="ml-2">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Recomendado
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                      
                      {planOffers.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Escolha o período:</p>
                          <div className="grid gap-2">
                            {planOffers.map(offer => (
                              <button
                                key={offer.id}
                                onClick={() => handleSelectOffer(plan.id, offer.id)}
                                className={`p-3 rounded-lg border-2 text-left transition-all ${
                                  selectedOfferId === offer.id 
                                    ? 'border-primary bg-primary/5' 
                                    : 'border-border hover:border-primary/50'
                                }`}
                              >
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
                                    <p className="text-xl font-bold">{formatCurrency(offer.price)}</p>
                                    <p className="text-xs text-muted-foreground">total</p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {plan.max_projects === null 
                              ? 'Projetos ilimitados' 
                              : `Até ${plan.max_projects} projetos`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {plan.max_copies === null 
                              ? 'Copies ilimitadas' 
                              : `Até ${plan.max_copies} copies`}
                          </span>
                        </div>
                        {plan.copy_ai_enabled && (
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">IA para geração de copies</span>
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>

                      <Button 
                        className="w-full" 
                        size="lg"
                        variant={recommendedPlan?.id === plan.id ? "default" : "outline"}
                        onClick={() => selectedOffer && handleUpgrade(selectedOffer)}
                        disabled={!selectedOffer}
                      >
                        Selecionar Plano
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </div>

        <div className="text-center pt-4">
          <Button variant="link" onClick={() => window.location.href = '/plans'}>
            Ver comparação completa de planos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
