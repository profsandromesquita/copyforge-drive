import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { PlanCard } from "@/components/plans/PlanCard";
import { FeatureComparisonTable } from "@/components/plans/FeatureComparisonTable";
import { FAQSection } from "@/components/plans/FAQSection";
import { TestimonialsSection } from "@/components/plans/TestimonialsSection";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PlanCardSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-10 w-full" />
  </div>
);

export default function Plans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { plans, isLoading } = useSubscriptionPlans();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);

  // Buscar plano atual do workspace
  useEffect(() => {
    const fetchCurrentPlan = async () => {
      if (!activeWorkspace?.id) return;

      const { data } = await supabase
        .from('workspace_subscriptions')
        .select('plan_id')
        .eq('workspace_id', activeWorkspace.id)
        .eq('status', 'active')
        .maybeSingle();

      if (data) {
        setCurrentPlanId(data.plan_id);
      }
    };

    fetchCurrentPlan();
  }, [activeWorkspace?.id]);

  // Filtrar apenas planos ativos
  const activePlans = plans?.filter(p => p.is_active) || [];

  const handlePlanSelect = (plan: any) => {
    // Se não está logado, redirecionar para signup
    if (!user) {
      navigate('/auth', { state: { selectedPlan: plan.id } });
      return;
    }

    // Se já é o plano atual, não fazer nada
    if (plan.id === currentPlanId) {
      toast.info('Este já é seu plano atual');
      return;
    }

    // TODO: Implementar modal de confirmação com integração de pagamento
    toast.info('Funcionalidade de upgrade em desenvolvimento');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header com botão voltar (se logado) */}
      {user && (
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl text-center space-y-6">
          <h1 className="text-5xl font-bold tracking-tight">
            Escolha o Plano Ideal para Você
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Potencialize sua criação de copies com inteligência artificial.
            Escolha o plano que melhor atende suas necessidades.
          </p>

          {/* Toggle Mensal/Anual */}
          <div className="flex items-center justify-center gap-4 pt-8">
            <span className={billingCycle === 'monthly' ? 'font-bold' : 'text-muted-foreground'}>
              Mensal
            </span>
            <Switch
              checked={billingCycle === 'annual'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'annual' : 'monthly')}
            />
            <span className={billingCycle === 'annual' ? 'font-bold' : 'text-muted-foreground'}>
              Anual
            </span>
            <Badge variant="secondary" className="ml-2">
              Economize até 20%
            </Badge>
          </div>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-7xl">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <PlanCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {activePlans.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  billingCycle={billingCycle}
                  isCurrentPlan={plan.id === currentPlanId}
                  onSelect={() => handlePlanSelect(plan)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Feature Comparison Table */}
      <section className="py-20 px-4 bg-background" id="comparison">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Compare Todos os Recursos
          </h2>
          <FeatureComparisonTable 
            plans={activePlans} 
            currentPlanId={currentPlanId}
          />
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h2 className="text-3xl font-bold">
            Ainda tem dúvidas sobre qual plano escolher?
          </h2>
          <p className="text-lg text-muted-foreground">
            Nossa equipe está pronta para ajudar você a encontrar a solução perfeita
          </p>
          <Button size="lg" variant="outline" asChild>
            <Link to="/dashboard">Voltar ao Dashboard</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
