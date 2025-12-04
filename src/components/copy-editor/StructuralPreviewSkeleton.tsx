import { CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const StructuralPreviewSkeleton = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6 animate-in fade-in duration-300">
      <div className="max-w-2xl w-full space-y-6 relative">
        {/* Badge indicando que é exemplo */}
        <div className="absolute -top-3 right-4 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-semibold px-3 py-1 rounded-full border border-amber-300 dark:border-amber-700 z-10">
          📋 PRÉVIA DO RESULTADO
        </div>

        {/* Explanatory text */}
        <div className="text-center space-y-2">
          <p className="text-base text-foreground font-semibold">
            Sua copy será estruturada em <span className="font-bold text-primary">blocos inteligentes</span> como este. Configure ao lado para gerar.
          </p>
        </div>

        {/* High-Fidelity Mock Preview with draft styling */}
        <div className="bg-card rounded-xl border-2 border-dashed border-muted-foreground/30 shadow-sm p-8 space-y-8 opacity-70 pointer-events-none select-none">
          
          {/* Title Block */}
          <h1 className="text-2xl md:text-3xl font-bold text-foreground/80">
            Descubra Como Transformar Suas Ideias em Resultados Reais
          </h1>

          {/* Image Block with marketing message */}
          <div className="aspect-video bg-gradient-to-br from-primary/5 to-primary/20 rounded-lg flex flex-col items-center justify-center p-6 border border-primary/20">
            <Sparkles className="w-12 h-12 text-primary/60 mb-3" />
            <p className="text-center text-sm text-primary/80 font-medium">
              Gere imagens incríveis com o modelo de IA<br/>mais poderoso do mundo.
            </p>
            <p className="text-center text-xs text-muted-foreground mt-2">
              Sua copy merece o melhor visual.
            </p>
          </div>

          {/* Text Block */}
          <p className="text-base text-muted-foreground leading-relaxed">
            Imagine ter uma copy que conecta instantaneamente com seu público, transmite sua mensagem com clareza e gera resultados reais. Com nossa metodologia comprovada, você vai criar conteúdos persuasivos que convertem visitantes em clientes.
          </p>

          {/* List Block */}
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary/60 mt-0.5 flex-shrink-0" />
              <span className="text-foreground/70">Aumente suas conversões em até 3x com copy estratégica</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary/60 mt-0.5 flex-shrink-0" />
              <span className="text-foreground/70">Conecte-se emocionalmente com sua audiência</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary/60 mt-0.5 flex-shrink-0" />
              <span className="text-foreground/70">Destaque-se da concorrência com mensagens únicas</span>
            </li>
          </ul>

          {/* CTA Block */}
          <Button className="w-full bg-primary/60 hover:bg-primary/60 text-primary-foreground font-semibold py-6 text-lg rounded-lg shadow-lg cursor-default">
            Quero Começar Agora →
          </Button>

        </div>
      </div>
    </div>
  );
};
