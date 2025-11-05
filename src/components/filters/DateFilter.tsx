import { Calendar as CalendarIcon, CalendarBlank } from "phosphor-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type DateFilterType = 'today' | 'last7days' | 'last30days' | 'thisYear' | 'lastYear' | 'custom' | null;

interface DateRange {
  from?: Date;
  to?: Date;
}

interface DateFilterProps {
  selectedDateFilter: DateFilterType;
  dateRange?: DateRange;
  onDateFilterChange: (type: DateFilterType, range?: DateRange) => void;
}

export const DateFilter = ({ selectedDateFilter, dateRange, onDateFilterChange }: DateFilterProps) => {
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState<Date | undefined>(dateRange?.from);
  const [customTo, setCustomTo] = useState<Date | undefined>(dateRange?.to);

  const getLabel = () => {
    switch (selectedDateFilter) {
      case 'today': return 'Hoje';
      case 'last7days': return 'Últimos 7 dias';
      case 'last30days': return 'Últimos 30 dias';
      case 'thisYear': return 'Este Ano';
      case 'lastYear': return 'Ano passado';
      case 'custom': return 'Personalizado';
      default: return null;
    }
  };

  const handleSelect = (type: DateFilterType) => {
    if (type === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onDateFilterChange(type);
    }
  };

  const handleCustomApply = () => {
    if (customFrom || customTo) {
      onDateFilterChange('custom', { from: customFrom, to: customTo });
    }
  };

  const label = getLabel();

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2 bg-background">
            <CalendarBlank size={16} weight="bold" />
            Modificado
            {label && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {label}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 bg-background">
          <DropdownMenuItem
            onClick={() => onDateFilterChange(null)}
            className={!selectedDateFilter ? 'bg-accent' : ''}
          >
            Todos os períodos
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleSelect('today')}
            className={selectedDateFilter === 'today' ? 'bg-accent' : ''}
          >
            Hoje
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleSelect('last7days')}
            className={selectedDateFilter === 'last7days' ? 'bg-accent' : ''}
          >
            Últimos 7 dias
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleSelect('last30days')}
            className={selectedDateFilter === 'last30days' ? 'bg-accent' : ''}
          >
            Últimos 30 dias
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleSelect('thisYear')}
            className={selectedDateFilter === 'thisYear' ? 'bg-accent' : ''}
          >
            Este Ano
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleSelect('lastYear')}
            className={selectedDateFilter === 'lastYear' ? 'bg-accent' : ''}
          >
            Ano passado
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleSelect('custom')}
            className={selectedDateFilter === 'custom' ? 'bg-accent' : ''}
          >
            Período Personalizado
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showCustom && (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-background">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Depois de:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 justify-start text-left font-normal",
                    !customFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customFrom ? format(customFrom, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background" align="start">
                <Calendar
                  mode="single"
                  selected={customFrom}
                  onSelect={setCustomFrom}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Antes de:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 justify-start text-left font-normal",
                    !customTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customTo ? format(customTo, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background" align="start">
                <Calendar
                  mode="single"
                  selected={customTo}
                  onSelect={setCustomTo}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button size="sm" onClick={handleCustomApply} className="h-9">
            Aplicar
          </Button>
        </div>
      )}
    </div>
  );
};
