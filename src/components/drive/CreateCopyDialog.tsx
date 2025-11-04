import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Monitor, 
  Megaphone, 
  VideoCamera, 
  EnvelopeSimple, 
  Presentation,
  Article,
  ChatCircleText,
  DotsThree
} from "phosphor-react";

export type CopyType = 'landing_page' | 'anuncio' | 'vsl' | 'email' | 'webinar' | 'conteudo' | 'mensagem' | 'outro';

interface CopyTypeOption {
  value: CopyType;
  label: string;
  icon: React.ReactNode;
}

const copyTypes: CopyTypeOption[] = [
  { 
    value: 'landing_page', 
    label: 'Landing Page',
    icon: <Monitor size={24} weight="duotone" />
  },
  { 
    value: 'anuncio', 
    label: 'Anúncio',
    icon: <Megaphone size={24} weight="duotone" />
  },
  { 
    value: 'vsl', 
    label: 'Video de Vendas',
    icon: <VideoCamera size={24} weight="duotone" />
  },
  { 
    value: 'email', 
    label: 'E-mail',
    icon: <EnvelopeSimple size={24} weight="duotone" />
  },
  { 
    value: 'webinar', 
    label: 'Webinar',
    icon: <Presentation size={24} weight="duotone" />
  },
  { 
    value: 'conteudo', 
    label: 'Conteúdo',
    icon: <Article size={24} weight="duotone" />
  },
  { 
    value: 'mensagem', 
    label: 'Mensagem',
    icon: <ChatCircleText size={24} weight="duotone" />
  },
  { 
    value: 'outro', 
    label: 'Outro',
    icon: <DotsThree size={24} weight="duotone" />
  },
];

interface CreateCopyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCopy: (name: string, type: CopyType) => void;
}

export function CreateCopyDialog({ open, onOpenChange, onCreateCopy }: CreateCopyDialogProps) {
  const [selectedType, setSelectedType] = useState<CopyType>('landing_page');
  const [copyName, setCopyName] = useState('');

  const handleCreate = () => {
    if (copyName.trim()) {
      onCreateCopy(copyName.trim(), selectedType);
      setCopyName('');
      setSelectedType('landing_page');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl">Criar Nova Copy</DialogTitle>
          <DialogDescription>
            Escolha o tipo de copy e dê um nome para começar
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-6 pb-6 space-y-6">
          {/* Copy Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tipo de Copy</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {copyTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`
                    relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                    hover:border-primary/50 hover:bg-accent/50
                    ${selectedType === type.value 
                      ? 'border-primary bg-accent shadow-sm' 
                      : 'border-border bg-card'
                    }
                  `}
                >
                  <div className={`
                    transition-colors
                    ${selectedType === type.value ? 'text-primary' : 'text-muted-foreground'}
                  `}>
                    {type.icon}
                  </div>
                  <span className={`
                    text-xs font-medium text-center transition-colors
                    ${selectedType === type.value ? 'text-foreground' : 'text-muted-foreground'}
                  `}>
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Copy Name Input */}
          <div className="space-y-2">
            <Label htmlFor="copy-name">Nome da Copy</Label>
            <Input
              id="copy-name"
              placeholder="Ex: Landing Page - Produto X"
              value={copyName}
              onChange={(e) => setCopyName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && copyName.trim()) {
                  handleCreate();
                }
              }}
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!copyName.trim()}
            >
              Criar Copy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
