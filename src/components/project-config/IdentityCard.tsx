import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'phosphor-react';
import { Project } from '@/types/project-config';

interface IdentityCardProps {
  project: Project;
  onEdit: () => void;
}

export const IdentityCard = ({ project, onEdit }: IdentityCardProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-start justify-between">
        <h3 className="font-bold text-xl">{project.brand_name || project.name}</h3>
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil size={18} />
        </Button>
      </div>

      {/* Setor */}
      {project.sector && (
        <div>
          <p className="font-medium text-sm text-muted-foreground">Setor de atuação</p>
          <p className="text-base mt-1">{project.sector}</p>
        </div>
      )}

      {/* Propósito Central */}
      {project.central_purpose && (
        <div>
          <p className="font-medium text-sm text-muted-foreground">Propósito central</p>
          <p className="text-base mt-1">{project.central_purpose}</p>
        </div>
      )}

      {/* Personalidade */}
      {project.brand_personality && project.brand_personality.length > 0 && (
        <div>
          <p className="font-medium text-sm text-muted-foreground mb-2">Personalidade da marca</p>
          <div className="flex flex-wrap gap-2">
            {project.brand_personality.map(p => (
              <Badge key={p} variant="outline">{p}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
