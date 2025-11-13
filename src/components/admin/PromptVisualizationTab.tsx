import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Download, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  formatSystemInstruction,
  formatJsonForDisplay,
  getSectionIcon,
  type SystemInstructionSection
} from "@/lib/prompt-formatter";

interface PromptVisualizationTabProps {
  systemInstruction?: any;
  userPrompt: string;
}

export const PromptVisualizationTab = ({
  systemInstruction,
  userPrompt
}: PromptVisualizationTabProps) => {
  const sections = formatSystemInstruction(systemInstruction);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para área de transferência`);
  };

  const exportPrompts = () => {
    const fullText = `=== SYSTEM INSTRUCTION ===\n\n${formatJsonForDisplay(systemInstruction)}\n\n=== USER PROMPT ===\n\n${userPrompt}`;
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompts-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Prompts exportados com sucesso");
  };

  const renderSectionContent = (section: SystemInstructionSection) => {
    if (section.type === 'json') {
      return (
        <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-sm whitespace-pre-wrap break-words">
          <code>{formatJsonForDisplay(section.content)}</code>
        </pre>
      );
    }
    
    return (
      <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm">
        {section.content}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {systemInstruction ? (
            <Badge variant="default">System Instruction Disponível</Badge>
          ) : (
            <Badge variant="secondary">System Instruction Não Salvo</Badge>
          )}
        </div>
        <Button onClick={exportPrompts} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportar Prompts
        </Button>
      </div>

      <Tabs defaultValue="system" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="system">System Instruction</TabsTrigger>
          <TabsTrigger value="user">User Prompt</TabsTrigger>
          <TabsTrigger value="complete">Visualização Completa</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4">
          {!systemInstruction ? (
            <Card>
              <CardHeader>
                <CardTitle>System Instruction Não Disponível</CardTitle>
                <CardDescription>
                  Esta geração foi feita antes da implementação do sistema de contexto persistente.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : sections.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>System Instruction Disponível</CardTitle>
                <CardDescription>
                  System instruction salvo em formato não estruturado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Este system instruction não segue a estrutura padrão esperada. Visualizando formato bruto.
                  </AlertDescription>
                </Alert>
                <ScrollArea className="h-[400px] w-full">
                  <div className="pr-4">
                    <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap break-words">
                      <code>{formatJsonForDisplay(systemInstruction)}</code>
                    </pre>
                  </div>
                </ScrollArea>
                <Button
                  onClick={() => copyToClipboard(formatJsonForDisplay(systemInstruction), "System Instruction")}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Tudo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {sections.map((section, index) => (
                <AccordionItem key={index} value={`section-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span>{getSectionIcon(section.title)}</span>
                      <span className="font-medium">{section.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {renderSectionContent(section)}
                      <Button
                        onClick={() => copyToClipboard(
                          typeof section.content === 'string' 
                            ? section.content 
                            : formatJsonForDisplay(section.content),
                          section.title
                        )}
                        variant="ghost"
                        size="sm"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Seção
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>

        <TabsContent value="user" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prompt do Usuário</CardTitle>
              <CardDescription>
                Instrução específica fornecida pelo usuário para esta geração
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm">
                  {userPrompt}
                </div>
                <Button
                  onClick={() => copyToClipboard(userPrompt, "User Prompt")}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Prompt
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complete" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visualização Completa</CardTitle>
              <CardDescription>
                System Instruction + User Prompt combinados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh] w-full">
                <div className="space-y-6 pr-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <span>🤖</span>
                      System Instruction
                    </h4>
                    <div className="h-[300px] overflow-auto bg-muted rounded-lg">
                      <pre className="p-4 text-sm whitespace-pre-wrap break-words">
                        <code>{formatJsonForDisplay(systemInstruction)}</code>
                      </pre>
                    </div>
                  </div>
                  
                  <div className="border-t pt-6">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <span>👤</span>
                      User Prompt
                    </h4>
                    <ScrollArea className="h-[200px] w-full">
                      <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm">
                        {userPrompt}
                      </div>
                    </ScrollArea>
                  </div>

                  <Button
                    onClick={() => copyToClipboard(
                      `${formatJsonForDisplay(systemInstruction)}\n\n---\n\n${userPrompt}`,
                      "Complete Request"
                    )}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Tudo
                  </Button>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
