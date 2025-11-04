import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";

const Discover = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 pb-20 lg:pb-0">
        <div className="p-6">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-foreground mb-2">Descobrir</h2>
            <p className="text-muted-foreground">Em breve...</p>
          </div>
        </div>
      </main>

      <MobileMenu />
    </div>
  );
};

export default Discover;
