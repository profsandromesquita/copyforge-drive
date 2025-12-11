import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Sparkles, Users, Zap } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { PublicPlanOffer } from "@/hooks/usePlanOffersPublic";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  max_projects: number | null;
  max_copies: number | null;
  copy_ai_enabled: boolean;
  credits_per_month: number;
  rollover_enabled: boolean;
  rollover_percentage: number;
  is_active: boolean;
}

interface PlanCardProps {
  plan: SubscriptionPlan;
  offers: PublicPlanOffer[];
  selectedOfferId: string;
  isCurrentPlan: boolean;
  onSelect: (offerId: string) => void;
  onOfferChange: (offerId: string) => void;
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

const getBillingPeriodLabel = (value: number, unit: string) => {
  if (unit === 'lifetime') return 'Vitalício';
  const unitLabel = unit === 'days' ? 'dia' : unit === 'months' ? 'mês' : 'ano';
  return `${value} ${unitLabel}${value > 1 ? (unit === 'months' ? 'es' : 's') : ''}`;
};

export const PlanCard = ({ plan, offers, selectedOfferId, isCurrentPlan, onSelect, onOfferChange }: PlanCardProps) => {
  const selectedOffer = offers.find(o => o.id === selectedOfferId) || offers[0];
  
  if (!selectedOffer) {
    return (
      <Card className="relative">
        <CardHeader>
          <CardTitle>{plan.name}</CardTitle>
          <CardDescription>{plan.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhuma oferta disponível</p>
        </CardContent>
      </Card>
    );
  }

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
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description || 'Plano personalizado'}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Seletor de Oferta */}
        {offers.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Escolha o período:</label>
            <Select value={selectedOfferId} onValueChange={onOfferChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {offers.map((offer) => (
                  <SelectItem key={offer.id} value={offer.id}>
                    {offer.name} - {formatCurrency(offer.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Preço */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{formatCurrency(selectedOffer.price)}</span>
            <span className="text-sm text-muted-foreground">
              / {getBillingPeriodLabel(selectedOffer.billing_period_value, selectedOffer.billing_period_unit)}
            </span>
          </div>
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

        {/* Call to Action */}
        <Button 
          className="w-full" 
          variant={isCurrentPlan ? "outline" : "default"}
          onClick={() => onSelect(selectedOfferId)}
          disabled={isCurrentPlan}
        >
          {isCurrentPlan ? 'Plano Atual' : 'Selecionar Plano'}
        </Button>
      </CardContent>
    </Card>
  );
};
