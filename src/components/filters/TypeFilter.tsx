import { FunnelSimple } from "phosphor-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const COPY_TYPES = [
  { value: 'landing_page', label: 'Landing Page' },
  { value: 'anuncio', label: 'Anúncio' },
  { value: 'vsl', label: 'Video de Vendas' },
  { value: 'email', label: 'E-mail' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'conteudo', label: 'Conteúdo' },
  { value: 'mensagem', label: 'Mensagem' },
  { value: 'outro', label: 'Outro' },
];

interface TypeFilterProps {
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
}

export const TypeFilter = ({ selectedType, onTypeChange }: TypeFilterProps) => {
  const selectedLabel = COPY_TYPES.find(t => t.value === selectedType)?.label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 bg-background">
          <FunnelSimple size={16} weight="bold" />
          Tipo
          {selectedType && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {selectedLabel}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 bg-background">
        <DropdownMenuItem
          onClick={() => onTypeChange(null)}
          className={!selectedType ? 'bg-accent' : ''}
        >
          Todos os tipos
        </DropdownMenuItem>
        {COPY_TYPES.map((type) => (
          <DropdownMenuItem
            key={type.value}
            onClick={() => onTypeChange(type.value)}
            className={selectedType === type.value ? 'bg-accent' : ''}
          >
            {type.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
