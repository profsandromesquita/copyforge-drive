import { cn } from "@/lib/utils";
import { User, Lock } from "phosphor-react";

interface ProfileSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: "geral", label: "Geral", icon: User },
  { id: "seguranca", label: "Segurança", icon: Lock },
];

export const ProfileSidebar = ({ activeTab, onTabChange }: ProfileSidebarProps) => {
  return (
    <aside className="w-64 border-r bg-background">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Meu Perfil</h2>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                activeTab === item.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};
