import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MagnifyingGlass, Funnel } from "phosphor-react";
import { useWorkspacesList } from "@/hooks/useAdminCopies";
import { Button } from "@/components/ui/button";
import { DateFilter, DateFilterType } from "@/components/filters/DateFilter";
import { useState } from "react";
import { startOfDay, endOfDay, subDays, startOfYear, endOfYear, subYears } from "date-fns";

interface CopyGenerationFiltersProps {
  filters: {
    search?: string;
    workspaceId?: string;
    category?: string;
    model?: string;
    startDate?: string;
    endDate?: string;
  };
  onFiltersChange: (filters: any) => void;
}

export const CopyGenerationFilters = ({ filters, onFiltersChange }: CopyGenerationFiltersProps) => {
  const { data: workspaces } = useWorkspacesList();
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilterType>(null);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>();

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleWorkspaceChange = (value: string) => {
    onFiltersChange({ ...filters, workspaceId: value === "all" ? undefined : value });
  };

  const handleCategoryChange = (value: string) => {
    onFiltersChange({ ...filters, category: value === "all" ? undefined : value });
  };

  const handleModelChange = (value: string) => {
    onFiltersChange({ ...filters, model: value === "all" ? undefined : value });
  };

  const handleDateFilterChange = (type: DateFilterType, range?: { from?: Date; to?: Date }) => {
    setSelectedDateFilter(type);
    
    if (!type) {
      const { startDate, endDate, ...rest } = filters;
      onFiltersChange(rest);
      return;
    }
    
    let from: Date | undefined;
    let to: Date | undefined;
    
    switch (type) {
      case 'today':
        from = startOfDay(new Date());
        to = endOfDay(new Date());
        break;
      case 'last7days':
        from = startOfDay(subDays(new Date(), 7));
        to = endOfDay(new Date());
        break;
      case 'last30days':
        from = startOfDay(subDays(new Date(), 30));
        to = endOfDay(new Date());
        break;
      case 'thisYear':
        from = startOfYear(new Date());
        to = endOfYear(new Date());
        break;
      case 'lastYear':
        from = startOfYear(subYears(new Date(), 1));
        to = endOfYear(subYears(new Date(), 1));
        break;
      case 'custom':
        if (range) {
          from = range.from;
          to = range.to;
          setDateRange(range);
        }
        break;
    }
    
    onFiltersChange({
      ...filters,
      startDate: from?.toISOString(),
      endDate: to?.toISOString(),
    });
  };

  const handleClearFilters = () => {
    setSelectedDateFilter(null);
    setDateRange(undefined);
    onFiltersChange({});
  };

  const hasActiveFilters = filters.search || filters.workspaceId || filters.category || filters.model || filters.startDate || filters.endDate;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Buscar por usuário ou prompt..."
            value={filters.search || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        {hasActiveFilters && (
          <Button variant="outline" onClick={handleClearFilters} size="sm">
            Limpar Filtros
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Funnel className="text-muted-foreground" size={20} />
        <div className="flex flex-wrap gap-3 flex-1">
          <DateFilter
            selectedDateFilter={selectedDateFilter}
            dateRange={dateRange}
            onDateFilterChange={handleDateFilterChange}
          />
          
          <Select value={filters.workspaceId || "all"} onValueChange={handleWorkspaceChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Workspace" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Workspaces</SelectItem>
              {workspaces?.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.category || "all"} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="text">Texto</SelectItem>
              <SelectItem value="image">Imagem</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.model || "all"} onValueChange={handleModelChange}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Modelo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Modelos</SelectItem>
              <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
              <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
              <SelectItem value="google/gemini-2.5-flash-image-preview">Gemini Image Preview</SelectItem>
              <SelectItem value="openai/gpt-5">GPT-5</SelectItem>
              <SelectItem value="openai/gpt-5-mini">GPT-5 Mini</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
