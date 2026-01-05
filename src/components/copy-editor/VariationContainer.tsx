import React, { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CaretDown, CaretRight, DotsThree, Plus, Copy as CopyIcon, Trash, PencilSimple } from 'phosphor-react';
import { Variation } from '@/types/copy-editor';
import { SessionBlock } from './SessionBlock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface VariationContainerProps {
  variation: Variation;
  isActive: boolean;
  onActivate: () => void;
  onToggleCollapse: () => void;
  onRename: (name: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddSession: () => void;
  onShowImageAI?: (blockId: string) => void;
  canDelete: boolean;
}

export const VariationContainer = ({
  variation,
  isActive,
  onActivate,
  onToggleCollapse,
  onRename,
  onDuplicate,
  onDelete,
  onAddSession,
  onShowImageAI,
  canDelete,
}: VariationContainerProps) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [localName, setLocalName] = useState(variation.name);

  const handleNameSubmit = () => {
    if (localName.trim() && localName !== variation.name) {
      onRename(localName.trim());
    } else {
      setLocalName(variation.name);
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setLocalName(variation.name);
      setIsEditingName(false);
    }
  };

  const startEditing = () => {
    setLocalName(variation.name);
    setIsEditingName(true);
  };

  return (
    <Collapsible open={!variation.isCollapsed}>
      <div
        onClick={onActivate}
        className={cn(
          'border-2 border-dashed rounded-xl mb-6 transition-all',
          isActive
            ? 'border-primary/50 bg-primary/5'
            : 'border-muted-foreground/20 bg-muted/5 hover:border-muted-foreground/40'
        )}
      >
        {/* Header da Variação */}
        <div className="flex items-center justify-between p-4 border-b border-dashed border-muted-foreground/20">
          {/* Lado esquerdo: Toggle + Nome editável */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse();
              }}
            >
              {variation.isCollapsed ? (
                <CaretRight size={18} className="text-muted-foreground" />
              ) : (
                <CaretDown size={18} className="text-muted-foreground" />
              )}
            </Button>

            {isEditingName ? (
              <Input
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={handleKeyDown}
                className="max-w-[200px] h-8"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing();
                }}
                className="flex items-center gap-2 group/name"
              >
                <h3 className="font-semibold text-lg text-foreground group-hover/name:text-primary transition-colors">
                  {variation.name}
                </h3>
                <PencilSimple
                  size={14}
                  className="text-muted-foreground opacity-0 group-hover/name:opacity-100 transition-opacity"
                />
              </button>
            )}

            <span className="text-sm text-muted-foreground">
              ({variation.sessions.length} {variation.sessions.length === 1 ? 'seção' : 'seções'})
            </span>
          </div>

          {/* Lado direito: Ações */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddSession}
              className="text-muted-foreground hover:text-foreground"
            >
              <Plus size={16} className="mr-1" />
              Seção
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <DotsThree size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={startEditing}>
                  <PencilSimple size={16} className="mr-2" />
                  Renomear
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <CopyIcon size={16} className="mr-2" />
                  Duplicar Variação
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  disabled={!canDelete}
                  className={cn(canDelete && 'text-destructive focus:text-destructive')}
                >
                  <Trash size={16} className="mr-2" />
                  Excluir Variação
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Conteúdo colapsável */}
        <CollapsibleContent className="p-4 space-y-4">
          {variation.sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-3">Esta variação está vazia</p>
              <Button variant="outline" size="sm" onClick={onAddSession}>
                <Plus size={16} className="mr-2" />
                Adicionar Seção
              </Button>
            </div>
          ) : (
            <SortableContext
              items={variation.sessions.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {variation.sessions.map((session, index) => (
                <SessionBlock
                  key={session.id}
                  session={session}
                  sessionIndex={index}
                  totalSessions={variation.sessions.length}
                  onShowImageAI={onShowImageAI}
                />
              ))}
            </SortableContext>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
