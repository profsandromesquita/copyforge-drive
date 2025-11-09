import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex flex-col w-full">
        <div className="sticky top-0 z-50 border-b bg-background">
          <div className="flex items-center gap-4 px-6 h-16">
            <SidebarTrigger />
            <AdminHeader />
          </div>
        </div>
        <div className="flex-1 flex w-full">
          <AdminSidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
