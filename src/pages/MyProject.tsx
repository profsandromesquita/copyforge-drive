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
  const { activeProject } = useProject();
  const [activeSection, setActiveSection] = useState<ProjectSection>('identity');

  // Força modo claro
  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  // Redirecionar se não houver projeto ativo
  useEffect(() => {
    if (!activeProject) {
      navigate('/dashboard');
    }
  }, [activeProject, navigate]);

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
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-40 bg-background border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <MobileMenu />
            <h1 className="text-lg font-semibold">Meu Projeto</h1>
            <UserMenu />
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between px-8 py-6 border-b border-border bg-background sticky top-0 z-40">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meu Projeto</h1>
            <p className="text-muted-foreground mt-1">{activeProject.name}</p>
          </div>
          <UserMenu />
        </div>

        {/* Main Content with Internal Sidebar */}
        <div className="flex flex-1">
          {/* Internal Vertical Sidebar */}
          <aside className="hidden lg:block w-64 border-r border-border bg-muted/30">
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
          <div className="lg:hidden border-b border-border bg-background sticky top-[57px] z-30">
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
          <main className="flex-1">
            <ScrollArea className="h-[calc(100vh-73px)] lg:h-[calc(100vh-89px)]">
              <div className="p-4 lg:p-8">
                {activeSection === 'identity' && <IdentityTab isNew={false} />}
                {activeSection === 'audience' && <AudienceTab />}
                {activeSection === 'offers' && <OffersTab />}
              </div>
            </ScrollArea>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MyProject;
