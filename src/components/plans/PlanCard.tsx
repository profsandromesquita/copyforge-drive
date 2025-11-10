import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Users, Zap } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

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
  rollover_percentage: number;
  is_active: boolean;
  checkout_url_monthly: string | null;
  checkout_url_annual: string | null;
}

interface PlanCardProps {
  plan: SubscriptionPlan;
  billingCycle: 'monthly' | 'annual';
  isCurrentPlan: boolean;
  onSelect: () => void;
}

const FeatureItem = ({ text, highlighted }: { text: string; highlighted?: boolean }) => (
  <div className="flex items-start gap-2">
    <Check className={cn(
      "h-4 w-4 mt-0.5 flex-shrink-0",
      highlighted ? "text-primary" : "text-muted-foreground"
    )} />
    <span className={cn(
      "text-sm",
      highlighted ? "font-semibold" : ""
    )}>
      {text}
    </span>
  </div>
);

export const PlanCard = ({ plan, billingCycle, isCurrentPlan, onSelect }: PlanCardProps) => {
  const price = billingCycle === 'monthly' ? plan.monthly_price : plan.annual_price;
  const monthlyEquivalent = billingCycle === 'annual' ? plan.annual_price / 12 : price;
  const savings = billingCycle === 'annual' 
    ? ((plan.monthly_price * 12 - plan.annual_price) / (plan.monthly_price * 12) * 100).toFixed(0)
    : 0;

  const getRecommendationBadge = () => {
    if (plan.slug === 'pro') return { text: 'Mais Popular', variant: 'default' as const, icon: Sparkles };
    if (plan.slug === 'business') return { text: 'Melhor para Times', variant: 'secondary' as const, icon: Users };
    if (plan.slug === 'enterprise') return { text: 'Recursos Avançados', variant: 'secondary' as const, icon: Zap };
    return null;
  };

  const badge = getRecommendationBadge();
  const isRecommended = plan.slug === 'pro';

  return (
    <Card className={cn(
      "relative transition-all hover:shadow-lg",
      isCurrentPlan && "border-primary ring-2 ring-primary/20",
      isRecommended && "border-primary shadow-md"
    )}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant={badge.variant} className="gap-1">
            <badge.icon className="h-3 w-3" />
            {badge.text}
          </Badge>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute top-4 right-4">
          <Badge className="bg-primary">Seu Plano</Badge>
        </div>
      )}

      <CardHeader className={cn(isCurrentPlan && "pt-6")}>
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description || "Plano completo para suas necessidades"}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Pricing */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">
              {formatCurrency(monthlyEquivalent)}
            </span>
            <span className="text-muted-foreground">/mês</span>
          </div>
          {billingCycle === 'annual' && (
            <p className="text-sm text-muted-foreground mt-1">
              Cobrado {formatCurrency(price)} anualmente
            </p>
          )}
          {Number(savings) > 0 && (
            <Badge variant="secondary" className="mt-2">
              Economize {savings}%
            </Badge>
          )}
        </div>

        {/* Key Features */}
        <div className="space-y-3">
          <FeatureItem 
            text={plan.max_projects === null ? 'Projetos Ilimitados' : `${plan.max_projects} Projeto${plan.max_projects > 1 ? 's' : ''}`}
            highlighted={plan.max_projects === null}
          />
          <FeatureItem 
            text={plan.max_copies === null ? 'Copies Ilimitadas' : `${plan.max_copies} Cop${plan.max_copies > 1 ? 'ies' : 'y'}`}
            highlighted={plan.max_copies === null}
          />
          <FeatureItem 
            text={`${plan.credits_per_month} Créditos/mês`}
          />
          {plan.copy_ai_enabled && (
            <FeatureItem 
              text="Copy IA Habilitada"
              highlighted
            />
          )}
          {plan.rollover_enabled && (
            <FeatureItem 
              text={`Rollover de ${plan.rollover_percentage}% dos créditos`}
            />
          )}
        </div>

        {/* CTA Button */}
        <Button 
          className="w-full" 
          variant={isCurrentPlan ? 'outline' : isRecommended ? 'default' : 'outline'}
          disabled={isCurrentPlan}
          onClick={onSelect}
        >
          {isCurrentPlan ? 'Plano Atual' : 'Selecionar Plano'}
        </Button>
      </CardContent>
    </Card>
  );
};
