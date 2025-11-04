import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Upload, ShareNetwork } from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCopyEditor } from '@/hooks/useCopyEditor';

export const EditorHeader = () => {
  const navigate = useNavigate();
  const { copyTitle, setCopyTitle, isSaving } = useCopyEditor();
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {isEditingTitle ? (
          <Input
            value={copyTitle}
            onChange={(e) => setCopyTitle(e.target.value)}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setIsEditingTitle(false);
            }}
            className="max-w-xs"
            autoFocus
          />
        ) : (
          <h1
            className="text-lg font-semibold cursor-pointer hover:text-primary"
            onClick={() => setIsEditingTitle(true)}
          >
            {copyTitle}
          </h1>
        )}

        <span className="text-sm text-muted-foreground">
          {isSaving ? 'Salvando...' : 'Salvo'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Pré-visualizar</span>
        </Button>

        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Importar</span>
        </Button>

        <Button variant="outline" size="sm">
          <ShareNetwork className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Compartilhar</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Publicar</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Salvar como rascunho</DropdownMenuItem>
            <DropdownMenuItem>Salvar como Modelo</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
