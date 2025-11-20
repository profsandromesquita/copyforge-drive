import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Code, Desktop, DeviceMobile, DeviceTablet } from 'phosphor-react';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface WebPreviewPanelProps {
  generatedCode: { html: string; css: string } | null;
  isGenerating: boolean;
  copyTitle: string;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

export function WebPreviewPanel({ generatedCode, isGenerating, copyTitle }: WebPreviewPanelProps) {
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [showCode, setShowCode] = useState(false);
  const { toast } = useToast();

  // Função para criar HTML completo com CSS injetado no <head>
  const createFullHTML = (html: string, css: string): string => {
    // Procurar pela tag </head> no HTML
    const headEndIndex = html.indexOf('</head>');
    
    if (headEndIndex !== -1) {
      // Se encontrou </head>, injeta o CSS antes dela
      return html.slice(0, headEndIndex) + 
        `  <style>\n${css}\n  </style>\n` + 
        html.slice(headEndIndex);
    } else {
      // Se não encontrou </head>, cria uma estrutura HTML completa
      return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${copyTitle}</title>
  <style>
${css}
  </style>
</head>
<body>
${html}
</body>
</html>`;
    }
  };

  const getDeviceWidth = () => {
    switch (device) {
      case 'mobile':
        return '375px';
      case 'tablet':
        return '768px';
      default:
        return '100%';
    }
  };

  const handleDownload = async () => {
    if (!generatedCode) return;

    try {
      const zip = new JSZip();
      
      zip.file('index.html', generatedCode.html);
      zip.file('styles.css', generatedCode.css);
      zip.file('README.md', `# ${copyTitle}\n\nLanding Page gerada pelo CopyDrive\n\n## Como usar\n\n1. Abra o arquivo index.html no navegador\n2. O arquivo styles.css será carregado automaticamente\n3. Personalize conforme necessário\n`);

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${copyTitle.toLowerCase().replace(/\s+/g, '-')}-landing-page.zip`);

      toast({
        title: 'Download iniciado',
        description: 'A landing page foi exportada com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao gerar ZIP:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível exportar a landing page.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyCode = () => {
    if (!generatedCode) return;

    const fullCode = `<!-- index.html -->\n${generatedCode.html}\n\n/* styles.css */\n${generatedCode.css}`;
    navigator.clipboard.writeText(fullCode);

    toast({
      title: 'Código copiado',
      description: 'O código foi copiado para a área de transferência.',
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden min-h-0">
      {/* Toolbar */}
      <div className="p-2 sm:p-4 border-b border-border flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Tabs value={device} onValueChange={(v) => setDevice(v as DeviceType)}>
            <TabsList className="h-8">
              <TabsTrigger value="desktop" className="gap-1 h-8 text-xs px-2">
                <Desktop size={14} />
                <span className="hidden sm:inline">Desktop</span>
              </TabsTrigger>
              <TabsTrigger value="tablet" className="gap-1 h-8 text-xs px-2">
                <DeviceTablet size={14} />
                <span className="hidden sm:inline">Tablet</span>
              </TabsTrigger>
              <TabsTrigger value="mobile" className="gap-1 h-8 text-xs px-2">
                <DeviceMobile size={14} />
                <span className="hidden sm:inline">Mobile</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCode(!showCode)}
            disabled={!generatedCode}
            className="gap-1 h-8 text-xs px-2"
          >
            <Code size={14} />
            <span className="hidden sm:inline">{showCode ? 'Preview' : 'Código'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
            disabled={!generatedCode}
            className="gap-1 h-8 text-xs px-2"
          >
            <Code size={14} />
            <span className="hidden sm:inline">Copiar</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleDownload}
            disabled={!generatedCode}
            className="gap-1 h-8 text-xs px-2"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Baixar</span>
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-2 sm:p-4 bg-background/50 min-h-0">
        {isGenerating && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 animate-pulse">
                <Code size={32} className="text-primary" />
              </div>
              <div>
                <p className="font-medium">Gerando página...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  A IA está criando o código HTML e CSS
                </p>
              </div>
            </div>
          </div>
        )}

        {!isGenerating && !generatedCode && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <Code size={48} className="mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhuma página gerada ainda
              </p>
              <p className="text-xs text-muted-foreground">
                Use o chat para começar
              </p>
            </div>
          </div>
        )}

        {!isGenerating && generatedCode && !showCode && (
          <div className="flex justify-center h-full">
            <div
              className="h-full overflow-auto"
              style={{
                width: getDeviceWidth(),
                maxWidth: '100%',
                maxHeight: '100%',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                backgroundColor: 'white',
              }}
            >
              <iframe
                srcDoc={createFullHTML(generatedCode.html, generatedCode.css)}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '400px',
                  border: 'none',
                }}
                title="Preview"
              />
            </div>
          </div>
        )}

        {!isGenerating && generatedCode && showCode && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">HTML</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                <code>{generatedCode.html}</code>
              </pre>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">CSS</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                <code>{generatedCode.css}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
