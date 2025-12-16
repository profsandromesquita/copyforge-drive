import { useState, useRef, useEffect, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVertical, DotsThree, Trash, Copy as CopyIcon, Check, ArrowRight, Star, Heart, DownloadSimple, Play, ShoppingCart, Plus, ChatCircle, ClipboardText } from 'phosphor-react';
import { Sparkles, Info } from 'lucide-react';
import { Block } from '@/types/copy-editor';
import { CommentsButton } from './CommentsButton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TextDetailsModal } from './TextDetailsModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useCopyEditor } from '@/hooks/useCopyEditor';
import { useAuth } from '@/hooks/useAuth';
import { FormattingToolbar } from './FormattingToolbar';
import { FocusModeModal } from './FocusModeModal';
import { handlePaste } from '@/lib/paste-utils';
import { extractCleanText, copyToClipboard } from '@/lib/clipboard-utils';
import { toast } from 'sonner';

interface ContentBlockProps {
  block: Block;
  sessionId: string;
  onShowImageAI?: (blockId: string) => void;
}

export const ContentBlock = ({ block, sessionId, onShowImageAI }: ContentBlockProps) => {
  const { 
    updateBlock, 
    removeBlock, 
    duplicateBlock, 
    selectBlock, 
    selectedBlockId,
    isSelectionMode,
    selectedItems,
    toggleItemSelection
  } = useCopyEditor();
  const { user } = useAuth();
  const editableRef = useRef<HTMLDivElement>(null);
  const isEditingRef = useRef(false); // Protege estado local durante edição ativa
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [focusModeContent, setFocusModeContent] = useState('');
  const [focusModeKey, setFocusModeKey] = useState(0);
  const [showTextDetails, setShowTextDetails] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Helper functions para sanitizar conteúdo de lista (espelhando backend listSanitizer.ts)
  const stripHtmlTags = (text: string): string => text.replace(/<[^>]*>/g, '');
  
  const decodeHtmlEntities = (text: string): string => {
    return text
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&apos;/gi, "'")
      .replace(/&#x27;/gi, "'")
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
  };
  
  const cleanMarkdownPrefixes = (text: string): string => {
    return text
      .replace(/^[\*\-\•\→\▸\▹\►\◆\◇\○\●]\s*/, '')
      .replace(/^\d+[\.\)\-]\s*/, '')
      .replace(/^\[[\sx✓✔]\]\s*/i, '')
      .replace(/^>\s*/, '')
      .trim();
  };
  
  const cleanListItem = (item: string): string => {
    let cleaned = item;
    cleaned = stripHtmlTags(cleaned);
    cleaned = decodeHtmlEntities(cleaned);
    cleaned = cleanMarkdownPrefixes(cleaned);
    return cleaned.trim();
  };
  
  const containsHtmlList = (text: string): boolean => /<(ul|ol|li)[^>]*>/i.test(text);
  
  const extractListItemsFromHtml = (html: string): string[] => {
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    const items: string[] = [];
    let match;
    while ((match = liRegex.exec(html)) !== null) {
      items.push(match[1]);
    }
    return items;
  };
  
  const sanitizeListContent = (content: unknown): string[] => {
    // Array: limpar cada item
    if (Array.isArray(content)) {
      const cleaned = content
        .map(item => typeof item === 'string' ? cleanListItem(item) : String(item))
        .filter(item => item.length > 0);
      return cleaned.length > 0 ? cleaned : [''];
    }
    
    // String: detectar formato e converter
    if (typeof content === 'string') {
      let lines: string[];
      
      // HTML de lista detectado
      if (containsHtmlList(content)) {
        const extracted = extractListItemsFromHtml(content);
        if (extracted.length > 0) {
          lines = extracted;
        } else {
          lines = stripHtmlTags(content).split('\n');
        }
      }
      // Quebras de linha
      else if (content.includes('\n')) {
        lines = content.split('\n');
      }
      // Item único
      else {
        const cleaned = cleanListItem(content);
        return cleaned.length > 0 ? [cleaned] : [''];
      }
      
      const cleaned = lines.map(cleanListItem).filter(item => item.length > 0);
      return cleaned.length > 0 ? cleaned : [''];
    }
    
    return content ? [String(content)] : [''];
  };

  // AUTO-CURA Frontend: Converter string para array se necessário
  const [listItems, setListItems] = useState<string[]>(() => {
    const items = sanitizeListContent(block.content);
    if (typeof block.content === 'string' && block.content.includes('\n')) {
      console.log(`🔧 Frontend AUTO-CURA: Lista convertida de string para ${items.length} itens`);
    }
    return items;
  });

  // Sincronizar listItems quando block.content mudar via props (ex: Substituir Seleção)
  useEffect(() => {
    if (block.type !== 'list') return;
    
    // ⚠️ Não sobrescrever enquanto usuário está editando (protege itens novos/vazios)
    if (isEditingRef.current) {
      console.log('🛡️ [ContentBlock] Sincronização bloqueada: edição ativa');
      return;
    }
    
    const newListItems = sanitizeListContent(block.content);
    
    // Só atualizar se realmente mudou para evitar loops
    if (JSON.stringify(newListItems) !== JSON.stringify(listItems)) {
      console.log('🔄 [ContentBlock] Sincronizando listItems:', newListItems.length, 'itens');
      setListItems(newListItems);
    }
  }, [block.content, block.type]);

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
  const isItemSelected = selectedItems.some(item => item.id === block.id);
  const isNewFromChat = block.config?.isNewFromChat === true;

  // Auto-remover destaque após 10 segundos
  useEffect(() => {
    if (isNewFromChat) {
      const timer = setTimeout(() => {
        updateBlock(block.id, { 
          config: { ...block.config, isNewFromChat: false } 
        });
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [block.id, isNewFromChat]);

  const handleBlockClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      e.stopPropagation();
      toggleItemSelection(block.id, 'block', sessionId);
    }
  };

  // Calculate word count for text blocks
  const wordCount = useMemo(() => {
    if (block.type === 'text' || block.type === 'headline' || block.type === 'subheadline') {
      const content = typeof block.content === 'string' ? block.content : '';
      const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      return textContent.length > 0 ? textContent.split(' ').length : 0;
    }
    return 0;
  }, [block.content, block.type]);

  const handleContentChange = (value: string | string[]) => {
    updateBlock(block.id, { content: value });
  };

  const handleEditableChange = () => {
    if (editableRef.current) {
      const content = editableRef.current.innerHTML;
      
      // Se o bloco foi criado pelo chat, remover o destaque ao editar
      if (block.config?.isNewFromChat) {
        updateBlock(block.id, { 
          content, 
          config: { ...block.config, isNewFromChat: false } 
        });
      } else {
        updateBlock(block.id, { content });
      }
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
    const refContent = editableRef.current?.innerHTML || '';
    const blockContent = typeof block.content === 'string' ? block.content : '';
    const contentToUse = refContent.trim() ? refContent : blockContent;
    
    console.log('[FocusMode] Opening with:', contentToUse.length, 'chars');
    
    setFocusModeContent(contentToUse);
    setFocusModeKey(prev => prev + 1); // Force complete remount
    setShowFocusMode(true);
  };

  const handleFocusModeSave = (content: string, config: typeof block.config) => {
    updateBlock(block.id, { content, config });
  };

  const handleListChange = (index: number, value: string) => {
    isEditingRef.current = true; // Bloquear sincronização
    
    const newItems = [...listItems];
    newItems[index] = value;
    setListItems(newItems);
    
    // Se o bloco foi criado pelo chat, remover o destaque ao editar
    if (block.config?.isNewFromChat) {
      updateBlock(block.id, { 
        content: newItems,
        config: { ...block.config, isNewFromChat: false }
      });
    } else {
      handleContentChange(newItems);
    }
    
    setTimeout(() => {
      isEditingRef.current = false;
    }, 150);
  };

  const addListItem = () => {
    isEditingRef.current = true; // Bloquear sincronização
    
    const newItems = [...listItems, ''];
    setListItems(newItems);
    handleContentChange(newItems);
    
    // Liberar após ciclo de render
    setTimeout(() => {
      isEditingRef.current = false;
    }, 150);
  };

  const removeListItem = (index: number) => {
    isEditingRef.current = true;
    
    const newItems = listItems.filter((_, i) => i !== index);
    setListItems(newItems);
    handleContentChange(newItems);
    
    setTimeout(() => {
      isEditingRef.current = false;
    }, 150);
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
              onPaste={handlePaste}
              className={`border-none focus:outline-none ${getFontSizeClass()} ${getTextAlignClass()} ${getFontWeightClass()}`}
              data-placeholder="Digite seu título..."
              suppressContentEditableWarning
            />
            <FocusModeModal
              key={`focus-${block.id}-${focusModeKey}`}
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
              onPaste={handlePaste}
              className={`border-none focus:outline-none ${getFontSizeClass()} ${getTextAlignClass()} ${getFontWeightClass()}`}
              data-placeholder="Digite seu subtítulo..."
              suppressContentEditableWarning
            />
            <FocusModeModal
              key={`focus-${block.id}-${focusModeKey}`}
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
              onPaste={handlePaste}
              className={`min-h-[24px] border-none focus:outline-none ${getFontSizeClass()} ${getTextAlignClass()}`}
              data-placeholder="Digite seu texto..."
              suppressContentEditableWarning
            />
            <FocusModeModal
              key={`focus-${block.id}-${focusModeKey}`}
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
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    addListItem();
                  }}
                >
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
            <div className={`${getImageSizeClass()} w-full mx-auto relative group`}>
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
              
              {/* Botão de gerar com IA */}
              {onShowImageAI && (
                <Button
                  onClick={() => onShowImageAI(block.id)}
                  size="icon"
                  className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-primary shadow-lg hover:bg-primary/90 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Gerar com IA"
                >
                  <Sparkles className="h-5 w-5" />
                </Button>
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

        const getVideoType = (url: string): 'youtube' | 'vimeo' | 'direct' | null => {
          if (!url) return null;
          
          // YouTube
          const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
          if (youtubeRegex.test(url)) return 'youtube';
          
          // Vimeo
          const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/;
          if (vimeoRegex.test(url)) return 'vimeo';
          
          // Vídeo direto (Supabase Storage, URLs diretas de arquivo)
          // Detecta URLs que terminam em .mp4, .webm, .ogg, .mov
          // OU que contêm "supabase.co/storage"
          const directVideoRegex = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
          const supabaseStorageRegex = /supabase\.co\/storage/;
          if (directVideoRegex.test(url) || supabaseStorageRegex.test(url)) {
            return 'direct';
          }
          
          return null;
        };

        const getEmbedUrl = (url: string, type: 'youtube' | 'vimeo' | null) => {
          if (!url || !type) return null;
          
          if (type === 'youtube') {
            const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            return match ? `https://www.youtube.com/embed/${match[1]}` : null;
          }
          
          if (type === 'vimeo') {
            const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
            return match ? `https://player.vimeo.com/video/${match[1]}` : null;
          }
          
          return null;
        };

        const videoType = getVideoType(videoUrl);
        const embedUrl = videoType && videoType !== 'direct' ? getEmbedUrl(videoUrl, videoType) : null;

        return (
          <div className="space-y-2">
            <div className={`${getVideoSizeClass()} w-full mx-auto`}>
              {videoType === 'direct' ? (
                // Vídeo hospedado diretamente (Supabase Storage)
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
                  <video
                    src={videoUrl}
                    className="w-full h-full"
                    controls
                    controlsList="nodownload"
                    preload="metadata"
                  >
                    Seu navegador não suporta reprodução de vídeo.
                  </video>
                </div>
              ) : embedUrl ? (
                // YouTube / Vimeo
                <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                // Erro ou vazio
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

      case 'audio':
        const audioUrl = block.config?.audioUrl || '';
        const audioTitle = block.config?.audioTitle || '';
        const audioArtist = block.config?.audioArtist || '';
        const showControls = block.config?.showControls !== false;
        const showWaveform = block.config?.showWaveform !== false;

        return (
          <div className="space-y-3 max-w-2xl mx-auto">
            {(audioTitle || audioArtist) && (
              <div className="text-center space-y-1">
                {audioTitle && (
                  <h4 className="font-semibold text-lg">{audioTitle}</h4>
                )}
                {audioArtist && (
                  <p className="text-sm text-muted-foreground">{audioArtist}</p>
                )}
              </div>
            )}
            
            {showWaveform && audioUrl && (
              <div className="flex items-center gap-1 h-16 px-4 bg-muted rounded-lg">
                {[...Array(40)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary rounded-full transition-all"
                    style={{
                      height: `${Math.random() * 60 + 20}%`,
                      opacity: 0.7,
                    }}
                  />
                ))}
              </div>
            )}
            
            {audioUrl ? (
              <audio
                src={audioUrl}
                controls={showControls}
                className="w-full"
              />
            ) : (
              <div className="w-full h-12 bg-muted flex items-center justify-center rounded-lg">
                <span className="text-muted-foreground text-sm">
                  Adicione uma URL de áudio ou faça upload
                </span>
              </div>
            )}
          </div>
        );

      case 'faq':
        const faqTitle = block.config?.faqTitle || '';
        const showNumbering = block.config?.showNumbering !== false;
        const expandedByDefault = block.config?.expandedByDefault === true;
        const faqItems = block.config?.faqItems || [];
        const faqAlign = block.config?.textAlign || 'left';

        const getFaqAlignClass = () => {
          switch (faqAlign) {
            case 'center':
              return 'items-center text-center';
            case 'right':
              return 'items-end text-right';
            default:
              return 'items-start text-left';
          }
        };

        return (
          <div className={`space-y-4 max-w-3xl w-full flex flex-col ${getFaqAlignClass()}`}>
            {faqTitle && (
              <h3 className="text-xl font-bold">{faqTitle}</h3>
            )}
            
            {faqItems.length > 0 ? (
              <Accordion 
                type="single" 
                collapsible 
                className="w-full space-y-2"
                defaultValue={expandedByDefault ? faqItems[0]?.id : undefined}
              >
                {faqItems.map((item, index) => (
                  <AccordionItem 
                    key={item.id} 
                    value={item.id}
                    className="border rounded-lg px-4 bg-card"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <span className="font-medium text-left">
                        {showNumbering && (
                          <span className="text-primary mr-2">{index + 1}.</span>
                        )}
                        {item.question || 'Pergunta sem título'}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-muted-foreground">
                      {item.answer || 'Resposta vazia'}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="w-full p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                Adicione perguntas nas configurações do bloco
              </div>
            )}
          </div>
        );

      case 'testimonial':
        const testimonialTitle = block.config?.testimonialTitle || '';
        const showPhotos = block.config?.showPhotos !== false;
        const showRatings = block.config?.showRatings !== false;
        const testimonialItems = block.config?.testimonialItems || [];

        return (
          <div className="space-y-6 max-w-4xl w-full">
            {testimonialTitle && (
              <h3 className="text-2xl font-bold text-center">{testimonialTitle}</h3>
            )}
            
            {testimonialItems.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {testimonialItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="border rounded-lg p-6 bg-card space-y-4"
                  >
                    <div className="flex items-start gap-4">
                      {showPhotos && item.photo && (
                        <img 
                          src={item.photo} 
                          alt={item.name}
                          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg">{item.name || 'Nome do cliente'}</h4>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                        {showRatings && (
                          <div className="flex gap-1 mt-2">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i}
                                size={16}
                                weight={i < item.rating ? 'fill' : 'regular'}
                                className={i < item.rating ? 'text-yellow-500' : 'text-muted-foreground'}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-muted-foreground italic">
                      "{item.text || 'Texto do depoimento'}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                Adicione depoimentos nas configurações do bloco
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const handleAddComment = (text: string) => {
    const newComment = {
      id: crypto.randomUUID(),
      text,
      author: user?.user_metadata?.name || user?.email || 'Usuário',
      createdAt: new Date().toISOString(),
    };
    
    updateBlock(block.id, {
      comments: [...(block.comments || []), newComment],
    });
  };

  const handleUpdateComment = (commentId: string, text: string) => {
    updateBlock(block.id, {
      comments: (block.comments || []).map(c => 
        c.id === commentId ? { ...c, text } : c
      ),
    });
  };

  const handleDeleteComment = (commentId: string) => {
    updateBlock(block.id, {
      comments: (block.comments || []).filter(c => c.id !== commentId),
    });
  };

  const handleCopyContent = async () => {
    const content = Array.isArray(block.content) 
      ? block.content 
      : (editableRef.current?.innerHTML || block.content);
    
    const cleanText = extractCleanText(content, block.type);
    
    if (!cleanText) {
      toast.error('Nenhum conteúdo para copiar');
      return;
    }
    
    const success = await copyToClipboard(cleanText);
    
    if (success) {
      setIsCopied(true);
      toast.success('Copiado para a área de transferência!');
      setTimeout(() => setIsCopied(false), 2000);
    } else {
      toast.error('Falha ao copiar. Tente novamente.');
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative bg-background rounded-lg border transition-all group
        ${isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-default'}
        ${isSelected ? 'ring-2 ring-primary ring-offset-2' : 'border-border'}
        ${isSelectionMode ? 'cursor-pointer hover:ring-2 hover:ring-primary/50' : ''}
        ${isItemSelected ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : ''}
        ${isNewFromChat ? 'border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20' : ''}
      `}
      onClick={isSelectionMode ? handleBlockClick : () => selectBlock(block.id)}
    >
      {isNewFromChat && (
        <div className="absolute -top-2 -left-2 z-10 flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full shadow-sm animate-in fade-in slide-in-from-top-1">
          <Sparkles className="h-3 w-3" />
          <span className="font-medium">Novo</span>
        </div>
      )}
      {isItemSelected && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-blue-500 text-white rounded-full p-1">
            <Check className="h-3 w-3" />
          </div>
        </div>
      )}
      <div className="flex gap-2 p-4">
        <div
          {...(isSelectionMode ? {} : attributes)}
          {...(isSelectionMode ? {} : listeners)}
          className="cursor-grab active:cursor-grabbing p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <DotsSixVertical size={20} className="text-muted-foreground" />
        </div>

        <div className="flex-1">{renderContent()}</div>

        <div className="flex items-start gap-1">
            <CommentsButton 
              comments={block.comments}
              onAddComment={handleAddComment}
              onUpdateComment={handleUpdateComment}
              onDeleteComment={handleDeleteComment}
            />

            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleCopyContent}
              aria-label="Copiar conteúdo do bloco"
            >
              {isCopied ? (
                <Check size={20} className="text-green-500" />
              ) : (
                <ClipboardText size={20} />
              )}
            </Button>

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
            {(block.type === 'text' || block.type === 'headline' || block.type === 'subheadline') && (
              <DropdownMenuItem onClick={() => setShowTextDetails(true)}>
                <Info size={16} className="mr-2" />
                Detalhes
              </DropdownMenuItem>
            )}
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
            <DropdownMenuItem onClick={handleCopyContent}>
              <ClipboardText size={16} className="mr-2" />
              Copiar conteúdo
            </DropdownMenuItem>
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

      {/* Word Count Badge */}
      {isSelected && (block.type === 'text' || block.type === 'headline' || block.type === 'subheadline') && (
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground/60 font-mono animate-fade-in">
          {wordCount} {wordCount === 1 ? 'palavra' : 'palavras'}
        </div>
      )}

      {/* Text Details Modal */}
      {(block.type === 'text' || block.type === 'headline' || block.type === 'subheadline') && (
        <TextDetailsModal
          isOpen={showTextDetails}
          onClose={() => setShowTextDetails(false)}
          content={typeof block.content === 'string' ? block.content : ''}
        />
      )}
    </div>
  );
};
