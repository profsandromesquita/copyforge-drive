import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'phosphor-react';
import { useProject } from '@/hooks/useProject';

interface ProjectConfigHeaderProps {
  isNew: boolean;
}

export const ProjectConfigHeader = ({ isNew }: ProjectConfigHeaderProps) => {
  const navigate = useNavigate();
  const { activeProject } = useProject();
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (activeProject && !isNew) {
      // Usa brand_name se disponível, senão usa name
      setDisplayName(activeProject.brand_name || activeProject.name);
    } else if (isNew) {
      setDisplayName('Novo Projeto');
    }
  }, [activeProject?.id, activeProject?.name, activeProject?.brand_name, isNew]);

  return (
    <div className="border-b border-border bg-background sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={20} />
          </Button>

          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {displayName}
            </h1>
            {isNew && (
              <p className="text-sm text-muted-foreground mt-1">
                Defina o nome do projeto na aba de Identidade
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};
