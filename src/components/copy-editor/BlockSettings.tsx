import { ArrowLeft } from 'phosphor-react';
import { Block } from '@/types/copy-editor';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
              <Select
                value={block.config?.textAlign || 'left'}
                onValueChange={(value) => updateConfig('textAlign', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                </SelectContent>
              </Select>
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
              <Select
                value={block.config?.textAlign || 'left'}
                onValueChange={(value) => updateConfig('textAlign', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case 'list':
        return (
          <div className="space-y-2">
            <Label>Estilo da Lista</Label>
            <Select
              value={block.config?.listStyle || 'bullets'}
              onValueChange={(value) => updateConfig('listStyle', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bullets">Bullets (•)</SelectItem>
                <SelectItem value="numbers">Números (1, 2, 3)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'button':
        return (
          <>
            <div className="space-y-2">
              <Label>Tamanho</Label>
              <Select
                value={block.config?.buttonSize || 'md'}
                onValueChange={(value) => updateConfig('buttonSize', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Pequeno</SelectItem>
                  <SelectItem value="md">Médio</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
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
