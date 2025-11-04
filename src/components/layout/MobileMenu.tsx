import { Folder, Lightbulb, Sparkle, User } from "phosphor-react";
import { NavLink } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOut, Gear } from "phosphor-react";

const menuItems = [
  { icon: Folder, label: "Drive", path: "/dashboard" },
  { icon: Sparkle, label: "Modelos", path: "/templates" },
  { icon: Lightbulb, label: "Descobrir", path: "/discover" },
];

const MobileMenu = () => {
  return (
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
              <DropdownMenuItem className="cursor-pointer">
                <User size={18} className="mr-2" />
                Minha Conta
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                Alternar Workspace
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Gear size={18} className="mr-2" />
                Configurações do Workspace
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-destructive">
                <SignOut size={18} className="mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </li>
      </ul>
    </nav>
  );
};

export default MobileMenu;
