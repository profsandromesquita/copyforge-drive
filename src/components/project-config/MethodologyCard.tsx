import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PencilSimple } from 'phosphor-react';
import { Methodology } from '@/types/project-config';

interface MethodologyCardProps {
  methodology: Methodology;
  onEdit: () => void;
}

const fields = [
  { key: 'tese_central', label: 'Tese Central' },
  { key: 'mecanismo_primario', label: 'Mecanismo Primário' },
  { key: 'por_que_funciona', label: 'Por que Funciona' },
  { key: 'erro_invisivel', label: 'Erro Invisível' },
  { key: 'diferenciacao', label: 'Diferenciação' },
  { key: 'principios_fundamentos', label: 'Princípios/Fundamentos' },
  { key: 'etapas_metodo', label: 'Etapas do Método' },
  { key: 'transformacao_real', label: 'Transformação Real' },
  { key: 'prova_funcionamento', label: 'Prova de Funcionamento' },
] as const;

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
        {fields.map((field) => {
          const value = methodology[field.key as keyof Methodology];
          
          return (
            <div key={field.key} className="space-y-2 pb-4 border-b border-border last:border-0 last:pb-0">
              <h3 className="text-sm font-medium text-muted-foreground">
                {field.label}
              </h3>
              <p className="text-base whitespace-pre-wrap">{value}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
