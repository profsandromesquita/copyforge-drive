import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { useWorkspacePlan } from "@/hooks/useWorkspacePlan";
import { useChangePlan } from "@/hooks/useChangePlan";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const activePlans = plans?.filter(plan => plan.is_active) || [];
  const currentPlanSlug = currentPlan?.plan_slug || 'free';

  const handleSelectPlan = async (planId: string, planSlug: string) => {
    if (planSlug === 'free') {
      // Se escolher FREE, apenas completa onboarding
      onComplete(planSlug);
      return;
    }

    // Para planos pagos, mostra estrutura preparada para pagamento
    toast.info(
      "Estrutura de pagamento preparada. Em breve você poderá processar pagamentos aqui.",
      { duration: 5000 }
    );

    // Por enquanto, permite upgrade sem pagamento
    try {
      await changePlan({
        workspaceId,
        newPlanId: planId,
        billingCycle
      });
      
      onComplete(planSlug);
    } catch (error) {
      console.error("Erro ao mudar plano:", error);
    }
  };

  if (plansLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Carregando planos...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-28 md:pb-0">
      {/* Header */}
      <div className="text-center mb-6 md:mb-8 px-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3">
          Escolha seu plano
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Comece grátis e faça upgrade quando precisar
        </p>

        {/* Billing Cycle Toggle */}
        <div className="inline-flex rounded-xl border border-border p-1 bg-muted/50 backdrop-blur-sm">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2.5 rounded-lg transition-all text-sm font-medium ${
              billingCycle === 'monthly'
                ? 'bg-background shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-2.5 rounded-lg transition-all text-sm font-medium flex items-center gap-2 ${
              billingCycle === 'annual'
                ? 'bg-background shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Anual
            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-0">
              -20%
            </Badge>
          </button>
        </div>
      </div>

      {/* Plans Grid - Mobile Scroll Horizontal, Desktop Grid */}
      <div className="mb-8">
        {/* Mobile: Scroll Horizontal */}
        <div className="md:hidden overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
          <div className="flex gap-4 min-w-max">
            {activePlans.map((plan) => {
              const price = billingCycle === 'monthly' ? plan.monthly_price : plan.annual_price;
              const isCurrentPlan = plan.slug === currentPlanSlug;
              const isPopular = plan.slug === 'pro';

              return (
                <Card 
                  key={plan.id} 
                  className={`relative flex-shrink-0 w-[280px] snap-center transition-all ${
                    isPopular 
                      ? 'border-2 border-primary shadow-lg' 
                      : 'border border-border'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-primary text-primary-foreground text-xs px-3 py-1 shadow-md">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Mais Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4 pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-lg font-bold">{plan.name}</CardTitle>
                      {isCurrentPlan && (
                        <Badge variant="secondary" className="text-xs">Atual</Badge>
                      )}
                    </div>
                    
                    <div className="mt-4 mb-2">
                      {billingCycle === 'monthly' ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">{formatCurrency(price)}</span>
                          <span className="text-sm text-muted-foreground">/mês</span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold">{formatCurrency(price / 12)}</span>
                            <span className="text-sm text-muted-foreground">/mês</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatCurrency(price)} por ano
                          </p>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pb-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm">
                          {plan.max_projects === null ? 'Projetos ilimitados' : `${plan.max_projects} projeto${plan.max_projects > 1 ? 's' : ''}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm">
                          {plan.max_copies === null ? 'Copies ilimitadas' : `${plan.max_copies} copies`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm">{plan.credits_per_month} créditos/mês</span>
                      </div>
                      {plan.copy_ai_enabled && (
                        <div className="flex items-center gap-2.5">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-sm font-medium">Copy AI incluído</span>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 pb-6">
                    <Button
                      onClick={() => handleSelectPlan(plan.id, plan.slug)}
                      disabled={isCurrentPlan || isChanging || loading}
                      className="w-full h-11 font-medium"
                      variant={isPopular ? 'default' : 'outline'}
                    >
                      {isCurrentPlan ? 'Plano Atual' : 'Escolher Plano'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto px-4">
          {activePlans.map((plan) => {
            const price = billingCycle === 'monthly' ? plan.monthly_price : plan.annual_price;
            const isCurrentPlan = plan.slug === currentPlanSlug;
            const isPopular = plan.slug === 'pro';

            return (
              <Card 
                key={plan.id} 
                className={`relative flex flex-col transition-all hover:shadow-lg ${
                  isPopular 
                    ? 'border-2 border-primary shadow-md scale-105' 
                    : 'border border-border'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-primary text-primary-foreground text-xs px-3 py-1 shadow-md">
                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg font-bold">{plan.name}</CardTitle>
                    {isCurrentPlan && (
                      <Badge variant="secondary" className="text-xs">Atual</Badge>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    {billingCycle === 'monthly' ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">{formatCurrency(price)}</span>
                        <span className="text-sm text-muted-foreground">/mês</span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">{formatCurrency(price / 12)}</span>
                          <span className="text-sm text-muted-foreground">/mês</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatCurrency(price)} por ano
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 flex-1">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm">
                        {plan.max_projects === null ? 'Projetos ilimitados' : `${plan.max_projects} projeto${plan.max_projects > 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm">
                        {plan.max_copies === null ? 'Copies ilimitadas' : `${plan.max_copies} copies`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm">{plan.credits_per_month} créditos/mês</span>
                    </div>
                    {plan.copy_ai_enabled && (
                      <div className="flex items-center gap-2.5">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm font-medium">Copy AI incluído</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-4">
                  <Button
                    onClick={() => handleSelectPlan(plan.id, plan.slug)}
                    disabled={isCurrentPlan || isChanging || loading}
                    className="w-full h-11 font-medium"
                    variant={isPopular ? 'default' : 'outline'}
                  >
                    {isCurrentPlan ? 'Plano Atual' : 'Escolher Plano'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Footer Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border md:relative md:border-t-0 md:p-0 md:bg-transparent">
        <div className="max-w-xl mx-auto">
          <Button 
            onClick={() => onComplete()} 
            variant="ghost"
            size="lg"
            className="w-full h-12 text-muted-foreground hover:text-foreground"
          >
            Pular por agora
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep5;
