import { ArrowLeft, TextAlignLeft, TextAlignCenter, TextAlignRight } from 'phosphor-react';
import { Block } from '@/types/copy-editor';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCopyEditor } from '@/hooks/useCopyEditor';

interface BlockSettingsProps {
  block: Block;
  onBack: () => void;
}

export const BlockSettings = ({ block, onBack }: BlockSettingsProps) => {
  const { updateBlock } = useCopyEditor();

  const updateConfig = (key: string, value: any) => {
    updateBlock(block.id, {
      config: { ...(block.config || {}), [key]: value },
    });
  };

  const updateContent = (content: string) => {
    updateBlock(block.id, { content });
  };

  const renderSettings = () => {
    switch (block.type) {
      case 'text':
        return (
          <>
            <div className="space-y-2">
              <Label>Tamanho da Fonte</Label>
              <Select
                value={block.config?.fontSize || '16px'}
                onValueChange={(value) => updateConfig('fontSize', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="14px">Pequeno</SelectItem>
                  <SelectItem value="16px">Médio</SelectItem>
                  <SelectItem value="18px">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Alinhamento</Label>
              <ToggleGroup 
                type="single" 
                value={block.config?.textAlign || 'left'}
                onValueChange={(value) => value && updateConfig('textAlign', value)}
                className="justify-start gap-2"
              >
                <ToggleGroupItem value="left" aria-label="Alinhar à esquerda" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <TextAlignLeft size={20} />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" aria-label="Alinhar ao centro" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <TextAlignCenter size={20} />
                </ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="Alinhar à direita" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <TextAlignRight size={20} />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </>
        );

      case 'headline':
      case 'subheadline':
        return (
          <>
            <div className="space-y-2">
              <Label>Peso da Fonte</Label>
              <Select
                value={block.config?.fontWeight || 'bold'}
                onValueChange={(value) => updateConfig('fontWeight', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="semibold">Semi-bold</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="extrabold">Extra Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Alinhamento</Label>
              <ToggleGroup 
                type="single" 
                value={block.config?.textAlign || 'left'}
                onValueChange={(value) => value && updateConfig('textAlign', value)}
                className="justify-start gap-2"
              >
                <ToggleGroupItem value="left" aria-label="Alinhar à esquerda" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <TextAlignLeft size={20} />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" aria-label="Alinhar ao centro" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <TextAlignCenter size={20} />
                </ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="Alinhar à direita" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <TextAlignRight size={20} />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </>
        );

      case 'list':
        return (
          <>
            <div className="space-y-2">
              <Label>Estilo da Lista</Label>
              <Select
                value={block.config?.listStyle || 'bullets'}
                onValueChange={(value) => updateConfig('listStyle', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="bullets">Bullets (•)</SelectItem>
                  <SelectItem value="numbers">Números (1, 2, 3)</SelectItem>
                  <SelectItem value="check">Check (✓)</SelectItem>
                  <SelectItem value="arrow">Seta (→)</SelectItem>
                  <SelectItem value="star">Estrela (★)</SelectItem>
                  <SelectItem value="heart">Coração (♥)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Alinhamento</Label>
              <ToggleGroup 
                type="single" 
                value={block.config?.textAlign || 'left'}
                onValueChange={(value) => value && updateConfig('textAlign', value)}
                className="justify-start gap-2"
              >
                <ToggleGroupItem value="left" aria-label="Alinhar à esquerda" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <TextAlignLeft size={20} />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" aria-label="Alinhar ao centro" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <TextAlignCenter size={20} />
                </ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="Alinhar à direita" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <TextAlignRight size={20} />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex items-center justify-between">
              <Label>Mostrar Ícones</Label>
              <Switch
                checked={block.config?.showListIcons !== false}
                onCheckedChange={(checked) => updateConfig('showListIcons', checked)}
              />
            </div>

            {block.config?.showListIcons !== false && (
              <div className="space-y-2">
                <Label>Cor do Ícone</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={block.config?.listIconColor || '#ff6b35'}
                    onChange={(e) => updateConfig('listIconColor', e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={block.config?.listIconColor || '#ff6b35'}
                    onChange={(e) => updateConfig('listIconColor', e.target.value)}
                    placeholder="#ff6b35"
                    className="flex-1"
                  />
                </div>
              </div>
            )}
          </>
        );

      case 'button':
        return (
          <>
            <div className="space-y-2">
              <Label>Texto do Botão</Label>
              <Input
                value={typeof block.content === 'string' ? block.content : ''}
                onChange={(e) => updateContent(e.target.value)}
                placeholder="Texto do botão..."
              />
            </div>

            <div className="space-y-2">
              <Label>Subtítulo (opcional)</Label>
              <Input
                value={block.config?.buttonSubtitle || ''}
                onChange={(e) => updateConfig('buttonSubtitle', e.target.value)}
                placeholder="Texto adicional..."
              />
            </div>

            <div className="space-y-2">
              <Label>Tamanho</Label>
              <Select
                value={block.config?.buttonSize || 'md'}
                onValueChange={(value) => updateConfig('buttonSize', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="sm">Pequeno</SelectItem>
                  <SelectItem value="md">Médio</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Alinhamento</Label>
              <ToggleGroup 
                type="single" 
                value={block.config?.textAlign || 'left'}
                onValueChange={(value) => value && updateConfig('textAlign', value)}
                className="justify-start gap-2"
              >
                <ToggleGroupItem value="left" aria-label="Alinhar à esquerda" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <TextAlignLeft size={20} />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" aria-label="Alinhar ao centro" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <TextAlignCenter size={20} />
                </ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="Alinhar à direita" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <TextAlignRight size={20} />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-2">
              <Label>Cor do Botão</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={block.config?.backgroundColor || '#ff6b35'}
                  onChange={(e) => updateConfig('backgroundColor', e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={block.config?.backgroundColor || '#ff6b35'}
                  onChange={(e) => updateConfig('backgroundColor', e.target.value)}
                  placeholder="#ff6b35"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cor do Texto</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={block.config?.textColor || '#ffffff'}
                  onChange={(e) => updateConfig('textColor', e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={block.config?.textColor || '#ffffff'}
                  onChange={(e) => updateConfig('textColor', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Bordas Arredondadas</Label>
              <Switch
                checked={block.config?.buttonRounded !== false}
                onCheckedChange={(checked) => updateConfig('buttonRounded', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label>Ícone (opcional)</Label>
              <Input
                value={block.config?.buttonIcon || ''}
                onChange={(e) => updateConfig('buttonIcon', e.target.value)}
                placeholder="Ex: ✓, →, ★"
              />
            </div>

            <div className="space-y-2">
              <Label>Link (URL)</Label>
              <Input
                value={block.config?.link || ''}
                onChange={(e) => updateConfig('link', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <h3 className="font-semibold">Configurações do Bloco</h3>
      </div>

      <div className="space-y-4">{renderSettings()}</div>
    </div>
  );
};
