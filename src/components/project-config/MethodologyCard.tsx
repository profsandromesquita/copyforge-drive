import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PencilSimple } from 'phosphor-react';
import { Methodology } from '@/types/project-config';

interface MethodologyCardProps {
  methodology: Methodology;
  onEdit: () => void;
}

export const MethodologyCard = ({ methodology, onEdit }: MethodologyCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-semibold">Metodologia do Projeto</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="h-8 w-8"
        >
          <PencilSimple size={18} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Framework</h3>
          <p className="text-base font-medium">{methodology.framework}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((step) => {
            const stepKey = `step${step}` as const;
            const name = methodology[`${stepKey}_name` as keyof Methodology] as string;
            const description = methodology[`${stepKey}_description` as keyof Methodology] as string;
            
            return (
              <div key={step} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Passo {step}
                </h3>
                <p className="text-base font-medium">{name}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
