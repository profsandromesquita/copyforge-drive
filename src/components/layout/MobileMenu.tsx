import { Folder, Lightbulb, Sparkle, User, SignOut, Gear, Plus } from "phosphor-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { WorkspaceSettingsModal } from "@/components/workspace/WorkspaceSettingsModal";
import { CreateWorkspaceModal } from "@/components/workspace/CreateWorkspaceModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const menuItems = [
  { icon: Folder, label: "Drive", path: "/dashboard" },
  { icon: Sparkle, label: "Modelos", path: "/templates" },
  { icon: Lightbulb, label: "Descobrir", path: "/discover" },
];

const MobileMenu = () => {
  const { user, signOut } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);

  return (
    <>
      <WorkspaceSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <CreateWorkspaceModal open={createWorkspaceOpen} onOpenChange={setCreateWorkspaceOpen} />
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <ul className="flex items-center justify-around px-4 py-3">
        {menuItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                }`
              }
            >
              <item.icon size={24} weight="bold" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          </li>
        ))}
        
        {/* User Menu */}
        <li>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors text-muted-foreground">
              <User size={24} weight="bold" />
              <span className="text-xs font-medium">Conta</span>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover border-border mb-2">
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                className="cursor-pointer"
                onClick={() => setActiveWorkspace(workspace)}
              >
                {workspace.name}
                {activeWorkspace?.id === workspace.id && " ✓"}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem 
              className="cursor-pointer text-primary"
              onClick={() => setCreateWorkspaceOpen(true)}
            >
              <Plus size={18} className="mr-2" />
              Criar Workspace
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem className="cursor-pointer">
              <User size={18} className="mr-2" />
              Minha Conta
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => setSettingsOpen(true)}
            >
              <Gear size={18} className="mr-2" />
              Configurações do Workspace
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer text-destructive"
              onClick={signOut}
            >
              <SignOut size={18} className="mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
          </DropdownMenu>
        </li>
      </ul>
    </nav>
    </>
  );
};

export default MobileMenu;
