import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Pencil, Trash } from 'lucide-react';
import { Methodology } from '@/types/project-config';

interface MethodologyCardProps {
  methodology: Methodology;
  onEdit: (methodology: Methodology) => void;
  onDelete: (methodologyId: string) => void;
}

export const MethodologyCard = ({ 
  methodology, 
  onEdit, 
  onDelete
}: MethodologyCardProps) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Não abrir se clicar no menu
    if ((e.target as HTMLElement).closest('[data-menu-trigger]')) {
      return;
    }
    onEdit(methodology);
  };

  return (
    <div 
      className="relative bg-card border border-border rounded-lg p-6 hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group min-h-[120px] flex items-center justify-center"
      onClick={handleCardClick}
    >
      <h3 className="font-bold text-lg text-center">{methodology.name}</h3>
      
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" data-menu-trigger>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 hover:bg-muted"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical size={16} className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(methodology);
              }}
              className="cursor-pointer"
            >
              <Pencil size={14} className="mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(methodology.id);
              }}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash size={14} className="mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
