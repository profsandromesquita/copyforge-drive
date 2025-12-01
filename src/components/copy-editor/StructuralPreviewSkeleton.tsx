import { Image, AlignLeft, List, CheckCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
export const StructuralPreviewSkeleton = () => {
  return <div className="flex items-center justify-center min-h-[60vh] px-6 animate-in fade-in duration-300">
      <div className="max-w-2xl w-full">
        {/* Legenda explicativa no topo */}
        <p className="text-center text-base text-foreground font-semibold mb-6">Sua copy será estruturada em blocos inteligentes como este.
Escreva o seu prompt ao lado para gerar.<br />
          <span className="text-primary font-bold">Escreva os detalhes da copy ao lado para gerar.</span>
        </p>

        {/* Mock Preview Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 space-y-6 shadow-sm opacity-70">
          
          {/* Título Block */}
          <div className="border-2 border-dashed border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlignLeft className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase">Bloco: Título</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              Título Principal da Sua Copy
            </h1>
          </div>

          {/* Imagem Block */}
          <div className="border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Image className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Bloco: Imagem</span>
            </div>
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <Image className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
          </div>

          {/* Texto Block */}
          <div className="border-2 border-dashed border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlignLeft className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">Bloco: Texto</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Este é um exemplo de bloco de texto. Aqui você terá parágrafos explicativos, 
              argumentos de venda, storytelling e todo o conteúdo persuasivo da sua copy.
            </p>
          </div>

          {/* Lista Block */}
          <div className="border-2 border-dashed border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <List className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Bloco: Lista</span>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Benefício ou item da lista</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Outro ponto importante</span>
              </li>
              
            </ul>
          </div>

          {/* CTA Block */}
          <div className="border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">Bloco: CTA</span>
            </div>
            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-6">
              Seu Botão de Ação Aqui
            </Button>
          </div>

        </div>
      </div>
    </div>;
};