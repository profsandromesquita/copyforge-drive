import { FileText, DotsThree, Trash, Pencil, Copy as CopyIcon } from "phosphor-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy } from '@/types/copy-editor';

interface TemplateCardProps {
  template: Copy;
  onUse: (templateId: string) => void;
  onEdit: (templateId: string) => void;
  onDuplicate: (templateId: string) => void;
  onDelete: (templateId: string) => void;
}

const TemplateCard = ({ template, onUse, onEdit, onDuplicate, onDelete }: TemplateCardProps) => {
  const handleDelete = () => {
    if (confirm(`Deseja realmente excluir o modelo "${template.title}"?`)) {
      onDelete(template.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const sessionsCount = template.sessions?.length || 0;
  const blocksCount = template.sessions?.reduce((acc, session) => acc + (session.blocks?.length || 0), 0) || 0;

  return (
    <div className="group relative bg-card border border-border/50 rounded-xl p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative space-y-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="text-primary shrink-0 transition-transform duration-300 group-hover:scale-110">
            <FileText size={32} weight="duotone" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
              {template.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{sessionsCount} sessões</span>
              <span>•</span>
              <span>{blocksCount} blocos</span>
            </div>
          </div>
          
          {/* Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger 
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-accent"
            >
              <DotsThree size={20} weight="bold" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border z-50">
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => onEdit(template.id)}
              >
                <Pencil size={16} className="mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => onDuplicate(template.id)}
              >
                <CopyIcon size={16} className="mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer text-destructive"
                onClick={handleDelete}
              >
                <Trash size={16} className="mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/30">
          <span className="text-xs text-muted-foreground">
            Criado em {formatDate(template.created_at)}
          </span>
          <button
            onClick={() => onUse(template.id)}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Usar Modelo →
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
