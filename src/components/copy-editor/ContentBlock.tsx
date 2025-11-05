import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVertical, DotsThree, Trash, Copy as CopyIcon } from 'phosphor-react';
import { Block } from '@/types/copy-editor';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCopyEditor } from '@/hooks/useCopyEditor';
import { FormattingToolbar } from './FormattingToolbar';
import { FocusModeModal } from './FocusModeModal';

interface ContentBlockProps {
  block: Block;
  sessionId: string;
}

export const ContentBlock = ({ block, sessionId }: ContentBlockProps) => {
  const { updateBlock, removeBlock, duplicateBlock, selectBlock, selectedBlockId } = useCopyEditor();
  const editableRef = useRef<HTMLDivElement>(null);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [focusModeContent, setFocusModeContent] = useState('');
  const [listItems, setListItems] = useState<string[]>(
    Array.isArray(block.content) ? block.content : ['']
  );

  // Load content into contentEditable div
  useEffect(() => {
    if (editableRef.current && typeof block.content === 'string') {
      if (editableRef.current.innerHTML !== block.content) {
        editableRef.current.innerHTML = block.content;
      }
    }
  }, [block.content, block.id]);

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

  const handleEditableChange = () => {
    if (editableRef.current) {
      const content = editableRef.current.innerHTML;
      updateBlock(block.id, { content });
    }
  };

  const handleAlignChange = (align: string) => {
    updateBlock(block.id, { config: { ...block.config, textAlign: align as 'left' | 'center' | 'right' } });
  };

  const handleFontSizeChange = (size: string) => {
    updateBlock(block.id, { config: { ...block.config, fontSize: size } });
  };

  const getFontSizeClass = () => {
    const fontSize = block.config?.fontSize || 'medium';
    
    switch (block.type) {
      case 'headline':
        switch (fontSize) {
          case 'small':
            return 'text-xl';
          case 'large':
            return 'text-3xl';
          default:
            return 'text-2xl';
        }
      case 'subheadline':
        switch (fontSize) {
          case 'small':
            return 'text-lg';
          case 'large':
            return 'text-2xl';
          default:
            return 'text-xl';
        }
      case 'text':
      default:
        switch (fontSize) {
          case 'small':
            return 'text-sm';
          case 'large':
            return 'text-lg';
          default:
            return 'text-base';
        }
    }
  };

  const getTextAlignClass = () => {
    switch (block.config?.textAlign) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      case 'justify':
        return 'text-justify';
      default:
        return 'text-left';
    }
  };

  const handleFocusModeOpen = () => {
    // Pegar o conteúdo atual do editableRef antes de abrir o modal
    const currentContent = editableRef.current?.innerHTML || (typeof block.content === 'string' ? block.content : '');
    setFocusModeContent(currentContent);
    setShowFocusMode(true);
  };

  const handleFocusModeSave = (content: string, config: typeof block.config) => {
    updateBlock(block.id, { content, config });
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
    const showToolbar = isSelected && ['headline', 'subheadline', 'text'].includes(block.type);

    switch (block.type) {
      case 'headline':
        return (
          <>
            {showToolbar && (
              <FormattingToolbar
                onFormat={handleEditableChange}
                textAlign={block.config?.textAlign}
                onAlignChange={handleAlignChange}
                fontSize={block.config?.fontSize}
                onFontSizeChange={handleFontSizeChange}
                onFocusMode={handleFocusModeOpen}
              />
            )}
            <div
              ref={editableRef}
              contentEditable
              onInput={handleEditableChange}
              onBlur={handleEditableChange}
              className={`font-bold border-none focus:outline-none ${getFontSizeClass()} ${getTextAlignClass()}`}
              data-placeholder="Digite seu título..."
              suppressContentEditableWarning
            />
            <FocusModeModal
              open={showFocusMode}
              onOpenChange={setShowFocusMode}
              content={focusModeContent}
              blockType={block.type}
              config={block.config}
              onSave={handleFocusModeSave}
            />
          </>
        );

      case 'subheadline':
        return (
          <>
            {showToolbar && (
              <FormattingToolbar
                onFormat={handleEditableChange}
                textAlign={block.config?.textAlign}
                onAlignChange={handleAlignChange}
                fontSize={block.config?.fontSize}
                onFontSizeChange={handleFontSizeChange}
                onFocusMode={handleFocusModeOpen}
              />
            )}
            <div
              ref={editableRef}
              contentEditable
              onInput={handleEditableChange}
              onBlur={handleEditableChange}
              className={`font-semibold border-none focus:outline-none ${getFontSizeClass()} ${getTextAlignClass()}`}
              data-placeholder="Digite seu subtítulo..."
              suppressContentEditableWarning
            />
            <FocusModeModal
              open={showFocusMode}
              onOpenChange={setShowFocusMode}
              content={focusModeContent}
              blockType={block.type}
              config={block.config}
              onSave={handleFocusModeSave}
            />
          </>
        );

      case 'text':
        return (
          <>
            {showToolbar && (
              <FormattingToolbar
                onFormat={handleEditableChange}
                textAlign={block.config?.textAlign}
                onAlignChange={handleAlignChange}
                fontSize={block.config?.fontSize}
                onFontSizeChange={handleFontSizeChange}
                onFocusMode={handleFocusModeOpen}
              />
            )}
            <div
              ref={editableRef}
              contentEditable
              onInput={handleEditableChange}
              onBlur={handleEditableChange}
              className={`min-h-[24px] border-none focus:outline-none ${getFontSizeClass()} ${getTextAlignClass()}`}
              data-placeholder="Digite seu texto..."
              suppressContentEditableWarning
            />
            <FocusModeModal
              open={showFocusMode}
              onOpenChange={setShowFocusMode}
              content={focusModeContent}
              blockType={block.type}
              config={block.config}
              onSave={handleFocusModeSave}
            />
          </>
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
