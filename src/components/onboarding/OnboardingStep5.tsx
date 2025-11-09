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
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Escolha o plano ideal para você
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Comece grátis e faça upgrade quando precisar de mais recursos
        </p>

        {/* Billing Cycle Toggle */}
        <div className="inline-flex rounded-lg border border-border p-1 bg-muted">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md transition-all ${
              billingCycle === 'monthly'
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-2 rounded-md transition-all ${
              billingCycle === 'annual'
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            Anual
            <Badge variant="secondary" className="ml-2">-20%</Badge>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {activePlans.map((plan) => {
          const price = billingCycle === 'monthly' ? plan.monthly_price : plan.annual_price;
          const isCurrentPlan = plan.slug === currentPlanSlug;
          const isPopular = plan.slug === 'pro';

          return (
            <Card key={plan.id} className={`relative ${isPopular ? 'border-primary shadow-lg' : ''}`}>
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Popular
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {isCurrentPlan && (
                    <Badge variant="secondary">Atual</Badge>
                  )}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{formatCurrency(price)}</span>
                  <span className="text-muted-foreground">
                    /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>
                      {plan.max_projects === null ? 'Projetos ilimitados' : `${plan.max_projects} projeto(s)`}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>
                      {plan.max_copies === null ? 'Copies ilimitadas' : `${plan.max_copies} copies`}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{plan.credits_per_month} créditos/mês</span>
                  </div>
                  {plan.copy_ai_enabled && (
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Copy AI habilitada</span>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  onClick={() => handleSelectPlan(plan.id, plan.slug)}
                  disabled={isCurrentPlan || isChanging || loading}
                  className="w-full"
                  variant={isPopular ? 'default' : 'outline'}
                >
                  {isCurrentPlan ? 'Plano Atual' : `Escolher ${plan.name}`}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" size="lg">
          Voltar
        </Button>
        <Button 
          onClick={() => onComplete()} 
          variant="ghost"
          size="lg"
        >
          Pular por enquanto
        </Button>
      </div>
    </div>
  );
};

export default OnboardingStep5;
