import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import copydriveLogo from "@/assets/copydrive-logo.png";

export const AdminHeader = () => {
  const { user } = useAuth();
  
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
    <header className="bg-background px-6 py-4 sticky top-0 z-40 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={copydriveLogo} alt="CopyDrive" className="h-8" />
          <span className="text-sm text-muted-foreground">/ Admin</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium">
              {user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuário"}
            </p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getUserInitials(user?.user_metadata?.name || user?.email)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};
