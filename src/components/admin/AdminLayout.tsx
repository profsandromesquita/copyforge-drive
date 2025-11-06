import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";
import { CreditBadge } from "@/components/credits/CreditBadge";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col w-full">
      <div className="sticky top-0 z-50 border-b bg-background">
        <div className="flex items-center justify-between px-6 h-16">
          <AdminHeader />
          <CreditBadge />
        </div>
      </div>
      <div className="flex-1 flex w-full">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
