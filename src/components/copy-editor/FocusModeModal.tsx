import { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BlockType, BlockConfig } from '@/types/copy-editor';
import { handlePaste } from '@/lib/paste-utils';

const COLOR_PALETTE = [
  '#000000', '#2C3E50', '#34495E', '#7F8C8D',
  '#95A5A6', '#E74C3C', '#E67E22', '#F39C12',
  '#27AE60', '#3498DB', '#9B59B6', '#FFFFFF',
  '#F1C40F',
];

interface FocusModeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  blockType: BlockType;
  config: BlockConfig;
  onSave: (content: string, config: BlockConfig) => void;
}

export const FocusModeModal = ({
  open,
  onOpenChange,
  content,
  blockType,
  config,
  onSave,
}: FocusModeModalProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [localConfig, setLocalConfig] = useState<BlockConfig>(config || {});
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  useEffect(() => {
    if (editorRef.current && open) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (editorRef.current) {
          const contentToLoad = content || '';
          editorRef.current.innerHTML = contentToLoad;
          
          if (!contentToLoad.trim()) {
            editorRef.current.classList.add('empty');
          } else {
            editorRef.current.classList.remove('empty');
          }
          
          editorRef.current.focus();
        }
      });
    }
  }, [content, open]);

  useEffect(() => {
    setLocalConfig(config || {});
  }, [config]);

  useEffect(() => {
    const updateFormats = () => {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
      });
    };

    document.addEventListener('selectionchange', updateFormats);
    return () => document.removeEventListener('selectionchange', updateFormats);
  }, []);

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const handleSave = () => {
    if (editorRef.current) {
      onSave(editorRef.current.innerHTML, localConfig);
    }
    onOpenChange(false);
  };

  const handleAlignChange = (align: string) => {
    setLocalConfig({ ...localConfig, textAlign: align as 'left' | 'center' | 'right' | 'justify' });
  };

  const handleFontSizeChange = (size: string) => {
    setLocalConfig({ ...localConfig, fontSize: size });
  };

  const handleLink = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      const parentElement = selection.anchorNode?.parentElement;
      if (parentElement?.tagName === 'A') {
        setLinkUrl((parentElement as HTMLAnchorElement).href);
      }
      setShowLinkDialog(true);
    }
  };

  const insertLink = () => {
    if (linkUrl) {
      applyFormat('createLink', linkUrl);
      setShowLinkDialog(false);
      setLinkUrl('');
    }
  };

  const applyColor = (color: string) => {
    applyFormat('foreColor', color);
    setCurrentColor(color);
    setShowColorPicker(false);
  };

  const getFontSizeClass = () => {
    switch (localConfig?.fontSize) {
      case 'small':
        return 'text-sm';
      case 'large':
        return 'text-2xl';
      default:
        return 'text-xl';
    }
  };

  const getTextAlignClass = () => {
    switch (localConfig?.textAlign) {
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

  const getPlaceholder = () => {
    switch (blockType) {
      case 'headline':
        return 'Digite seu título...';
      case 'subheadline':
        return 'Digite seu subtítulo...';
      case 'text':
        return 'Digite seu texto...';
      default:
        return 'Digite seu conteúdo...';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-full w-screen h-screen p-0 gap-0">
          {/* Toolbar */}
          <div className="sticky top-0 z-50 bg-background border-b">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="bg-background border rounded-lg shadow-sm p-2 flex items-center gap-1">
                  {/* Text Formatting */}
                  <Button
                    variant={activeFormats.bold ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => applyFormat('bold')}
                    className="h-8 w-8 p-0"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>

                  <Button
                    variant={activeFormats.italic ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => applyFormat('italic')}
                    className="h-8 w-8 p-0"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>

                  <Button
                    variant={activeFormats.underline ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => applyFormat('underline')}
                    className="h-8 w-8 p-0"
                  >
                    <Underline className="h-4 w-4" />
                  </Button>

                  <Separator orientation="vertical" className="h-6" />

                  {/* Alignment */}
                  <Button
                    variant={localConfig.textAlign === 'left' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => handleAlignChange('left')}
                    className="h-8 w-8 p-0"
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>

                  <Button
                    variant={localConfig.textAlign === 'center' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => handleAlignChange('center')}
                    className="h-8 w-8 p-0"
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>

                  <Button
                    variant={localConfig.textAlign === 'right' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => handleAlignChange('right')}
                    className="h-8 w-8 p-0"
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>

                  <Button
                    variant={localConfig.textAlign === 'justify' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => handleAlignChange('justify')}
                    className="h-8 w-8 p-0"
                  >
                    <AlignJustify className="h-4 w-4" />
                  </Button>

                  <Separator orientation="vertical" className="h-6" />

                  {/* Font Size */}
                  <Select value={localConfig.fontSize || 'medium'} onValueChange={handleFontSizeChange}>
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Pequeno</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="large">Grande</SelectItem>
                    </SelectContent>
                  </Select>

                  <Separator orientation="vertical" className="h-6" />

                  {/* Color Picker */}
                  <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 relative"
                      >
                        <Palette className="h-4 w-4" />
                        <div 
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full"
                          style={{ backgroundColor: currentColor }}
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" align="start">
                      <div className="space-y-3">
                        <div className="text-sm font-medium">Cor do texto</div>
                        <div className="grid grid-cols-4 gap-2">
                          {COLOR_PALETTE.map((color) => (
                            <button
                              key={color}
                              onClick={() => applyColor(color)}
                              className={`w-10 h-10 rounded-md border-2 transition-all hover:scale-110 ${
                                currentColor === color ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                              }`}
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Input
                            value={currentColor}
                            onChange={(e) => setCurrentColor(e.target.value)}
                            placeholder="#000000"
                            className="h-8 text-xs font-mono"
                          />
                          <Button
                            size="sm"
                            onClick={() => applyColor(currentColor)}
                            className="h-8"
                          >
                            Aplicar
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Separator orientation="vertical" className="h-6" />

                  {/* Link */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLink}
                    className="h-8 w-8 p-0"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={handleSave}>
                  Salvar e Fechar
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 overflow-y-auto bg-muted/10">
            <div className="max-w-4xl mx-auto px-8 py-16">
              <div
                ref={editorRef}
                contentEditable
                onPaste={handlePaste}
                className={`
                  min-h-[60vh] focus:outline-none 
                  ${getFontSizeClass()} ${getTextAlignClass()} 
                  ${blockType === 'headline' ? 'font-bold' : blockType === 'subheadline' ? 'font-semibold' : ''}
                  empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:opacity-50
                `}
                data-placeholder={getPlaceholder()}
                suppressContentEditableWarning
                onInput={(e) => {
                  const target = e.currentTarget;
                  if (target.textContent?.trim()) {
                    target.classList.remove('empty');
                  } else {
                    target.classList.add('empty');
                  }
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="focus-link-url">URL</Label>
              <Input
                id="focus-link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://exemplo.com"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={insertLink}>Inserir Link</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
