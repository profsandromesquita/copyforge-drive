import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 pb-24 md:pb-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`h-2 w-2 rounded-full transition-all ${isIdentityComplete ? 'bg-primary w-8' : 'bg-muted'}`} />
          <div className={`h-2 w-2 rounded-full transition-all ${hasAudienceSegments ? 'bg-primary w-8' : 'bg-muted'}`} />
          <div className={`h-2 w-2 rounded-full transition-all ${activeTab === 'offers' ? 'bg-primary w-8' : 'bg-muted'}`} />
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full h-auto p-1 bg-muted/50">
            <TabsTrigger 
              value="identity"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 md:py-2"
            >
              <span className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-xs md:text-sm">
                <span className="hidden md:inline">Identidade</span>
                <span className="md:hidden">Identidade</span>
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="audience" 
              disabled={!isAudienceUnlocked}
              className="disabled:opacity-40 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 md:py-2"
            >
              <span className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-xs md:text-sm">
                {!isAudienceUnlocked && <Lock size={14} className="md:hidden" />}
                {!isAudienceUnlocked && <Lock size={16} className="hidden md:block" />}
                <span className="hidden md:inline">Segmentos de Público</span>
                <span className="md:hidden">Público</span>
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="offers" 
              disabled={!isOffersUnlocked}
              className="disabled:opacity-40 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 md:py-2"
            >
              <span className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-xs md:text-sm">
                {!isOffersUnlocked && <Lock size={14} className="md:hidden" />}
                {!isOffersUnlocked && <Lock size={16} className="hidden md:block" />}
                <span>Ofertas</span>
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
