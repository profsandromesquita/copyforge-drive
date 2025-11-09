import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Zap, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Skeleton } from '@/components/ui/skeleton';

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthly_price: number;
  annual_price: number;
  max_projects: number | null;
  max_copies: number | null;
  copy_ai_enabled: boolean;
  credits_per_month: number;
  rollover_enabled: boolean;
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
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    if (open && activeWorkspace?.id) {
      loadPlansAndCurrentPlan();
    }
  }, [open, activeWorkspace?.id]);

  const loadPlansAndCurrentPlan = async () => {
    if (!activeWorkspace?.id) return;

    setLoading(true);
    try {
      // Buscar planos ativos
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (plansError) throw plansError;

      // Buscar plano atual do workspace
      const { data: subscriptionData, error: subError } = await supabase
        .from('workspace_subscriptions')
        .select('plan_id, subscription_plans(*)')
        .eq('workspace_id', activeWorkspace.id)
        .eq('status', 'active')
        .single();

      if (subError) throw subError;

      setPlans(plansData || []);
      setCurrentPlan(subscriptionData?.subscription_plans as any);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const message = MESSAGES[limitType];

  const getFeatureValue = (plan: SubscriptionPlan, feature: 'projects' | 'copies' | 'copy_ai') => {
    switch (feature) {
      case 'projects':
        return plan.max_projects === null ? 'Ilimitado' : plan.max_projects;
      case 'copies':
        return plan.max_copies === null ? 'Ilimitado' : plan.max_copies;
      case 'copy_ai':
        return plan.copy_ai_enabled ? 'Sim' : 'Não';
    }
  };

  const isPlanBetter = (plan: SubscriptionPlan) => {
    if (!currentPlan) return true;

    switch (limitType) {
      case 'projects':
        if (plan.max_projects === null) return true;
        if (currentPlan.max_projects === null) return false;
        return plan.max_projects > currentPlan.max_projects;
      case 'copies':
        if (plan.max_copies === null) return true;
        if (currentPlan.max_copies === null) return false;
        return plan.max_copies > currentPlan.max_copies;
      case 'copy_ai':
        return plan.copy_ai_enabled && !currentPlan.copy_ai_enabled;
      default:
        return false;
    }
  };

  const getRecommendedPlan = () => {
    const betterPlans = plans.filter(isPlanBetter);
    return betterPlans[0] || null;
  };

  const recommendedPlan = getRecommendedPlan();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-primary" />
            {message.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {message.description}
          </DialogDescription>
        </DialogHeader>

        {currentLimit !== undefined && currentUsage !== undefined && (
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Uso Atual</span>
              <span className="text-sm font-bold">
                {currentUsage} / {currentLimit === null ? '∞' : currentLimit}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: currentLimit === null ? '100%' : `${Math.min((currentUsage / currentLimit) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.filter(isPlanBetter).map((plan) => {
              const isRecommended = plan.id === recommendedPlan?.id;

              return (
                <Card
                  key={plan.id}
                  className={`relative ${
                    isRecommended
                      ? 'border-primary shadow-lg ring-2 ring-primary/20'
                      : ''
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        <Zap className="h-3 w-3 mr-1" />
                        Recomendado
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {plan.description && (
                      <CardDescription className="text-xs">
                        {plan.description}
                      </CardDescription>
                    )}
                    <div className="mt-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">
                          R$ {plan.monthly_price.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground">/mês</span>
                      </div>
                      {plan.annual_price < plan.monthly_price * 12 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          R$ {plan.annual_price.toFixed(2)}/ano (economize{' '}
                          {(
                            ((plan.monthly_price * 12 - plan.annual_price) /
                              (plan.monthly_price * 12)) *
                            100
                          ).toFixed(0)}
                          %)
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>
                          {plan.max_projects === null
                            ? 'Projetos Ilimitados'
                            : `${plan.max_projects} Projetos`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>
                          {plan.max_copies === null
                            ? 'Copies Ilimitadas'
                            : `${plan.max_copies} Copies`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>
                          {plan.credits_per_month} Créditos/mês
                        </span>
                      </div>
                      {plan.copy_ai_enabled && (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Copy IA Habilitada</span>
                        </div>
                      )}
                      {plan.rollover_enabled && (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Rollover de Créditos</span>
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full"
                      variant={isRecommended ? 'default' : 'outline'}
                      onClick={() => {
                        // TODO: Implementar seleção de plano
                        console.log('Selected plan:', plan.id);
                      }}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Selecionar Plano
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Quer ver todos os planos e recursos?{' '}
            <a href="/planos" className="text-primary underline hover:no-underline">
              Comparar todos os planos
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
