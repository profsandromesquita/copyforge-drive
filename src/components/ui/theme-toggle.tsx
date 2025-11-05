import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    // Salva a preferência do tema do editor
    localStorage.setItem('editor-theme', newTheme);
  };

  return (
    <DropdownMenuItem
      onClick={handleToggle}
      className="cursor-pointer"
    >
      {theme === "dark" ? (
        <>
          <Sun className="h-4 w-4 mr-2" />
          Modo Claro
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 mr-2" />
          Modo Escuro
        </>
      )}
    </DropdownMenuItem>
  );
}
