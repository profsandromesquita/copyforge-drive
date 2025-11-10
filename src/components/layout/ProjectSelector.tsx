import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Gear } from 'phosphor-react';
import { useProject } from '@/hooks/useProject';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const ProjectSelector = () => {
  const { projects, activeProject, setActiveProject, loading } = useProject();
  const navigate = useNavigate();

  const handleValueChange = (value: string) => {
    if (value === '__new__') {
      navigate('/project/new');
    } else {
      const project = projects.find(p => p.id === value);
      if (project) {
        setActiveProject(project);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-4 border-b border-border">
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 border-b border-border">
      <label className="text-xs text-muted-foreground mb-2 block">Projeto</label>
      <div className="flex items-center gap-2">
        <Select
          value={activeProject?.id || ''}
          onValueChange={handleValueChange}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecione um projeto">
              {activeProject?.name || "Selecione um projeto"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="z-50 bg-popover border-border">
            <SelectGroup>
              <SelectLabel>Projetos</SelectLabel>
              {projects.length === 0 ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  Nenhum projeto criado
                </div>
              ) : (
                projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))
              )}
            </SelectGroup>
            <SelectSeparator />
            <SelectItem value="__new__" className="text-primary font-medium">
              <div className="flex items-center">
                <Plus size={16} className="mr-2" />
                Novo Projeto
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        
        {activeProject && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/project/${activeProject.id}`)}
                  className="shrink-0"
                >
                  <Gear size={20} weight="bold" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configurações do Projeto</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};
