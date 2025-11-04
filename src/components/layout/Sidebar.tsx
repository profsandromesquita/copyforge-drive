import { FileText, Folder, Lightbulb, Sparkle, User, SignOut, Gear, Plus } from "phosphor-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { WorkspaceSettingsModal } from "@/components/workspace/WorkspaceSettingsModal";
import { CreateWorkspaceModal } from "@/components/workspace/CreateWorkspaceModal";
import { ProjectSelector } from "./ProjectSelector";
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

const Sidebar = () => {
  const { user, signOut } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);

  return (
    <>
      <WorkspaceSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <CreateWorkspaceModal open={createWorkspaceOpen} onOpenChange={setCreateWorkspaceOpen} />
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-background h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <FileText size={24} weight="bold" className="text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">Copy Drive</span>
        </div>
      </div>

      {/* Project Selector */}
      <ProjectSelector />

      {/* Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent"
                  }`
                }
              >
                <item.icon size={24} weight="bold" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Menu */}
      <div className="p-4 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <User size={20} weight="bold" className="text-primary-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm text-foreground truncate">
                  {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {activeWorkspace?.name || 'Carregando...'}
                </p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
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
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
