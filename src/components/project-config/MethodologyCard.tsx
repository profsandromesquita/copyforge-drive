import { Button } from '@/components/ui/button';
import { Pencil, Trash } from 'phosphor-react';
import { Methodology } from '@/types/project-config';

interface MethodologyCardProps {
  methodology: Methodology;
  onEdit: (methodology: Methodology) => void;
  onDelete: (methodologyId: string) => void;
}

export const MethodologyCard = ({ methodology, onEdit, onDelete }: MethodologyCardProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-bold text-lg">{methodology.name}</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(methodology)}>
            <Pencil size={18} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(methodology.id)}>
            <Trash size={18} className="text-destructive" />
          </Button>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-muted-foreground">Tese Central:</p>
          <p className="text-foreground line-clamp-2">{methodology.tese_central}</p>
        </div>

        <div>
          <p className="font-medium text-muted-foreground">Mecanismo Primário:</p>
          <p className="text-foreground line-clamp-2">{methodology.mecanismo_primario}</p>
        </div>

        <div>
          <p className="font-medium text-muted-foreground">Diferenciação:</p>
          <p className="text-foreground line-clamp-2">{methodology.diferenciacao}</p>
        </div>
      </div>
    </div>
  );
};
