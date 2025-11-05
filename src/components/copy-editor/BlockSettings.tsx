import { ArrowLeft, TextAlignLeft, TextAlignCenter, TextAlignRight, Check, ArrowRight, Star, Heart, DownloadSimple, Play, ShoppingCart, Plus, Trash, Upload } from 'phosphor-react';
import { Block } from '@/types/copy-editor';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Slider } from '@/components/ui/slider';
import { useCopyEditor } from '@/hooks/useCopyEditor';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface BlockSettingsProps {
  block: Block;
  onBack: () => void;
}

export const BlockSettings = ({ block, onBack }: BlockSettingsProps) => {
  const { updateBlock } = useCopyEditor();
  const [isUploading, setIsUploading] = useState(false);

  const updateConfig = (key: string, value: any) => {
    updateBlock(block.id, {
      config: { ...(block.config || {}), [key]: value },
    });
  };

  const updateContent = (content: string) => {
    updateBlock(block.id, { content });
  };

  const handleImageUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Você precisa estar autenticado para fazer upload');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('copy-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('copy-images')
        .getPublicUrl(data.path);

      updateConfig('imageUrl', publicUrl);
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handlePaste = async (e: ClipboardEvent) => {
    if (block.type !== 'image') return;
    
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          await handleImageUpload(file);
        }
        break;
      }
    }
  };

  useEffect(() => {
    if (block.type === 'image') {
      window.addEventListener('paste', handlePaste);
      return () => {
        window.removeEventListener('paste', handlePaste);
      };
    }
  }, [block.type]);

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
        const aspectRatios = [
          '2:1', '16:9', '3:2', '14:10', '4:3', '5:4', '1:1', 
          '4:5', '3:4', '10:14', '2:3', '6:10', '9:16', '1:2'
        ];
        const currentRatioIndex = aspectRatios.indexOf(block.config?.aspectRatio || '16:9');
        
        return (
          <>
            <div className="space-y-3">
              <Label>Upload de Imagem</Label>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isUploading}
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Upload size={16} className="mr-2" />
                  {isUploading ? 'Enviando...' : 'Escolher Imagem ou Colar (Ctrl+V)'}
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição da Imagem</Label>
              <Input
                value={block.config?.imageDescription || ''}
                onChange={(e) => updateConfig('imageDescription', e.target.value)}
                placeholder="Texto abaixo da imagem..."
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Proporção</Label>
                <span className="text-sm text-muted-foreground">
                  {block.config?.aspectRatio || '16:9'}
                </span>
              </div>
              <Slider
                value={[currentRatioIndex]}
                onValueChange={([value]) => updateConfig('aspectRatio', aspectRatios[value])}
                min={0}
                max={aspectRatios.length - 1}
                step={1}
                className="w-full"
              />
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

      case 'video':
        return (
          <>
            <div className="space-y-2">
              <Label>URL do Vídeo</Label>
              <Input
                value={block.config?.videoUrl || ''}
                onChange={(e) => updateConfig('videoUrl', e.target.value)}
                placeholder="Cole a URL do YouTube ou Vimeo..."
              />
              <p className="text-xs text-muted-foreground">
                Suporta vídeos do YouTube e Vimeo
              </p>
            </div>

            <div className="space-y-3">
              <Label>Upload de Vídeo</Label>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isUploading}
                  onClick={() => document.getElementById('video-upload')?.click()}
                >
                  <Upload size={16} className="mr-2" />
                  {isUploading ? 'Enviando...' : 'Escolher Vídeo'}
                </Button>
                <input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    if (!file.type.startsWith('video/')) {
                      toast.error('Por favor, selecione apenas arquivos de vídeo');
                      return;
                    }

                    if (file.size > 100 * 1024 * 1024) {
                      toast.error('O vídeo deve ter no máximo 100MB');
                      return;
                    }

                    setIsUploading(true);
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) {
                        toast.error('Você precisa estar autenticado para fazer upload');
                        return;
                      }

                      const fileExt = file.name.split('.').pop();
                      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

                      const { data, error } = await supabase.storage
                        .from('copy-videos')
                        .upload(fileName, file);

                      if (error) throw error;

                      const { data: { publicUrl } } = supabase.storage
                        .from('copy-videos')
                        .getPublicUrl(data.path);

                      updateConfig('videoUrl', publicUrl);
                      toast.success('Vídeo enviado com sucesso!');
                    } catch (error) {
                      console.error('Error uploading video:', error);
                      toast.error('Erro ao enviar vídeo');
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Título (opcional)</Label>
              <Input
                value={block.config?.videoTitle || ''}
                onChange={(e) => updateConfig('videoTitle', e.target.value)}
                placeholder="Título do vídeo..."
              />
            </div>

            <div className="space-y-2">
              <Label>Tamanho</Label>
              <Select
                value={block.config?.videoSize || 'md'}
                onValueChange={(value) => updateConfig('videoSize', value)}
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
          </>
        );

      case 'audio':
        return (
          <>
            <div className="space-y-2">
              <Label>URL do Áudio</Label>
              <Input
                value={block.config?.audioUrl || ''}
                onChange={(e) => updateConfig('audioUrl', e.target.value)}
                placeholder="Cole a URL do áudio..."
              />
              <p className="text-xs text-muted-foreground">
                Suporta MP3, WAV, OGG e outros formatos
              </p>
            </div>

            <div className="space-y-3">
              <Label>Upload de Áudio</Label>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isUploading}
                  onClick={() => document.getElementById('audio-upload')?.click()}
                >
                  <Upload size={16} className="mr-2" />
                  {isUploading ? 'Enviando...' : 'Escolher Áudio'}
                </Button>
                <input
                  id="audio-upload"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    if (!file.type.startsWith('audio/')) {
                      toast.error('Por favor, selecione apenas arquivos de áudio');
                      return;
                    }

                    if (file.size > 50 * 1024 * 1024) {
                      toast.error('O áudio deve ter no máximo 50MB');
                      return;
                    }

                    setIsUploading(true);
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) {
                        toast.error('Você precisa estar autenticado para fazer upload');
                        return;
                      }

                      const fileExt = file.name.split('.').pop();
                      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

                      const { data, error } = await supabase.storage
                        .from('copy-audios')
                        .upload(fileName, file);

                      if (error) throw error;

                      const { data: { publicUrl } } = supabase.storage
                        .from('copy-audios')
                        .getPublicUrl(data.path);

                      updateConfig('audioUrl', publicUrl);
                      toast.success('Áudio enviado com sucesso!');
                    } catch (error) {
                      console.error('Error uploading audio:', error);
                      toast.error('Erro ao enviar áudio');
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Título (opcional)</Label>
              <Input
                value={block.config?.audioTitle || ''}
                onChange={(e) => updateConfig('audioTitle', e.target.value)}
                placeholder="Título do áudio..."
              />
            </div>

            <div className="space-y-2">
              <Label>Artista (opcional)</Label>
              <Input
                value={block.config?.audioArtist || ''}
                onChange={(e) => updateConfig('audioArtist', e.target.value)}
                placeholder="Nome do artista..."
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Mostrar Controles</Label>
              <Switch
                checked={block.config?.showControls !== false}
                onCheckedChange={(checked) => updateConfig('showControls', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Mostrar Forma de Ondas</Label>
              <Switch
                checked={block.config?.showWaveform !== false}
                onCheckedChange={(checked) => updateConfig('showWaveform', checked)}
              />
            </div>
          </>
        );

      case 'faq':
        const faqItems = block.config?.faqItems || [];
        
        const addFaqItem = () => {
          const newItem = {
            id: `faq-${Date.now()}`,
            question: '',
            answer: ''
          };
          updateConfig('faqItems', [...faqItems, newItem]);
        };

        const removeFaqItem = (id: string) => {
          updateConfig('faqItems', faqItems.filter(item => item.id !== id));
        };

        const updateFaqItem = (id: string, field: 'question' | 'answer', value: string) => {
          updateConfig('faqItems', faqItems.map(item =>
            item.id === id ? { ...item, [field]: value } : item
          ));
        };

        return (
          <>
            <div className="space-y-2">
              <Label>Título da Sessão (opcional)</Label>
              <Input
                value={block.config?.faqTitle || ''}
                onChange={(e) => updateConfig('faqTitle', e.target.value)}
                placeholder="Perguntas Frequentes"
              />
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
              <Label>Mostrar Numeração</Label>
              <Switch
                checked={block.config?.showNumbering !== false}
                onCheckedChange={(checked) => updateConfig('showNumbering', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Expandido por Padrão</Label>
              <Switch
                checked={block.config?.expandedByDefault === true}
                onCheckedChange={(checked) => updateConfig('expandedByDefault', checked)}
              />
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label>Perguntas e Respostas</Label>
                <Button size="sm" onClick={addFaqItem} variant="outline">
                  <Plus size={16} className="mr-2" />
                  Adicionar Pergunta
                </Button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {faqItems.map((item, index) => (
                  <div key={item.id} className="p-3 border rounded-lg space-y-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Pergunta {index + 1}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={() => removeFaqItem(item.id)}
                      >
                        <Trash size={14} />
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Pergunta</Label>
                      <Input
                        value={item.question}
                        onChange={(e) => updateFaqItem(item.id, 'question', e.target.value)}
                        placeholder="Digite a pergunta..."
                        className="h-8"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Resposta</Label>
                      <Input
                        value={item.answer}
                        onChange={(e) => updateFaqItem(item.id, 'answer', e.target.value)}
                        placeholder="Digite a resposta..."
                        className="h-8"
                      />
                    </div>
                  </div>
                ))}

                {faqItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma pergunta adicionada ainda
                  </p>
                )}
              </div>
            </div>
          </>
        );

      case 'testimonial':
        const testimonialItems = block.config?.testimonialItems || [];
        
        const addTestimonialItem = () => {
          const newItem = {
            id: `testimonial-${Date.now()}`,
            name: '',
            description: '',
            text: '',
            rating: 5,
            photo: ''
          };
          updateConfig('testimonialItems', [...testimonialItems, newItem]);
        };

        const removeTestimonialItem = (id: string) => {
          updateConfig('testimonialItems', testimonialItems.filter(item => item.id !== id));
        };

        const updateTestimonialItem = (id: string, field: keyof import('@/types/copy-editor').TestimonialItem, value: any) => {
          updateConfig('testimonialItems', testimonialItems.map(item =>
            item.id === id ? { ...item, [field]: value } : item
          ));
        };

        return (
          <>
            <div className="space-y-2">
              <Label>Título da Sessão (opcional)</Label>
              <Input
                value={block.config?.testimonialTitle || ''}
                onChange={(e) => updateConfig('testimonialTitle', e.target.value)}
                placeholder="O que nossos clientes dizem"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Mostrar Fotos</Label>
              <Switch
                checked={block.config?.showPhotos !== false}
                onCheckedChange={(checked) => updateConfig('showPhotos', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Mostrar Avaliações</Label>
              <Switch
                checked={block.config?.showRatings !== false}
                onCheckedChange={(checked) => updateConfig('showRatings', checked)}
              />
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label>Lista de Depoimentos</Label>
                <Button size="sm" onClick={addTestimonialItem} variant="outline">
                  <Plus size={16} className="mr-2" />
                  Adicionar Depoimento
                </Button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {testimonialItems.map((item, index) => (
                  <div key={item.id} className="p-3 border rounded-lg space-y-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Depoimento {index + 1}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={() => removeTestimonialItem(item.id)}
                      >
                        <Trash size={14} />
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Nome do Cliente</Label>
                      <Input
                        value={item.name}
                        onChange={(e) => updateTestimonialItem(item.id, 'name', e.target.value)}
                        placeholder="Nome completo..."
                        className="h-8"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Descrição (Cargo ou Empresa)</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateTestimonialItem(item.id, 'description', e.target.value)}
                        placeholder="CEO na Empresa X..."
                        className="h-8"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Texto do Depoimento</Label>
                      <Input
                        value={item.text}
                        onChange={(e) => updateTestimonialItem(item.id, 'text', e.target.value)}
                        placeholder="Escreva o depoimento..."
                        className="h-8"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Foto do Cliente (opcional)</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={isUploading}
                          type="button"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = async (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (!file) return;

                              if (!file.type.startsWith('image/')) {
                                toast.error('Por favor, selecione apenas arquivos de imagem');
                                return;
                              }

                              if (file.size > 5 * 1024 * 1024) {
                                toast.error('A imagem deve ter no máximo 5MB');
                                return;
                              }

                              setIsUploading(true);
                              try {
                                const { data: { user } } = await supabase.auth.getUser();
                                if (!user) {
                                  toast.error('Você precisa estar autenticado para fazer upload');
                                  return;
                                }

                                const fileExt = file.name.split('.').pop();
                                const fileName = `${user.id}/${Date.now()}.${fileExt}`;

                                const { data, error } = await supabase.storage
                                  .from('copy-images')
                                  .upload(fileName, file);

                                if (error) throw error;

                                const { data: { publicUrl } } = supabase.storage
                                  .from('copy-images')
                                  .getPublicUrl(data.path);

                                updateTestimonialItem(item.id, 'photo', publicUrl);
                                toast.success('Foto enviada com sucesso!');
                              } catch (error) {
                                console.error('Error uploading photo:', error);
                                toast.error('Erro ao enviar foto');
                              } finally {
                                setIsUploading(false);
                              }
                            };
                            input.click();
                          }}
                        >
                          <Upload size={14} className="mr-2" />
                          {isUploading ? 'Enviando...' : 'Upload'}
                        </Button>
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">ou</span>
                          <Input
                            value={item.photo || ''}
                            onChange={(e) => updateTestimonialItem(item.id, 'photo', e.target.value)}
                            placeholder="URL da foto"
                            className="h-8 flex-1"
                          />
                        </div>
                      </div>
                      {item.photo && (
                        <div className="flex items-center gap-2 mt-2">
                          <img 
                            src={item.photo} 
                            alt="Preview" 
                            className="w-12 h-12 rounded-full object-cover border"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-destructive"
                            onClick={() => updateTestimonialItem(item.id, 'photo', '')}
                          >
                            Remover foto
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Avaliação ({item.rating} estrelas)</Label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => updateTestimonialItem(item.id, 'rating', star)}
                            className="hover:scale-110 transition-transform"
                          >
                            <Star 
                              size={24}
                              weight={star <= item.rating ? 'fill' : 'regular'}
                              className={star <= item.rating ? 'text-yellow-500' : 'text-muted-foreground'}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {testimonialItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum depoimento adicionado ainda
                  </p>
                )}
              </div>
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
