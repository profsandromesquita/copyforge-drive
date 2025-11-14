import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { usePlanOffersPublic } from "@/hooks/usePlanOffersPublic";
import { PlanCard } from "@/components/plans/PlanCard";
import { FeatureComparisonTable } from "@/components/plans/FeatureComparisonTable";
import { FAQSection } from "@/components/plans/FAQSection";
import { TestimonialsSection } from "@/components/plans/TestimonialsSection";
import { Button } from "@/components/ui/button";
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
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [selectedOffers, setSelectedOffers] = useState<Record<string, string>>({});

  // Filtrar apenas planos ativos
  const activePlans = plans?.filter(p => p.is_active) || [];
  const planIds = activePlans.map(p => p.id);
  
  // Buscar ofertas de todos os planos ativos
  const { data: offersByPlan = {}, isLoading: isLoadingOffers } = usePlanOffersPublic(planIds);

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

  const handlePlanSelect = (plan: any, offerId: string) => {
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

    // Buscar a oferta selecionada
    const offers = offersByPlan[plan.id] || [];
    const selectedOffer = offers.find(o => o.id === offerId);
    
    if (!selectedOffer) {
      toast.error('Oferta não encontrada');
      return;
    }

    if (!selectedOffer.checkout_url) {
      toast.error('URL de checkout não configurada para esta oferta');
      return;
    }

    // Abrir URL de checkout em nova aba
    window.open(selectedOffer.checkout_url, '_blank');
  };

  const handleOfferChange = (planId: string, offerId: string) => {
    setSelectedOffers(prev => ({ ...prev, [planId]: offerId }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header com botão voltar (se logado) */}
      {user && (
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => navigate('/my-project')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-4">
              Escolha seu plano
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Planos que crescem com você
            </h1>
            <p className="text-lg text-muted-foreground">
              Escolha o plano ideal para o seu negócio. Sem surpresas, sem taxas escondidas.
            </p>
          </div>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {(isLoading || isLoadingOffers) ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <PlanCardSkeleton />
              <PlanCardSkeleton />
              <PlanCardSkeleton />
              <PlanCardSkeleton />
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {activePlans.map((plan) => {
                const planOffers = offersByPlan[plan.id] || [];
                const selectedOfferId = selectedOffers[plan.id] || planOffers[0]?.id;
                
                return (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    offers={planOffers}
                    selectedOfferId={selectedOfferId}
                    isCurrentPlan={plan.id === currentPlanId}
                    onSelect={(offerId) => handlePlanSelect(plan, offerId)}
                    onOfferChange={(offerId) => handleOfferChange(plan.id, offerId)}
                  />
                );
              })}
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
            <Link to="/my-project">Voltar</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
