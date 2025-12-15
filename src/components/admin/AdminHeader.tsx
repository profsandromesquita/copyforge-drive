import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import copydriveLogo from "@/assets/copydrive-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const AdminHeader = () => {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const navigate = useNavigate();
  
  // Use profile data - no Google fallback
  const userName = profile?.name || user?.email?.split('@')[0] || 'Usuário';
  const avatarUrl = profile?.avatar_url;
  
  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center justify-between flex-1">
      <div className="flex items-center gap-2">
        <img src={copydriveLogo} alt="CopyDrive" className="h-8" />
        <span className="text-sm text-muted-foreground">/ Admin</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="text-right">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            {profileLoading ? (
              <Skeleton className="h-9 w-9 rounded-full" />
            ) : (
              <Avatar className="h-9 w-9">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials(userName)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => navigate("/my-project")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Ir para Dashboard
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
