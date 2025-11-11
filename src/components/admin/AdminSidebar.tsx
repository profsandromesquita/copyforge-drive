import { NavLink, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  Users, 
  FolderOpen, 
  FileText, 
  Settings,
  Brain,
  CreditCard
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: BarChart3, label: "Dashboard", path: "/painel/admin" },
  { icon: Users, label: "Clientes", path: "/painel/admin/clientes" },
  { icon: FolderOpen, label: "Workspaces", path: "/painel/admin/workspaces" },
  { icon: FileText, label: "Copy IA", path: "/painel/admin/copies" },
  { icon: CreditCard, label: "Transações", path: "/painel/admin/transacoes" },
  { icon: Brain, label: "Prompts IA", path: "/painel/admin/ai-prompts" },
  { icon: Settings, label: "Configurações", path: "/painel/admin/settings" },
];

export const AdminSidebar = () => {
  const { open } = useSidebar();
  const location = useLocation();

  return (
    <Sidebar
      className={cn(
        "hidden lg:flex transition-all duration-300",
        open ? "w-64" : "w-16"
      )}
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = item.path === "/painel/admin" 
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      className={cn(
                        "transition-colors",
                        isActive && "bg-primary/10 text-primary font-medium hover:bg-primary/20"
                      )}
                    >
                      <NavLink
                        to={item.path}
                        end={item.path === "/painel/admin"}
                      >
                        <item.icon className="h-5 w-5" />
                        {open && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
