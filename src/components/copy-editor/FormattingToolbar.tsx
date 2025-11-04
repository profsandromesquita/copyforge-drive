import { useState, useEffect } from 'react';
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
  Link as LinkIcon,
  Maximize,
  Palette,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const COLOR_PALETTE = [
  '#000000', '#2C3E50', '#34495E', '#7F8C8D',
  '#95A5A6', '#E74C3C', '#E67E22', '#F39C12',
  '#27AE60', '#3498DB', '#9B59B6', '#FFFFFF',
  '#F1C40F',
];

interface FormattingToolbarProps {
  onFormat: () => void;
  textAlign?: string;
  onAlignChange: (align: string) => void;
  fontSize?: string;
  onFontSizeChange: (size: string) => void;
}

export const FormattingToolbar = ({
  onFormat,
  textAlign = 'left',
  onAlignChange,
  fontSize = 'medium',
  onFontSizeChange,
}: FormattingToolbarProps) => {
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
    onFormat();
  };

  const handleLink = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      // Check if there's already a link
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

  return (
    <>
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
        <div className="bg-background border rounded-lg shadow-lg p-2 flex items-center gap-1">
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
            variant={textAlign === 'left' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onAlignChange('left')}
            className="h-8 w-8 p-0"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>

          <Button
            variant={textAlign === 'center' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onAlignChange('center')}
            className="h-8 w-8 p-0"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>

          <Button
            variant={textAlign === 'right' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onAlignChange('right')}
            className="h-8 w-8 p-0"
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <Button
            variant={textAlign === 'justify' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onAlignChange('justify')}
            className="h-8 w-8 p-0"
          >
            <AlignJustify className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Font Size */}
          <Select value={fontSize} onValueChange={onFontSizeChange}>
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

          {/* Fullscreen - placeholder */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {}}
            className="h-8 w-8 p-0"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://exemplo.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={insertLink}>Inserir Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
