import { NavLink } from "react-router-dom";
import { 
  ChartBar, 
  Users, 
  FolderOpen, 
  FileText, 
  Gear 
} from "phosphor-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: ChartBar, label: "Dashboard", path: "/painel/admin" },
  { icon: Users, label: "Clientes", path: "/painel/admin/clientes" },
  { icon: FolderOpen, label: "Workspaces", path: "/painel/admin/workspaces" },
  { icon: FileText, label: "Copy IA", path: "/painel/admin/copies" },
  { icon: Gear, label: "Configurações", path: "/painel/admin/settings" },
];

export const AdminSidebar = () => {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <NavLink
                      to={item.path}
                      end={item.path === "/painel/admin"}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )
                      }
                    >
                      <item.icon size={open ? 20 : 24} weight={open ? "regular" : "fill"} />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
