import { Plus, MagnifyingGlass } from "phosphor-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import DriveCard from "@/components/drive/DriveCard";

const Dashboard = () => {
  // Mock data
  const items = [
    { id: 1, type: "folder" as const, title: "Projeto Landing Page", subtitle: "5 itens" },
    { id: 2, type: "copy" as const, title: "Copy Homepage - Versão 1", subtitle: "Editado há 2 horas" },
    { id: 3, type: "funnel" as const, title: "Funil de Vendas Completo", subtitle: "3 etapas" },
    { id: 4, type: "folder" as const, title: "Cliente XYZ", subtitle: "12 itens" },
    { id: 5, type: "copy" as const, title: "Email de Boas-vindas", subtitle: "Editado ontem" },
    { id: 6, type: "copy" as const, title: "Anúncio Facebook", subtitle: "Editado há 3 dias" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 pb-20 lg:pb-0">
        {/* Header */}
        <div className="border-b border-border bg-background sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-md relative">
                <MagnifyingGlass 
                  size={20} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Buscar..."
                  className="pl-10 bg-background"
                />
              </div>
              <Button size="lg" className="gap-2">
                <Plus size={20} weight="bold" />
                <span className="hidden sm:inline">Novo</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <DriveCard
                key={item.id}
                type={item.type}
                title={item.title}
                subtitle={item.subtitle}
                onClick={() => console.log("Clicked:", item.title)}
              />
            ))}
          </div>
        </div>
      </main>

      <MobileMenu />
    </div>
  );
};

export default Dashboard;
