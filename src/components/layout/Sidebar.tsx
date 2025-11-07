import { FileText, Folder, Lightbulb, Sparkle, Plus, FolderPlus } from "phosphor-react";
import { NavLink } from "react-router-dom";
import copyDriveLogo from "@/assets/copydrive-logo.png";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectSelector } from "./ProjectSelector";

const menuItems = [
  { icon: Folder, label: "Drive", path: "/dashboard" },
  { icon: Sparkle, label: "Modelos", path: "/templates" },
  { icon: Lightbulb, label: "Descobrir", path: "/discover" },
];

interface SidebarProps {
  onCreateCopy?: () => void;
  onCreateFolder?: () => void;
}

const Sidebar = ({ onCreateCopy, onCreateFolder }: SidebarProps) => {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-background h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center justify-center">
          <img 
            src={copyDriveLogo} 
            alt="CopyDrive" 
            className="h-8"
          />
        </div>
      </div>

      {/* Project Selector */}
      <ProjectSelector />

      {/* Botão Novo */}
      <div className="px-4 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="lg" 
              className="w-full gap-2"
              disabled={!onCreateCopy && !onCreateFolder}
            >
              <Plus size={20} weight="bold" />
              <span>Novo</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-popover border-border z-50 w-56">
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={onCreateCopy}
            >
              <Plus size={18} className="mr-2" />
              Nova Copy
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={onCreateFolder}
            >
              <FolderPlus size={18} className="mr-2" />
              Nova Pasta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-full transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-foreground hover:bg-accent"
                  }`
                }
                style={({ isActive }) => 
                  isActive ? { backgroundColor: '#F8E9E7' } : undefined
                }
              >
                <item.icon size={24} weight="bold" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
