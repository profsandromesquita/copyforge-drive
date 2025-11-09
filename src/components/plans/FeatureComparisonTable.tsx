import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  max_projects: number | null;
  max_copies: number | null;
  copy_ai_enabled: boolean;
  credits_per_month: number;
  rollover_enabled: boolean;
  rollover_percentage: number;
  rollover_days: number;
}

interface Feature {
  category: string;
  name: string;
  key: keyof SubscriptionPlan | 'members' | 'priority_support' | 'account_manager';
  formatValue?: (value: any, plan: SubscriptionPlan) => string | JSX.Element;
}

const FEATURES: Feature[] = [
  { 
    category: 'Projetos e Copies', 
    name: 'Máximo de Projetos', 
    key: 'max_projects',
    formatValue: (v) => v === null ? '∞' : v 
  },
  { 
    category: 'Projetos e Copies', 
    name: 'Máximo de Copies', 
    key: 'max_copies',
    formatValue: (v) => v === null ? '∞' : v 
  },
  { 
    category: 'Projetos e Copies', 
    name: 'Copy IA', 
    key: 'copy_ai_enabled',
    formatValue: (v) => v ? <Check className="h-4 w-4 text-primary mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />
  },
  
  { 
    category: 'Créditos', 
    name: 'Créditos Mensais', 
    key: 'credits_per_month',
    formatValue: (v) => v.toLocaleString('pt-BR')
  },
  { 
    category: 'Créditos', 
    name: 'Rollover de Créditos', 
    key: 'rollover_enabled',
    formatValue: (v) => v ? <Check className="h-4 w-4 text-primary mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />
  },
  { 
    category: 'Créditos', 
    name: 'Percentual de Rollover', 
    key: 'rollover_percentage',
    formatValue: (v, plan) => plan.rollover_enabled ? `${v}%` : '-'
  },
  { 
    category: 'Créditos', 
    name: 'Validade do Rollover (dias)', 
    key: 'rollover_days',
    formatValue: (v, plan) => plan.rollover_enabled ? `${v} dias` : '-'
  },
];

interface FeatureComparisonTableProps {
  plans: SubscriptionPlan[];
  currentPlanId: string | null;
}

export const FeatureComparisonTable = ({ plans, currentPlanId }: FeatureComparisonTableProps) => {
  // Agrupar features por categoria
  const groupedFeatures = FEATURES.reduce((acc, feature) => {
    if (!acc[feature.category]) acc[feature.category] = [];
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px] sticky left-0 bg-background z-10">Recursos</TableHead>
            {plans.map(plan => (
              <TableHead 
                key={plan.id}
                className={cn(
                  'text-center min-w-[150px]',
                  plan.id === currentPlanId && 'bg-primary/10'
                )}
              >
                <div className="space-y-1">
                  <div className="font-bold">{plan.name}</div>
                  {plan.id === currentPlanId && (
                    <Badge variant="default" className="text-xs">Seu Plano</Badge>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(groupedFeatures).map(([category, features]) => (
            <>
              {/* Category Header */}
              <TableRow key={`category-${category}`} className="bg-muted/50">
                <TableCell 
                  colSpan={plans.length + 1} 
                  className="font-semibold text-sm sticky left-0 z-10 bg-muted/50"
                >
                  {category}
                </TableCell>
              </TableRow>
              
              {/* Features in Category */}
              {features.map(feature => (
                <TableRow key={feature.name}>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">
                    {feature.name}
                  </TableCell>
                  {plans.map(plan => (
                    <TableCell 
                      key={plan.id}
                      className={cn(
                        'text-center',
                        plan.id === currentPlanId && 'bg-primary/5'
                      )}
                    >
                      {feature.formatValue 
                        ? feature.formatValue(plan[feature.key as keyof SubscriptionPlan], plan)
                        : plan[feature.key as keyof SubscriptionPlan]
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
