import { User, SignOut, Gear, Plus, Buildings, Check, CaretRight, ChatCircleText } from "phosphor-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceCredits } from "@/hooks/useWorkspaceCredits";
import { useWorkspacePlan } from "@/hooks/useWorkspacePlan";
import { WorkspaceSettingsModal } from "@/components/workspace/WorkspaceSettingsModal";
import { CreateWorkspaceModal } from "@/components/workspace/CreateWorkspaceModal";
import { UserProfileModal } from "@/components/user-profile/UserProfileModal";
import { UpgradeModal } from "@/components/workspace/UpgradeModal";
import { FeedbackSheet } from "@/components/feedback/FeedbackSheet";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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

const WorkspaceItem = ({ workspace, isActive, onClick, disabled }: any) => {
  const { data: plan } = useWorkspacePlan(workspace.id);
  
  const getPlanVariant = (slug: string): "default" | "secondary" | "muted" => {
    if (slug === 'free') return 'secondary';
    return 'default'; // All paid plans use primary solid
  };

  return (
    <DropdownMenuItem
      className={`flex items-center justify-between px-2 py-2 rounded-md gap-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Buildings size={16} className="text-muted-foreground shrink-0" />
        <span className="text-sm truncate">{workspace.name}</span>
        {disabled && (
          <Badge variant="muted" className="text-[10px] px-1.5 py-0 h-4 font-medium">
            INATIVO
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {plan && !disabled && (
          <Badge 
            variant={getPlanVariant(plan.plan_slug)}
            className="text-[10px] px-1.5 py-0 h-4 font-medium"
          >
            {plan.plan_slug.toUpperCase()}
          </Badge>
        )}
        {isActive && !disabled && (
          <Check size={16} className="text-primary" weight="bold" />
        )}
      </div>
    </DropdownMenuItem>
  );
};

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();
  const { data: credits } = useWorkspaceCredits();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<string>("general");
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedInactiveWorkspaceId, setSelectedInactiveWorkspaceId] = useState<string | undefined>(undefined);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Use profile avatar only - no Google fallback to avoid flash
  const userName = profile?.name || user?.email?.split('@')[0] || 'Usuário';
  const userAvatarUrl = profile?.avatar_url;
  const workspaceAvatarUrl = activeWorkspace?.avatar_url;

  return (
    <>
      <WorkspaceSettingsModal 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen}
        defaultTab={settingsTab}
      />
      <CreateWorkspaceModal open={createWorkspaceOpen} onOpenChange={setCreateWorkspaceOpen} />
      <UserProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
      <UpgradeModal 
        open={upgradeModalOpen} 
        onOpenChange={setUpgradeModalOpen}
        limitType="general"
        workspaceId={selectedInactiveWorkspaceId}
      />
      <FeedbackSheet open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
          {profileLoading ? (
            <Skeleton className="h-8 w-8 rounded-full" />
          ) : (
            <Avatar className="h-8 w-8">
              <AvatarImage src={userAvatarUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="hidden md:flex flex-col items-start">
            <p className="font-medium text-sm text-foreground leading-none">
              {userName}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              {workspaceAvatarUrl && (
                <Avatar className="h-4 w-4">
                  <AvatarImage src={workspaceAvatarUrl} />
                  <AvatarFallback className="text-[8px] bg-muted">
                    {activeWorkspace?.name?.charAt(0) || 'W'}
                  </AvatarFallback>
                </Avatar>
              )}
              <p className="text-xs text-muted-foreground leading-none">
                {activeWorkspace?.name || 'Carregando...'}
              </p>
            </div>
          </div>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-72 bg-popover border-border p-2">
          {/* User Info Header */}
          <div className="flex items-center gap-3 px-2 py-3 mb-1">
            {profileLoading ? (
              <Skeleton className="h-10 w-10 rounded-full" />
            ) : (
              <Avatar className="h-10 w-10 ring-2 ring-border">
                <AvatarImage src={userAvatarUrl || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
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

          {/* Credits Section */}
          {credits && (
            <>
              <div className="px-2 py-3 bg-muted/30 rounded-lg mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">Créditos</span>
                  <button 
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                    onClick={() => {
                      setSettingsTab("billing");
                      setSettingsOpen(true);
                    }}
                  >
                    <span className="font-medium">{credits.balance.toFixed(1)} restantes</span>
                    <CaretRight size={14} className="group-hover:translate-x-0.5 transition-transform" weight="bold" />
                  </button>
                </div>
                <Progress 
                  value={(credits.balance / credits.total_added) * 100} 
                  className="h-1.5 mb-2"
                />
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">Usando créditos mensais</span>
                </div>
              </div>
              <DropdownMenuSeparator className="my-2" />
            </>
          )}
          
          {/* Workspaces Section */}
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-1.5">
            Workspaces
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            {workspaces.map((workspace) => (
              <WorkspaceItem
                key={workspace.id}
                workspace={workspace}
                isActive={activeWorkspace?.id === workspace.id}
                disabled={!workspace.is_active}
                onClick={() => {
                  if (!workspace.is_active) {
                    setSelectedInactiveWorkspaceId(workspace.id);
                    setUpgradeModalOpen(true);
                  } else {
                    setActiveWorkspace(workspace);
                  }
                }}
              />
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
              onClick={() => {
                setSettingsTab("general");
                setSettingsOpen(true);
              }}
            >
              <Gear size={16} className="text-muted-foreground" />
              <span className="text-sm">Configurações do Workspace</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-md"
              onClick={() => setFeedbackOpen(true)}
            >
              <ChatCircleText size={16} className="text-muted-foreground" />
              <span className="text-sm">Reportar Problema</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-2" />
          
          {/* Sign Out */}
          <DropdownMenuItem 
            className="cursor-pointer text-destructive flex items-center gap-2 px-2 py-2 rounded-md hover:bg-destructive/10"
            onClick={async (e) => {
              e.preventDefault();
              console.log('[UserMenu] Signing out...');
              await signOut();
            }}
          >
            <SignOut size={16} weight="bold" />
            <span className="text-sm font-medium">Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
