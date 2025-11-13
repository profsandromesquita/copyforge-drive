import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { Buildings, Users, Megaphone } from "phosphor-react";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import { UserMenu } from "@/components/layout/UserMenu";
import { useProject } from "@/hooks/useProject";
import { IdentityTab } from "@/components/project-config/IdentityTab";
import { AudienceTab } from "@/components/project-config/AudienceTab";
import { OffersTab } from "@/components/project-config/OffersTab";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type ProjectSection = 'identity' | 'audience' | 'offers';

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
      navigate('/dashboard', { replace: true });
    }
  }, [activeProject, loading, navigate]);

  // Mostrar loading enquanto carrega
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
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
      label: 'Segmentos de Público',
    },
    {
      id: 'offers' as ProjectSection,
      icon: Megaphone,
      label: 'Ofertas',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header com barra de pesquisa */}
        <header className="bg-background px-6 py-4 sticky top-0 z-50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Meu Projeto</h2>
              <p className="text-sm text-muted-foreground">{activeProject.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="flex-1 pb-20 lg:pb-0 rounded-tl-3xl overflow-hidden" style={{ backgroundColor: '#f5f5f5' }}>
          <div className="flex h-full">
            {/* Internal Vertical Sidebar */}
            <aside className="hidden lg:block w-64 border-r border-border bg-background">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    
                    return (
                      <Button
                        key={section.id}
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full justify-start gap-3 ${
                          isActive ? "" : "hover:bg-accent"
                        }`}
                        onClick={() => setActiveSection(section.id)}
                      >
                        <Icon size={20} weight={isActive ? "fill" : "regular"} />
                        <span>{section.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            </aside>

            {/* Mobile Section Selector */}
            <div className="lg:hidden w-full border-b border-border bg-background sticky top-0 z-30">
              <ScrollArea className="w-full">
                <div className="flex gap-2 p-4">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    
                    return (
                      <Button
                        key={section.id}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className="gap-2 whitespace-nowrap"
                        onClick={() => setActiveSection(section.id)}
                      >
                        <Icon size={16} weight={isActive ? "fill" : "regular"} />
                        <span>{section.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6">
                  {activeSection === 'identity' && <IdentityTab isNew={false} />}
                  {activeSection === 'audience' && <AudienceTab />}
                  {activeSection === 'offers' && <OffersTab />}
                </div>
              </ScrollArea>
            </div>
          </div>
        </main>
      </div>

      <MobileMenu />
    </div>
  );
};

export default MyProject;
