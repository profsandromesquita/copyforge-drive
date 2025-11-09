import { ArrowRight, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PlanFeature {
  label: string;
  current: string | number | boolean | null;
  new: string | number | boolean | null;
  isLimit?: boolean;
}

interface PlanComparisonCardProps {
  currentPlanName: string;
  newPlanName: string;
  features: PlanFeature[];
}

export const PlanComparisonCard = ({ currentPlanName, newPlanName, features }: PlanComparisonCardProps) => {
  const formatValue = (value: string | number | boolean | null, isLimit?: boolean) => {
    if (value === null && isLimit) return "Ilimitado";
    if (typeof value === 'boolean') return value ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-muted-foreground" />;
    return value;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center mb-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Plano Atual</p>
            <p className="font-semibold text-lg">{currentPlanName}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-primary" />
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Novo Plano</p>
            <p className="font-semibold text-lg text-primary">{newPlanName}</p>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          {features.map((feature, index) => (
            <div key={index} className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center py-2 border-b last:border-b-0">
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">{feature.label}</p>
                <p className="font-medium flex items-center justify-center">
                  {formatValue(feature.current, feature.isLimit)}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">&nbsp;</p>
                <p className="font-medium text-primary flex items-center justify-center">
                  {formatValue(feature.new, feature.isLimit)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
