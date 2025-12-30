import { NavLink, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  Users, 
  FolderOpen, 
  FileText, 
  Settings,
  CreditCard,
  MessageSquareText
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: BarChart3, label: "Dashboard", path: "/painel/admin" },
  { icon: Users, label: "Clientes", path: "/painel/admin/clientes" },
  { icon: FolderOpen, label: "Workspaces", path: "/painel/admin/workspaces" },
  { icon: FileText, label: "Copy IA", path: "/painel/admin/copies" },
  { icon: CreditCard, label: "Transações", path: "/painel/admin/transacoes" },
  { icon: MessageSquareText, label: "Feedbacks", path: "/painel/admin/feedbacks" },
  { icon: Settings, label: "Configurações", path: "/painel/admin/settings" },
];

export const AdminSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex w-20 border-r z-30 bg-background">
      <nav className="pt-4 w-full">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = item.path === "/painel/admin" 
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/painel/admin"}
                  className={cn(
                    "flex items-center justify-center h-14 transition-colors relative group",
                    isActive && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <item.icon className="h-6 w-6 flex-shrink-0" />
                  
                  {/* Tooltip on hover */}
                  <span className="absolute left-full ml-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                    {item.label}
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};
