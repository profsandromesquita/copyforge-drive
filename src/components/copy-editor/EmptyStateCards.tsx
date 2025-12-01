import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkle, ChatCircle } from 'phosphor-react';
import { StructuralPreviewSkeleton } from './StructuralPreviewSkeleton';

interface EmptyStateCardsProps {
  onStartCreation?: () => void;
  onOpenChat?: () => void;
  activeTab?: 'ai' | 'chat';
}

export const EmptyStateCards = ({ onStartCreation, onOpenChat, activeTab }: EmptyStateCardsProps) => {
  // Se está na aba "Copy IA", mostrar skeleton preview
  if (activeTab === 'ai') {
    return <StructuralPreviewSkeleton />;
  }
  
  // Caso contrário, mostrar cards de escolha
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-2">Como você quer começar?</h2>
          <p className="text-muted-foreground">
            Escolha o modo de trabalho ideal para o seu projeto
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Card 1: Geração Estruturada */}
          <Card 
            className="cursor-pointer hover:border-primary hover:shadow-md transition-all duration-200"
            onClick={onStartCreation}
          >
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Sparkle size={32} weight="fill" className="text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-3">Geração Estruturada</h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Ideal para começar do zero. Defina Persona, Oferta e Metodologia 
                e gere uma copy completa em segundos.
              </p>
              <Button variant="default" className="w-full gap-2">
                <Sparkle size={16} weight="fill" />
                Iniciar Criação
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Modo Co-Piloto */}
          <Card 
            className="cursor-pointer hover:border-primary hover:shadow-md transition-all duration-200"
            onClick={onOpenChat}
          >
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <ChatCircle size={32} weight="fill" className="text-primary" />
              </div>
              <h3 className="font-semibold text-xl mb-3">Modo Co-Piloto</h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Ideal para refinar e construir bloco a bloco. Use comandos como 
                "Otimizar", "Variar" e cite seu contexto com #.
              </p>
              <Button variant="outline" className="w-full gap-2">
                <ChatCircle size={16} weight="fill" />
                Abrir Chat
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
