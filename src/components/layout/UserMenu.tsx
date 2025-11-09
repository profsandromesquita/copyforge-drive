import { User, SignOut, Gear, Plus, Buildings, Check } from "phosphor-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useWorkspace } from "@/hooks/useWorkspace";
import { WorkspaceSettingsModal } from "@/components/workspace/WorkspaceSettingsModal";
import { CreateWorkspaceModal } from "@/components/workspace/CreateWorkspaceModal";
import { UserProfileModal } from "@/components/user-profile/UserProfileModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const UserMenu = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const userName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  return (
    <>
      <WorkspaceSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <CreateWorkspaceModal open={createWorkspaceOpen} onOpenChange={setCreateWorkspaceOpen} />
      <UserProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
      
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
        
        <DropdownMenuContent align="end" className="w-72 bg-popover border-border p-2">
          {/* User Info Header */}
          <div className="flex items-center gap-3 px-2 py-3 mb-1">
            <Avatar className="h-10 w-10 ring-2 ring-border">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">
                {userName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <DropdownMenuSeparator className="my-2" />
          
          {/* Workspaces Section */}
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-1.5">
            Workspaces
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                className="cursor-pointer flex items-center justify-between px-2 py-2 rounded-md"
                onClick={() => setActiveWorkspace(workspace)}
              >
                <div className="flex items-center gap-2">
                  <Buildings size={16} className="text-muted-foreground" />
                  <span className="text-sm">{workspace.name}</span>
                </div>
                {activeWorkspace?.id === workspace.id && (
                  <Check size={16} className="text-primary" weight="bold" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem 
              className="cursor-pointer text-primary flex items-center gap-2 px-2 py-2 rounded-md mt-1"
              onClick={() => setCreateWorkspaceOpen(true)}
            >
              <Plus size={16} weight="bold" />
              <span className="text-sm font-medium">Criar Workspace</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-2" />
          
          {/* Account Section */}
          <DropdownMenuGroup>
            <DropdownMenuItem 
              className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-md"
              onClick={() => setProfileOpen(true)}
            >
              <User size={16} className="text-muted-foreground" />
              <span className="text-sm">Minha Conta</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-md"
              onClick={() => setSettingsOpen(true)}
            >
              <Gear size={16} className="text-muted-foreground" />
              <span className="text-sm">Configurações do Workspace</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-2" />
          
          {/* Sign Out */}
          <DropdownMenuItem 
            className="cursor-pointer text-destructive flex items-center gap-2 px-2 py-2 rounded-md hover:bg-destructive/10"
            onClick={signOut}
          >
            <SignOut size={16} weight="bold" />
            <span className="text-sm font-medium">Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
