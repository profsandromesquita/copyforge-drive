import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVertical, DotsThree, Trash, Copy as CopyIcon } from 'phosphor-react';
import { Block } from '@/types/copy-editor';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCopyEditor } from '@/hooks/useCopyEditor';

interface ContentBlockProps {
  block: Block;
  sessionId: string;
}

export const ContentBlock = ({ block, sessionId }: ContentBlockProps) => {
  const { updateBlock, removeBlock, duplicateBlock, selectBlock, selectedBlockId } = useCopyEditor();
  const [listItems, setListItems] = useState<string[]>(
    Array.isArray(block.content) ? block.content : ['']
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    data: { block, sessionId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSelected = selectedBlockId === block.id;

  const handleContentChange = (value: string | string[]) => {
    updateBlock(block.id, { content: value });
  };

  const handleListChange = (index: number, value: string) => {
    const newItems = [...listItems];
    newItems[index] = value;
    setListItems(newItems);
    handleContentChange(newItems);
  };

  const addListItem = () => {
    const newItems = [...listItems, ''];
    setListItems(newItems);
    handleContentChange(newItems);
  };

  const removeListItem = (index: number) => {
    const newItems = listItems.filter((_, i) => i !== index);
    setListItems(newItems);
    handleContentChange(newItems);
  };

  const renderContent = () => {
    const content = typeof block.content === 'string' ? block.content : '';

    switch (block.type) {
      case 'headline':
        return (
          <Input
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Digite seu título..."
            className="text-2xl font-bold border-none focus-visible:ring-0"
          />
        );

      case 'subheadline':
        return (
          <Input
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Digite seu subtítulo..."
            className="text-xl font-semibold border-none focus-visible:ring-0"
          />
        );

      case 'text':
        return (
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Digite seu texto..."
            className="min-h-[100px] border-none focus-visible:ring-0 resize-none"
          />
        );

      case 'list':
        return (
          <div className="space-y-2">
            {listItems.map((item, index) => (
              <div key={index} className="flex gap-2">
                <span className="text-primary mt-2">•</span>
                <Input
                  value={item}
                  onChange={(e) => handleListChange(index, e.target.value)}
                  placeholder="Item da lista..."
                  className="border-none focus-visible:ring-0"
                />
                {listItems.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeListItem(index)}
                  >
                    <Trash size={16} />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addListItem}>
              + Adicionar item
            </Button>
          </div>
        );

      case 'button':
        return (
          <div className="space-y-3">
            <Input
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Texto do botão..."
              className="border-none focus-visible:ring-0"
            />
            <Button className="w-full">{content || 'Botão'}</Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative p-4 rounded-lg border bg-card
        hover:border-primary transition-all
        ${isDragging ? 'opacity-50' : ''}
        ${isSelected ? 'border-primary ring-2 ring-primary/20' : ''}
      `}
      onClick={() => selectBlock(block.id)}
    >
      <div className="flex gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <DotsSixVertical size={20} className="text-muted-foreground" />
        </div>

        <div className="flex-1">{renderContent()}</div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <DotsThree size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => duplicateBlock(block.id)}>
              <CopyIcon size={16} className="mr-2" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => removeBlock(block.id)}
              className="text-destructive"
            >
              <Trash size={16} className="mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
