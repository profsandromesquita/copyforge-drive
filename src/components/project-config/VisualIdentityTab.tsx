import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useProject } from '@/hooks/useProject';
import { useWorkspace } from '@/hooks/useWorkspace';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Palette, Image, Sparkle, X } from 'phosphor-react';
import { VISUAL_STYLES, IMAGERY_STYLES, ColorPalette } from '@/types/project-config';

interface VisualIdentityTabProps {
  onSaveSuccess?: () => void;
}

export const VisualIdentityTab = ({ onSaveSuccess }: VisualIdentityTabProps) => {
  const { activeProject, refreshProjects } = useProject();
  const { activeWorkspace } = useWorkspace();
  
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [colorPalette, setColorPalette] = useState<ColorPalette>({
    primary: '',
    secondary: '',
    accent: '',
    background: '#FFFFFF'
  });
  const [imageryStyle, setImageryStyle] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeProject) {
      setSelectedStyles(activeProject.visual_style || []);
      setColorPalette(activeProject.color_palette || {
        primary: '',
        secondary: '',
        accent: '',
        background: '#FFFFFF'
      });
      setImageryStyle(activeProject.imagery_style || '');
    }
  }, [activeProject]);

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev => 
      prev.includes(style)
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  const handleColorChange = (key: keyof ColorPalette, value: string) => {
    setColorPalette(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!activeProject || !activeWorkspace) {
      toast.error('Projeto ou workspace não encontrado');
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          visual_style: selectedStyles.length > 0 ? selectedStyles : null,
          color_palette: colorPalette as any, // Cast to any to match JSONB type
          imagery_style: imageryStyle || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeProject.id);

      if (error) throw error;

      await refreshProjects();
      toast.success('Identidade Visual salva com sucesso!');
      onSaveSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar identidade visual:', error);
      toast.error('Erro ao salvar identidade visual');
    } finally {
      setIsSaving(false);
    }
  };

  if (!activeProject) return null;

  const hasChanges = 
    JSON.stringify(selectedStyles) !== JSON.stringify(activeProject.visual_style || []) ||
    JSON.stringify(colorPalette) !== JSON.stringify(activeProject.color_palette) ||
    imageryStyle !== (activeProject.imagery_style || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Palette size={24} className="text-primary" weight="duotone" />
          <h2 className="text-2xl font-bold">Identidade Visual</h2>
        </div>
        <p className="text-muted-foreground">
          Configure a identidade visual da sua marca para gerar imagens perfeitamente alinhadas.
        </p>
      </div>

      <div className="space-y-6">
        {/* Estilos Visuais */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkle size={20} className="text-primary" weight="duotone" />
            <Label className="text-base font-semibold">Estilos Visuais</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Selecione os estilos que representam a personalidade visual da sua marca (múltipla escolha)
          </p>
          
          <div className="flex flex-wrap gap-2">
            {VISUAL_STYLES.map(style => (
              <Badge
                key={style}
                variant={selectedStyles.includes(style) ? 'default' : 'outline'}
                className={`cursor-pointer transition-all hover:scale-105 ${
                  selectedStyles.includes(style) 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
                onClick={() => toggleStyle(style)}
              >
                {style}
                {selectedStyles.includes(style) && (
                  <X size={14} className="ml-1" weight="bold" />
                )}
              </Badge>
            ))}
          </div>

          {selectedStyles.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                ✓ {selectedStyles.length} {selectedStyles.length === 1 ? 'estilo selecionado' : 'estilos selecionados'}
              </p>
            </div>
          )}
        </Card>

        {/* Paleta de Cores */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Palette size={20} className="text-primary" weight="duotone" />
            <Label className="text-base font-semibold">Paleta de Cores</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Defina as cores principais da sua marca para guiar a geração de imagens
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cor Principal */}
            <div className="space-y-2">
              <Label htmlFor="primary">Cor Principal</Label>
              <div className="flex gap-2">
                <Input
                  id="primary"
                  type="color"
                  value={colorPalette.primary || '#000000'}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colorPalette.primary || ''}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Cor Secundária */}
            <div className="space-y-2">
              <Label htmlFor="secondary">Cor Secundária</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary"
                  type="color"
                  value={colorPalette.secondary || '#666666'}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colorPalette.secondary || ''}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  placeholder="#666666"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Cor de Destaque */}
            <div className="space-y-2">
              <Label htmlFor="accent">Cor de Destaque</Label>
              <div className="flex gap-2">
                <Input
                  id="accent"
                  type="color"
                  value={colorPalette.accent || '#FF6B6B'}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colorPalette.accent || ''}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  placeholder="#FF6B6B"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Cor de Fundo */}
            <div className="space-y-2">
              <Label htmlFor="background">Cor de Fundo</Label>
              <div className="flex gap-2">
                <Input
                  id="background"
                  type="color"
                  value={colorPalette.background || '#FFFFFF'}
                  onChange={(e) => handleColorChange('background', e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colorPalette.background || ''}
                  onChange={(e) => handleColorChange('background', e.target.value)}
                  placeholder="#FFFFFF"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Preview das Cores */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3">Preview da Paleta:</p>
            <div className="flex gap-2">
              <div 
                className="flex-1 h-16 rounded-md border-2 border-border flex items-center justify-center text-xs font-medium"
                style={{ 
                  backgroundColor: colorPalette.primary || '#000000',
                  color: '#FFFFFF'
                }}
              >
                Principal
              </div>
              <div 
                className="flex-1 h-16 rounded-md border-2 border-border flex items-center justify-center text-xs font-medium"
                style={{ 
                  backgroundColor: colorPalette.secondary || '#666666',
                  color: '#FFFFFF'
                }}
              >
                Secundária
              </div>
              <div 
                className="flex-1 h-16 rounded-md border-2 border-border flex items-center justify-center text-xs font-medium"
                style={{ 
                  backgroundColor: colorPalette.accent || '#FF6B6B',
                  color: '#FFFFFF'
                }}
              >
                Destaque
              </div>
              <div 
                className="flex-1 h-16 rounded-md border-2 border-border flex items-center justify-center text-xs font-medium"
                style={{ 
                  backgroundColor: colorPalette.background || '#FFFFFF',
                  color: '#000000'
                }}
              >
                Fundo
              </div>
            </div>
          </div>
        </Card>

        {/* Estilo de Imagens */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Image size={20} className="text-primary" weight="duotone" />
            <Label className="text-base font-semibold">Estilo de Imagens</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Escolha o estilo preferido para as imagens geradas
          </p>

          <Select value={imageryStyle} onValueChange={setImageryStyle}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estilo de imagens" />
            </SelectTrigger>
            <SelectContent>
              {IMAGERY_STYLES.map(style => (
                <SelectItem key={style} value={style}>
                  {style}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            size="lg"
            className="min-w-[200px]"
          >
            {isSaving ? 'Salvando...' : 'Salvar Identidade Visual'}
          </Button>
        </div>
      </div>
    </div>
  );
};