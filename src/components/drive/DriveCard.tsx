import { Folder, FileText, FunnelSimple, DotsThree } from "phosphor-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CardType = "folder" | "copy" | "funnel";

interface DriveCardProps {
  type: CardType;
  title: string;
  subtitle?: string;
  onClick?: () => void;
}

const iconMap = {
  folder: { icon: Folder, color: "text-primary" },
  copy: { icon: FileText, color: "text-foreground" },
  funnel: { icon: FunnelSimple, color: "text-foreground" },
};

const DriveCard = ({ type, title, subtitle, onClick }: DriveCardProps) => {
  const { icon: Icon, color } = iconMap[type];

  return (
    <div
      onClick={onClick}
      className="group bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`${color} group-hover:scale-110 transition-transform`}>
          <Icon size={32} weight="bold" />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger 
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-accent"
          >
            <DotsThree size={24} weight="bold" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem className="cursor-pointer">Abrir</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Renomear</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Mover</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-destructive">Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{title}</h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground line-clamp-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default DriveCard;
