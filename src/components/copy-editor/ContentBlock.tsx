import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVertical, DotsThree, Trash, Copy as CopyIcon, Check, ArrowRight, Star, Heart, DownloadSimple, Play, ShoppingCart, Plus } from 'phosphor-react';
import { Sparkles } from 'lucide-react';
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
  onShowImageAI?: (blockId: string) => void;
}

export const ContentBlock = ({ block, sessionId, onShowImageAI }: ContentBlockProps) => {
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

  const getListAlignmentClass = () => {
    switch (block.config?.textAlign) {
      case 'center':
        return 'justify-center';
      case 'right':
        return 'justify-end';
      default:
        return 'justify-start';
    }
  };

  const getFontWeightClass = () => {
    switch (block.config?.fontWeight) {
      case 'normal':
        return 'font-normal';
      case 'semibold':
        return 'font-semibold';
      case 'extrabold':
        return 'font-extrabold';
      default:
        return block.type === 'headline' ? 'font-bold' : 'font-semibold';
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
              className={`border-none focus:outline-none ${getFontSizeClass()} ${getTextAlignClass()} ${getFontWeightClass()}`}
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
              className={`border-none focus:outline-none ${getFontSizeClass()} ${getTextAlignClass()} ${getFontWeightClass()}`}
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
        const getListIcon = () => {
          if (block.config?.showListIcons === false) return null;
          
          const iconColor = block.config?.listIconColor || '#ff6b35';
          const iconStyle = { color: iconColor };
          
          switch (block.config?.listStyle) {
            case 'numbers':
              return null; // Numbers will be handled differently
            case 'check':
              return <span style={iconStyle} className="mt-2 text-lg">✓</span>;
            case 'arrow':
              return <span style={iconStyle} className="mt-2 text-lg">→</span>;
            case 'star':
              return <span style={iconStyle} className="mt-2 text-lg">★</span>;
            case 'heart':
              return <span style={iconStyle} className="mt-2 text-lg">♥</span>;
            default:
              return <span style={iconStyle} className="mt-2">•</span>;
          }
        };

        return (
          <div className="space-y-2">
            {listItems.map((item, index) => (
              <div key={index} className={`flex gap-2 ${getListAlignmentClass()}`}>
                {block.config?.listStyle === 'numbers' && block.config?.showListIcons !== false ? (
                  <span 
                    style={{ color: block.config?.listIconColor || '#ff6b35' }}
                    className="mt-2 font-medium flex-shrink-0"
                  >
                    {index + 1}.
                  </span>
                ) : block.config?.showListIcons !== false && (
                  getListIcon()
                )}
                <Input
                  value={item}
                  onChange={(e) => handleListChange(index, e.target.value)}
                  placeholder="Item da lista..."
                  className={`border-none focus-visible:ring-0 ${isSelected ? 'max-w-md' : 'flex-1'}`}
                />
                {isSelected && listItems.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeListItem(index)}
                    className="flex-shrink-0"
                  >
                    <Trash size={16} />
                  </Button>
                )}
              </div>
            ))}
            {isSelected && (
              <div className={`flex ${getListAlignmentClass()}`}>
                <Button variant="outline" size="sm" onClick={addListItem}>
                  + Adicionar item
                </Button>
              </div>
            )}
          </div>
        );

      case 'button':
        const buttonContent = typeof block.content === 'string' ? block.content : '';
        const buttonBgColor = block.config?.backgroundColor || '#22c55e';
        const buttonTextColor = block.config?.textColor || '#ffffff';
        const buttonAlign = block.config?.textAlign || 'left';
        const buttonSubtitle = block.config?.buttonSubtitle;
        const buttonRounded = block.config?.buttonRounded !== false;
        const buttonIcon = block.config?.buttonIcon;
        
        const getButtonAlignClass = () => {
          switch (buttonAlign) {
            case 'center':
              return 'justify-center';
            case 'right':
              return 'justify-end';
            default:
              return 'justify-start';
          }
        };

        const getButtonSizeClass = () => {
          switch (block.config?.buttonSize) {
            case 'sm':
              return 'text-sm px-4 py-2';
            case 'lg':
              return 'text-lg px-8 py-4';
            default:
              return 'text-base px-6 py-3';
          }
        };

        const renderButtonIcon = () => {
          const iconSize = block.config?.buttonSize === 'sm' ? 16 : block.config?.buttonSize === 'lg' ? 24 : 20;
          switch (buttonIcon) {
            case 'check':
              return <Check size={iconSize} weight="bold" />;
            case 'arrow-right':
              return <ArrowRight size={iconSize} weight="bold" />;
            case 'star':
              return <Star size={iconSize} weight="fill" />;
            case 'heart':
              return <Heart size={iconSize} weight="fill" />;
            case 'download':
              return <DownloadSimple size={iconSize} weight="bold" />;
            case 'play':
              return <Play size={iconSize} weight="fill" />;
            case 'shopping-cart':
              return <ShoppingCart size={iconSize} weight="bold" />;
            case 'plus':
              return <Plus size={iconSize} weight="bold" />;
            default:
              return null;
          }
        };

        return (
          <div className={`flex ${getButtonAlignClass()}`}>
            <button 
              style={{
                backgroundColor: buttonBgColor,
                color: buttonTextColor,
              }}
              className={`
                ${getButtonSizeClass()}
                ${buttonRounded ? 'rounded-2xl' : 'rounded-none'}
                font-medium transition-all hover:opacity-90
                inline-flex flex-col items-center justify-center gap-1
              `}
              disabled
            >
              <span className="flex items-center gap-2">
                {renderButtonIcon()}
                <span>{buttonContent || 'Botão'}</span>
              </span>
              {buttonSubtitle && (
                <span className="text-xs opacity-80 font-normal">
                  {buttonSubtitle}
                </span>
              )}
            </button>
          </div>
        );

      case 'form':
        const formTitle = block.config?.formTitle;
        const formButtonText = block.config?.formButtonText || 'Enviar';
        const formButtonColor = block.config?.formButtonColor || '#22c55e';
        const formFields = block.config?.formFields || [];
        const formAlign = block.config?.textAlign || 'left';

        const getFormAlignClass = () => {
          switch (formAlign) {
            case 'center':
              return 'items-center';
            case 'right':
              return 'items-end';
            default:
              return 'items-start';
          }
        };

        return (
          <div className={`flex flex-col ${getFormAlignClass()} space-y-4 max-w-md w-full`}>
            {formTitle && formTitle.trim() && (
              <h3 className="text-lg font-semibold">{formTitle}</h3>
            )}
            <form className="w-full space-y-3" onSubmit={(e) => e.preventDefault()}>
              {formFields.map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-destructive">*</span>}
                  </label>
                  <Input
                    type={field.type}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full"
                    disabled
                  />
                </div>
              ))}
              {formFields.length > 0 && (
                <Button
                  type="submit"
                  className="w-full"
                  style={{ backgroundColor: formButtonColor }}
                  disabled
                >
                  {formButtonText}
                </Button>
              )}
            </form>
          </div>
        );

      case 'image':
        const imageUrl = block.config?.imageUrl || '';
        const imageDescription = block.config?.imageDescription || '';
        const aspectRatio = block.config?.aspectRatio || '16:9';
        const imageSize = block.config?.imageSize || 'md';
        const roundedBorders = block.config?.roundedBorders !== false;
        
        const getImageSizeClass = () => {
          switch (imageSize) {
            case 'sm':
              return 'max-w-xs';
            case 'lg':
              return 'max-w-4xl';
            default:
              return 'max-w-2xl';
          }
        };

        const getAspectRatioClass = () => {
          const ratios: Record<string, string> = {
            '2:1': 'aspect-[2/1]',
            '16:9': 'aspect-[16/9]',
            '3:2': 'aspect-[3/2]',
            '14:10': 'aspect-[14/10]',
            '4:3': 'aspect-[4/3]',
            '5:4': 'aspect-[5/4]',
            '1:1': 'aspect-square',
            '4:5': 'aspect-[4/5]',
            '3:4': 'aspect-[3/4]',
            '10:14': 'aspect-[10/14]',
            '2:3': 'aspect-[2/3]',
            '6:10': 'aspect-[6/10]',
            '9:16': 'aspect-[9/16]',
            '1:2': 'aspect-[1/2]',
          };
          return ratios[aspectRatio] || 'aspect-[16/9]';
        };

        return (
          <div className="space-y-2">
            <div className={`${getImageSizeClass()} w-full mx-auto`}>
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={imageDescription || 'Imagem'}
                  className={`w-full h-full object-cover ${getAspectRatioClass()} ${
                    roundedBorders ? 'rounded-lg' : ''
                  }`}
                />
              ) : (
                <div
                  className={`w-full ${getAspectRatioClass()} bg-muted flex items-center justify-center ${
                    roundedBorders ? 'rounded-lg' : ''
                  }`}
                >
                  <span className="text-muted-foreground">Sem imagem</span>
                </div>
              )}
            </div>
            {imageDescription && (
              <p className="text-sm text-muted-foreground text-center">{imageDescription}</p>
            )}
          </div>
        );

      case 'video':
        const videoUrl = block.config?.videoUrl || '';
        const videoTitle = block.config?.videoTitle || '';
        const videoSize = block.config?.videoSize || 'md';
        
        const getVideoSizeClass = () => {
          switch (videoSize) {
            case 'sm':
              return 'max-w-xs';
            case 'lg':
              return 'max-w-4xl';
            default:
              return 'max-w-2xl';
          }
        };

        const getEmbedUrl = (url: string) => {
          if (!url) return null;
          
          // YouTube
          const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
          const youtubeMatch = url.match(youtubeRegex);
          if (youtubeMatch) {
            return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
          }
          
          // Vimeo
          const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/;
          const vimeoMatch = url.match(vimeoRegex);
          if (vimeoMatch) {
            return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
          }
          
          // Se já for uma URL embed válida
          if (url.includes('youtube.com/embed/') || url.includes('player.vimeo.com/video/')) {
            return url;
          }
          
          return null;
        };

        const embedUrl = getEmbedUrl(videoUrl);

        return (
          <div className="space-y-2">
            <div className={`${getVideoSizeClass()} w-full mx-auto`}>
              {embedUrl ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="w-full aspect-video bg-muted flex items-center justify-center rounded-lg">
                  <span className="text-muted-foreground">
                    {videoUrl ? 'URL de vídeo inválida' : 'Adicione uma URL de vídeo'}
                  </span>
                </div>
              )}
            </div>
            {videoTitle && (
              <p className="text-sm text-muted-foreground text-center">{videoTitle}</p>
            )}
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
        group relative p-4 rounded-lg bg-card
        hover:border hover:border-primary transition-all
        ${isDragging ? 'opacity-50' : ''}
        ${isSelected ? 'border border-primary ring-2 ring-primary/20' : ''}
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
            {block.type === 'image' && (
              <>
                <DropdownMenuItem onClick={() => onShowImageAI?.(block.id)}>
                  <Sparkles size={16} className="mr-2" />
                  Gerar com IA
                </DropdownMenuItem>
                {block.config.imageUrl && (
                  <DropdownMenuItem onClick={() => {
                    const link = document.createElement('a');
                    link.href = block.config.imageUrl || '';
                    link.download = `imagem-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}>
                    <DownloadSimple size={16} className="mr-2" />
                    Baixar
                  </DropdownMenuItem>
                )}
              </>
            )}
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
