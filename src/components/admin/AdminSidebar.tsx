import { NavLink } from "react-router-dom";
import { 
  ChartBar, 
  Users, 
  FolderOpen, 
  FileText, 
  Gear 
} from "phosphor-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: ChartBar, label: "Dashboard", path: "/painel/admin" },
  { icon: Users, label: "Clientes", path: "/painel/admin/clientes" },
  { icon: FolderOpen, label: "Workspaces", path: "/painel/admin/workspaces" },
  { icon: FileText, label: "Copy IA", path: "/painel/admin/copies" },
  { icon: Gear, label: "Configurações", path: "/painel/admin/configuracoes" },
];

export const AdminSidebar = () => {
  return (
    <aside className="w-64 bg-background border-r hidden lg:block">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/painel/admin"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
