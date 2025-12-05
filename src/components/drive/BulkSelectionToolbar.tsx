import { Trash, X, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BulkSelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDelete: () => void;
  onExitSelectionMode: () => void;
  isDeleting?: boolean;
}

export const BulkSelectionToolbar = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onDelete,
  onExitSelectionMode,
  isDeleting = false,
}: BulkSelectionToolbarProps) => {
  const allSelected = selectedCount === totalCount && totalCount > 0;
  
  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-background/95 backdrop-blur-md border border-border shadow-2xl rounded-full px-4 py-2 flex items-center gap-3">
        {/* Contador */}
        <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
          {selectedCount} de {totalCount}
        </Badge>
        
        {/* Selecionar Todos / Limpar */}
        <Button
          variant="ghost"
          size="sm"
          onClick={allSelected ? onClearSelection : onSelectAll}
          className="text-sm"
        >
          {allSelected ? (
            <>
              <Square className="h-4 w-4 mr-2" />
              Limpar
            </>
          ) : (
            <>
              <CheckSquare className="h-4 w-4 mr-2" />
              Todos
            </>
          )}
        </Button>
        
        {/* Botão Excluir */}
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={selectedCount === 0 || isDeleting}
          className="text-sm"
        >
          <Trash className="h-4 w-4 mr-2" />
          {isDeleting ? 'Excluindo...' : `Excluir (${selectedCount})`}
        </Button>
        
        {/* Botão Sair do Modo */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onExitSelectionMode}
          className="rounded-full h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
