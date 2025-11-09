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
    <div className="animate-fade-in">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
          Escolha seu plano
        </h1>

        {/* Billing Cycle Toggle */}
        <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-md transition-all text-sm ${
              billingCycle === 'monthly'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-md transition-all text-sm ${
              billingCycle === 'annual'
                ? 'bg-background shadow-sm font-medium'
                : 'text-muted-foreground'
            }`}
          >
            Anual
            <Badge variant="secondary" className="ml-1.5 text-xs">-20%</Badge>
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {activePlans.map((plan) => {
          const price = billingCycle === 'monthly' ? plan.monthly_price : plan.annual_price;
          const isCurrentPlan = plan.slug === currentPlanSlug;
          const isPopular = plan.slug === 'pro';

          return (
            <Card key={plan.id} className={`relative ${isPopular ? 'border-primary' : ''}`}>
              {isPopular && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                  {plan.name}
                  {isCurrentPlan && (
                    <Badge variant="secondary" className="text-xs">Atual</Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm line-clamp-2">{plan.description}</CardDescription>
                <div className="mt-2 sm:mt-3">
                  <span className="text-2xl sm:text-3xl font-bold">{formatCurrency(price)}</span>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pb-3 sm:pb-4">
                <div className="space-y-1.5 text-xs sm:text-sm">
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>
                      {plan.max_projects === null ? 'Projetos ilimitados' : `${plan.max_projects} projeto(s)`}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>
                      {plan.max_copies === null ? 'Copies ilimitadas' : `${plan.max_copies} copies`}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{plan.credits_per_month} créditos</span>
                  </div>
                  {plan.copy_ai_enabled && (
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Copy AI</span>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <Button
                  onClick={() => handleSelectPlan(plan.id, plan.slug)}
                  disabled={isCurrentPlan || isChanging || loading}
                  className="w-full text-xs sm:text-sm"
                  variant={isPopular ? 'default' : 'outline'}
                  size="sm"
                >
                  {isCurrentPlan ? 'Atual' : `Escolher`}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" size="lg" className="flex-1">
          Voltar
        </Button>
        <Button 
          onClick={() => onComplete()} 
          variant="ghost"
          size="lg"
          className="flex-1"
        >
          Pular
        </Button>
      </div>
    </div>
  );
};

export default OnboardingStep5;
