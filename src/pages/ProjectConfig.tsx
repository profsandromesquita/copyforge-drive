import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QualityIndicator } from '@/components/project-config/QualityIndicator';
import { IdentityTab } from '@/components/project-config/IdentityTab';
import { AudienceTab } from '@/components/project-config/AudienceTab';
import { OffersTab } from '@/components/project-config/OffersTab';
import { useProject } from '@/hooks/useProject';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock } from 'phosphor-react';
import { toast } from 'sonner';

const ProjectConfig = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { projects, activeProject, setActiveProject, createProject, refreshProjects } = useProject();
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('identity');

  // Verifica se as abas estão desbloqueadas
  const isIdentityComplete = activeProject?.brand_name && activeProject?.sector;
  const hasAudienceSegments = activeProject?.audience_segments && activeProject.audience_segments.length > 0;
  
  const isAudienceUnlocked = isIdentityComplete;
  const isOffersUnlocked = isIdentityComplete && hasAudienceSegments;

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

  // Atualiza a aba ativa quando o projeto muda
  useEffect(() => {
    if (activeProject) {
      // Se estiver em uma aba bloqueada, volta para a última desbloqueada
      if (activeTab === 'offers' && !isOffersUnlocked) {
        setActiveTab('audience');
      }
      if (activeTab === 'audience' && !isAudienceUnlocked) {
        setActiveTab('identity');
      }
    }
  }, [activeProject, activeTab, isAudienceUnlocked, isOffersUnlocked]);

  const handleTabChange = (value: string) => {
    if (value === 'audience' && !isAudienceUnlocked) {
      toast.error('Complete a Identidade do Projeto primeiro');
      return;
    }
    if (value === 'offers' && !isOffersUnlocked) {
      toast.error('Adicione pelo menos um Segmento de Público primeiro');
      return;
    }
    setActiveTab(value);
  };

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
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <QualityIndicator />
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="identity">
              Identidade
            </TabsTrigger>
            <TabsTrigger 
              value="audience" 
              disabled={!isAudienceUnlocked}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center gap-2">
                {!isAudienceUnlocked && <Lock size={16} />}
                Segmentos de Público
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="offers" 
              disabled={!isOffersUnlocked}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center gap-2">
                {!isOffersUnlocked && <Lock size={16} />}
                Ofertas
              </span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="identity" className="space-y-6">
            <IdentityTab 
              isNew={isNew} 
              onSaveSuccess={() => {
                // Avança para próxima aba quando salvar identidade pela primeira vez
                if (isAudienceUnlocked && activeTab === 'identity') {
                  setActiveTab('audience');
                }
              }}
            />
          </TabsContent>
          
          <TabsContent value="audience" className="space-y-6">
            <AudienceTab 
              onSaveSuccess={() => {
                // Avança para próxima aba quando adicionar primeiro segmento
                if (isOffersUnlocked && activeTab === 'audience') {
                  setActiveTab('offers');
                }
              }}
            />
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
