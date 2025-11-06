import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectConfigHeader } from '@/components/project-config/ProjectConfigHeader';
import { QualityIndicator } from '@/components/project-config/QualityIndicator';
import { IdentityTab } from '@/components/project-config/IdentityTab';
import { AudienceTab } from '@/components/project-config/AudienceTab';
import { OffersTab } from '@/components/project-config/OffersTab';
import { useProject } from '@/hooks/useProject';
import { Skeleton } from '@/components/ui/skeleton';

const ProjectConfig = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { projects, activeProject, setActiveProject, createProject, refreshProjects } = useProject();
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);

  // Força modo claro no ProjectConfig
  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  useEffect(() => {
    const init = async () => {
      if (id === 'new') {
        setIsNew(true);
        // Limpa o activeProject para novo projeto
        setActiveProject(null);
        setLoading(false);
      } else if (id) {
        // Load existing project
        await refreshProjects();
        const project = projects.find(p => p.id === id);
        if (project) {
          setActiveProject(project);
        } else {
          navigate('/dashboard');
        }
        setLoading(false);
      } else {
        navigate('/dashboard');
      }
    };

    init();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ProjectConfigHeader isNew={isNew} />
      
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <QualityIndicator />
        
        <Tabs defaultValue="identity" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="identity">Identidade</TabsTrigger>
            <TabsTrigger value="audience">Segmentos de Público</TabsTrigger>
            <TabsTrigger value="offers">Ofertas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="identity" className="space-y-6">
            <IdentityTab isNew={isNew} />
          </TabsContent>
          
          <TabsContent value="audience" className="space-y-6">
            <AudienceTab />
          </TabsContent>
          
          <TabsContent value="offers" className="space-y-6">
            <OffersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectConfig;
