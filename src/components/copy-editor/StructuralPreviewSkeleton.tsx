import { Image, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const StructuralPreviewSkeleton = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6 animate-in fade-in duration-300">
      <div className="max-w-2xl w-full space-y-6">
        {/* Explanatory text */}
        <div className="text-center space-y-2">
          <p className="text-base text-foreground font-semibold">
            Sua copy será estruturada em <span className="font-bold text-primary">blocos inteligentes</span> como este. Configure ao lado para gerar.
          </p>
        </div>

        {/* High-Fidelity Mock Preview */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-8 space-y-8">
          
          {/* Title Block */}
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Descubra Como Transformar Suas Ideias em Resultados Reais
          </h1>

          {/* Image Block */}
          <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
            <Image className="w-16 h-16 text-slate-300 dark:text-slate-600" />
          </div>

          {/* Text Block */}
          <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Imagine ter uma copy que conecta instantaneamente com seu público, transmite sua mensagem com clareza e gera resultados reais. Com nossa metodologia comprovada, você vai criar conteúdos persuasivos que convertem visitantes em clientes.
          </p>

          {/* List Block */}
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 dark:text-slate-300">Aumente suas conversões em até 3x com copy estratégica</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 dark:text-slate-300">Conecte-se emocionalmente com sua audiência</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 dark:text-slate-300">Destaque-se da concorrência com mensagens únicas</span>
            </li>
          </ul>

          {/* CTA Block */}
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg rounded-lg shadow-lg">
            Quero Começar Agora →
          </Button>

        </div>
      </div>
    </div>
  );
};