import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectGroup, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Gear, Crown, Warning } from 'phosphor-react';
import { useProject } from '@/hooks/useProject';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { UpgradeModal } from '@/components/workspace/UpgradeModal';
import { useState, useEffect } from 'react';
import { Project } from '@/types/project-config';

// Função helper para verificar se projeto está completo
const isProjectIncomplete = (project: Project | null): boolean => {
  if (!project) return false;
  
  const hasAudienceSegments = project.audience_segments && project.audience_segments.length > 0;
  const hasOffers = project.offers && project.offers.length > 0;
  
  return !hasAudienceSegments || !hasOffers;
};

export const ProjectSelector = () => {
  const { projects, activeProject, setActiveProject, loading } = useProject();
  const navigate = useNavigate();
  const { checkProjectLimit } = usePlanLimits();
  const [limitReached, setLimitReached] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{ current?: number; limit?: number }>({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const checkLimit = async () => {
      const result = await checkProjectLimit();
      setLimitReached(!result.allowed);
      setLimitInfo({
        current: result.current,
        limit: result.limit,
      });
    };
    
    if (!loading) {
      checkLimit();
    }
  }, [loading, projects.length, checkProjectLimit]);

  const projectIncomplete = isProjectIncomplete(activeProject);

  const handleValueChange = (value: string) => {
    if (value === '__new__') {
      if (limitReached) {
        setShowUpgradeModal(true);
        return;
      }
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
            <SelectItem 
              value="__new__" 
              className={limitReached ? "text-muted-foreground" : "text-primary font-medium"}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <Plus size={16} className="mr-2" />
                  Novo Projeto
                </div>
                {limitReached && (
                  <Crown size={16} className="text-primary ml-2" weight="fill" />
                )}
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
      
      {/* Alerta discreto quando projeto está incompleto */}
      {projectIncomplete && activeProject && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate(`/project/${activeProject.id}`)}
                className="mt-2 w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-500 hover:bg-yellow-500/20 transition-colors"
              >
                <Warning size={14} weight="fill" className="flex-shrink-0" />
                <span className="flex-1 text-left">Projeto incompleto</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="text-xs">
                {!activeProject.audience_segments?.length && !activeProject.offers?.length
                  ? "Adicione segmentos de público e ofertas para completar o projeto"
                  : !activeProject.audience_segments?.length
                  ? "Adicione segmentos de público para completar o projeto"
                  : "Adicione ofertas para completar o projeto"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        limitType="general"
      />
    </div>
  );
};
