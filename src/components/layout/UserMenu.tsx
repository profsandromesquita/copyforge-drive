import { User, SignOut, Gear, Plus } from "phosphor-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const UserMenu = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);

  const userName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  return (
    <>
      <WorkspaceSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <CreateWorkspaceModal open={createWorkspaceOpen} onOpenChange={setCreateWorkspaceOpen} />
      
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <p className="font-medium text-sm text-foreground leading-none">
              {userName}
            </p>
            <p className="text-xs text-muted-foreground leading-none mt-1">
              {activeWorkspace?.name || 'Carregando...'}
            </p>
          </div>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64 bg-popover border-border">
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
          
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={() => navigate('/profile')}
          >
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
    </>
  );
};
