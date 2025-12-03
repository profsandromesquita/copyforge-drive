import { FunnelSimple } from "phosphor-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCopyTypeOptions, getCopyTypeLabel } from "@/lib/copy-types";

const COPY_TYPES = getCopyTypeOptions();

interface TypeFilterProps {
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
}

export const TypeFilter = ({ selectedType, onTypeChange }: TypeFilterProps) => {
  const selectedLabel = selectedType ? getCopyTypeLabel(selectedType) : null;

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
