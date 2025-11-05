import { ArrowLeft, TextAlignLeft, TextAlignCenter, TextAlignRight, Check, ArrowRight, Star, Heart, DownloadSimple, Play, ShoppingCart, Plus, Trash } from 'phosphor-react';
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
                  value={block.config?.backgroundColor || '#22c55e'}
                  onChange={(e) => updateConfig('backgroundColor', e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={block.config?.backgroundColor || '#22c55e'}
                  onChange={(e) => updateConfig('backgroundColor', e.target.value)}
                  placeholder="#22c55e"
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
              <Label>Ícone</Label>
              <Select
                value={block.config?.buttonIcon || 'none'}
                onValueChange={(value) => updateConfig('buttonIcon', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ícone" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="none">
                    <span>Sem ícone</span>
                  </SelectItem>
                  <SelectItem value="check">
                    <div className="flex items-center gap-2">
                      <Check size={16} />
                      <span>Check</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="arrow-right">
                    <div className="flex items-center gap-2">
                      <ArrowRight size={16} />
                      <span>Seta Direita</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="star">
                    <div className="flex items-center gap-2">
                      <Star size={16} />
                      <span>Estrela</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="heart">
                    <div className="flex items-center gap-2">
                      <Heart size={16} />
                      <span>Coração</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="download">
                    <div className="flex items-center gap-2">
                      <DownloadSimple size={16} />
                      <span>Download</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="play">
                    <div className="flex items-center gap-2">
                      <Play size={16} />
                      <span>Play</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="shopping-cart">
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={16} />
                      <span>Carrinho</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="plus">
                    <div className="flex items-center gap-2">
                      <Plus size={16} />
                      <span>Mais</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
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

      case 'form':
        return (
          <>
            <div className="space-y-2">
              <Label>Título do Formulário</Label>
              <Input
                value={block.config?.formTitle || ''}
                onChange={(e) => updateConfig('formTitle', e.target.value)}
                placeholder="Digite o título..."
              />
            </div>

            <div className="space-y-2">
              <Label>Texto do Botão</Label>
              <Input
                value={block.config?.formButtonText || 'Enviar'}
                onChange={(e) => updateConfig('formButtonText', e.target.value)}
                placeholder="Enviar"
              />
            </div>

            <div className="space-y-2">
              <Label>Cor do Botão</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={block.config?.formButtonColor || '#22c55e'}
                  onChange={(e) => updateConfig('formButtonColor', e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={block.config?.formButtonColor || '#22c55e'}
                  onChange={(e) => updateConfig('formButtonColor', e.target.value)}
                  placeholder="#22c55e"
                  className="flex-1"
                />
              </div>
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

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label>Campos do Formulário</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentFields = block.config?.formFields || [];
                    updateConfig('formFields', [
                      ...currentFields,
                      {
                        id: `field-${Date.now()}`,
                        type: 'text' as const,
                        label: '',
                        placeholder: '',
                        required: false,
                      },
                    ]);
                  }}
                >
                  + Adicionar Campo
                </Button>
              </div>

              {(block.config?.formFields || []).map((field, index) => (
                <div key={field.id} className="p-3 border rounded-lg space-y-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Campo {index + 1}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const currentFields = block.config?.formFields || [];
                        updateConfig(
                          'formFields',
                          currentFields.filter((_, i) => i !== index)
                        );
                      }}
                    >
                      <Trash size={14} />
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => {
                        const currentFields = [...(block.config?.formFields || [])];
                        currentFields[index] = { ...field, label: e.target.value };
                        updateConfig('formFields', currentFields);
                      }}
                      placeholder="Nome do campo"
                      className="h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Placeholder</Label>
                    <Input
                      value={field.placeholder}
                      onChange={(e) => {
                        const currentFields = [...(block.config?.formFields || [])];
                        currentFields[index] = { ...field, placeholder: e.target.value };
                        updateConfig('formFields', currentFields);
                      }}
                      placeholder="Digite aqui..."
                      className="h-8"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Label className="text-xs">Obrigatório</Label>
                    <Switch
                      checked={field.required}
                      onCheckedChange={(checked) => {
                        const currentFields = [...(block.config?.formFields || [])];
                        currentFields[index] = { ...field, required: checked };
                        updateConfig('formFields', currentFields);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      case 'image':
        return (
          <>
            <div className="space-y-2">
              <Label>URL da Imagem</Label>
              <Input
                value={block.config?.imageUrl || ''}
                onChange={(e) => updateConfig('imageUrl', e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição da Imagem</Label>
              <Input
                value={block.config?.imageDescription || ''}
                onChange={(e) => updateConfig('imageDescription', e.target.value)}
                placeholder="Texto abaixo da imagem..."
              />
            </div>

            <div className="space-y-2">
              <Label>Proporção</Label>
              <Select
                value={block.config?.aspectRatio || '16:9'}
                onValueChange={(value) => updateConfig('aspectRatio', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="2:1">2:1</SelectItem>
                  <SelectItem value="16:9">16:9</SelectItem>
                  <SelectItem value="3:2">3:2</SelectItem>
                  <SelectItem value="14:10">14:10</SelectItem>
                  <SelectItem value="4:3">4:3</SelectItem>
                  <SelectItem value="5:4">5:4</SelectItem>
                  <SelectItem value="1:1">1:1</SelectItem>
                  <SelectItem value="4:5">4:5</SelectItem>
                  <SelectItem value="3:4">3:4</SelectItem>
                  <SelectItem value="10:14">10:14</SelectItem>
                  <SelectItem value="2:3">2:3</SelectItem>
                  <SelectItem value="6:10">6:10</SelectItem>
                  <SelectItem value="9:16">9:16</SelectItem>
                  <SelectItem value="1:2">1:2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tamanho</Label>
              <Select
                value={block.config?.imageSize || 'md'}
                onValueChange={(value) => updateConfig('imageSize', value)}
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

            <div className="flex items-center justify-between">
              <Label>Bordas Arredondadas</Label>
              <Switch
                checked={block.config?.roundedBorders !== false}
                onCheckedChange={(checked) => updateConfig('roundedBorders', checked)}
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
