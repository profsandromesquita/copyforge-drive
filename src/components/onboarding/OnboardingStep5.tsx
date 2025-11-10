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
      <div className="text-center mb-4 md:mb-6 px-4">
        <h1 className="text-xl md:text-2xl font-bold mb-2">
          Escolha seu plano
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mb-4">
          Comece grátis e faça upgrade quando precisar
        </p>

        {/* Billing Cycle Toggle */}
        <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/50 backdrop-blur-sm">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 rounded-md transition-all text-xs font-medium ${
              billingCycle === 'monthly'
                ? 'bg-background shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-1.5 rounded-md transition-all text-xs font-medium flex items-center gap-1.5 ${
              billingCycle === 'annual'
                ? 'bg-background shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Anual
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">
              -20%
            </Badge>
          </button>
        </div>
      </div>

      {/* Plans - Vertical Stack */}
      <div className="mb-6 space-y-3 px-4 max-w-2xl mx-auto">
        {/* Paid Plans */}
        {activePlans.filter(plan => plan.slug !== 'free').map((plan) => {
          const price = billingCycle === 'monthly' ? plan.monthly_price : plan.annual_price;
          const isCurrentPlan = plan.slug === currentPlanSlug;
          const isPopular = plan.slug === 'pro';

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
                  
                  <div className="flex items-baseline gap-1 mb-3">
                    {billingCycle === 'monthly' ? (
                      <>
                        <span className="text-2xl font-bold">{formatCurrency(Math.floor(price))}</span>
                        <span className="text-xs text-muted-foreground">/mês</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl font-bold">{formatCurrency(Math.floor(price / 12))}</span>
                        <span className="text-xs text-muted-foreground">/mês</span>
                      </>
                    )}
                  </div>

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
                    onClick={() => handleSelectPlan(plan.id, plan.slug)}
                    disabled={isCurrentPlan || isChanging || loading}
                    className="h-9 px-4 text-xs font-medium whitespace-nowrap"
                    variant={isPopular ? 'default' : 'outline'}
                  >
                    {isCurrentPlan ? 'Plano Atual' : 'Escolher'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {/* Free Plan - Smaller */}
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
                    onClick={() => handleSelectPlan(plan.id, plan.slug)}
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

      {/* Footer Button */}
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
