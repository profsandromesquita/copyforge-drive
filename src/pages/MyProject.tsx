import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { Buildings, Users, Megaphone, Strategy } from "phosphor-react";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import { UserMenu } from "@/components/layout/UserMenu";
import { useProject } from "@/hooks/useProject";
import { IdentityTab } from "@/components/project-config/IdentityTab";
import { AudienceTab } from "@/components/project-config/AudienceTab";
import { OffersTab } from "@/components/project-config/OffersTab";
import { MethodologyTab } from "@/components/project-config/MethodologyTab";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import copyDriveIcon from "@/assets/copydrive-icon.svg";

type ProjectSection = 'identity' | 'audience' | 'offers' | 'methodology';

const MyProject = () => {
  const { setTheme } = useTheme();
  const navigate = useNavigate();
  const { activeProject, loading } = useProject();
  const [activeSection, setActiveSection] = useState<ProjectSection>('identity');

  // Força modo claro
  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  // Redirecionar se não houver projeto ativo (após carregar)
  useEffect(() => {
    if (!loading && !activeProject) {
      navigate('/drive', { replace: true });
    }
  }, [activeProject, loading, navigate]);

  // Mostrar loading enquanto carrega
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <img 
            src={copyDriveIcon} 
            alt="Loading" 
            className="h-16 animate-spin"
          />
          <p className="text-muted-foreground">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  // Se não há projeto, retorna null (mas o useEffect acima já redirecionou)
  if (!activeProject) {
    return null;
  }

  const sections = [
    {
      id: 'identity' as ProjectSection,
      icon: Buildings,
      label: 'Identidade',
    },
    {
      id: 'audience' as ProjectSection,
      icon: Users,
      label: 'Público-alvo',
    },
    {
      id: 'offers' as ProjectSection,
      icon: Megaphone,
      label: 'Ofertas',
    },
    {
      id: 'methodology' as ProjectSection,
      icon: Strategy,
      label: 'Metodologia',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header simples */}
        <header className="bg-background px-6 py-4 sticky top-0 z-50">
          <div className="flex items-center justify-end gap-4">
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 pb-20 lg:pb-0 rounded-tl-3xl overflow-hidden" style={{ backgroundColor: '#f5f5f5' }}>
          {/* Sidebar e conteúdo dentro da área cinza */}
          <div className="p-6 h-full">
            <div className="flex gap-6 h-full">
              {/* Internal Vertical Sidebar */}
              <aside className="hidden lg:block w-64 overflow-hidden border-r border-border/40">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-2 pr-6">
                    {sections.map((section) => {
                      const isActive = activeSection === section.id;
                      
                      return (
                        <Button
                          key={section.id}
                          variant={isActive ? "default" : "ghost"}
                          className={`w-full justify-start ${
                            isActive ? "" : "hover:bg-accent"
                          }`}
                          onClick={() => setActiveSection(section.id)}
                        >
                          <span>{section.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </aside>

              {/* Content Area */}
              <div className="flex-1 overflow-hidden">
                {/* Mobile Section Selector */}
                <div className="lg:hidden border-b border-border bg-background">
                  <ScrollArea className="w-full">
                    <div className="flex gap-2 p-4">
                      {sections.map((section) => {
                        const isActive = activeSection === section.id;
                        
                        return (
                          <Button
                            key={section.id}
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            className="whitespace-nowrap"
                            onClick={() => setActiveSection(section.id)}
                          >
                            <span>{section.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>

                {/* Content */}
                <ScrollArea className="h-full">
                  <div className="p-6">
                    {activeSection === 'identity' && <IdentityTab isNew={false} />}
                    {activeSection === 'audience' && <AudienceTab />}
                    {activeSection === 'offers' && <OffersTab />}
                    {activeSection === 'methodology' && <MethodologyTab />}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </main>
      </div>

      <MobileMenu />
    </div>
  );
};

export default MyProject;
