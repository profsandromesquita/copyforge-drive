import { Settings, Lightbulb, MessageSquare } from "lucide-react";

interface ContextConfigCardProps {
  variant?: 'full' | 'compact';
}

export const ContextConfigCard = ({ variant = 'full' }: ContextConfigCardProps) => {
  if (variant === 'compact') {
    return (
      <div className="w-full max-w-md space-y-4">
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-primary">Configure o Contexto</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Clique no ícone de <span className="font-medium text-foreground">engrenagem</span> no topo para configurar Público-Alvo e Oferta.
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-sm">Use variáveis #hashtags</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Injete contexto diretamente nas suas mensagens usando variáveis como <code className="bg-muted px-1 py-0.5 rounded text-primary">#marca_nome</code> ou <code className="bg-muted px-1 py-0.5 rounded text-primary">#maior_desejo</code>.
          </p>
        </div>

        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm text-muted-foreground">Exemplos de comandos</h4>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1.5 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>"Otimize o bloco selecionado"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>"Crie uma variação usando a #oferta"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>"Gere um CTA com #marca_nome"</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // variant === 'full' (default)
  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Settings className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-primary">Configure o Contexto de Criação</h4>
      </div>
      <p className="text-sm text-muted-foreground">
        Clique no ícone de engrenagem no canto superior direito do editor para configurar o Público-Alvo e a Oferta e personalizar o contexto da sua copy.
      </p>
    </div>
  );
};
