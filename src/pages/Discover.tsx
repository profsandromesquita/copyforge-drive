import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";

const Discover = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 pb-20 lg:pb-0">
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Descobrir</h1>
            <p className="text-muted-foreground">
              Explore e copie copies criadas por outros usuários
            </p>
          </div>
          
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              Funcionalidade em desenvolvimento...
            </p>
          </div>
        </div>
      </main>

      <MobileMenu />
    </div>
  );
};

export default Discover;
