import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'phosphor-react';
import { useProject } from '@/hooks/useProject';
import { Skeleton } from '@/components/ui/skeleton';

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
      <Select
        value={activeProject?.id || ''}
        onValueChange={handleValueChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione um projeto">
            {activeProject?.name || "Selecione um projeto"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
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
    </div>
  );
};
