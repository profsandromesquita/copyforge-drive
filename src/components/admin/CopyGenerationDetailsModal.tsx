import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  User, 
  Briefcase, 
  Brain, 
  FileText, 
  ArrowsLeftRight,
  Hash,
  Code,
  CurrencyDollar
} from "phosphor-react";
import { CopyGeneration } from "@/hooks/useAdminCopies";
import { calculateGenerationCost, formatCost } from "@/lib/ai-pricing";
import { PromptVisualizationTab } from "./PromptVisualizationTab";

interface CopyGenerationDetailsModalProps {
  generation: CopyGeneration & { copies?: { title: string } } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CopyGenerationDetailsModal = ({
  generation,
  open,
  onOpenChange,
}: CopyGenerationDetailsModalProps) => {
  if (!generation) return null;

  const getCategoryColor = (category: string) => {
    return category === "text" ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500";
  };

  const getGenerationType = (type: string) => {
    const types: Record<string, string> = {
      create: "Criação",
      optimize: "Otimização",
      variation: "Variação",
    };
    return types[type] || type;
  };

  const formatTokens = (tokens: number) => {
    return new Intl.NumberFormat("pt-BR").format(tokens);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Detalhes da Geração de IA</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informações Gerais</TabsTrigger>
            <TabsTrigger value="prompts">Prompts & Contexto</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <ScrollArea className="max-h-[calc(90vh-200px)]">
              <div className="space-y-6 pr-4">
                {/* Header Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(generation.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <User size={20} className="text-muted-foreground" />
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={generation.profiles?.avatar_url || ""} />
                      <AvatarFallback>{generation.profiles?.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{generation.profiles?.name}</p>
                      <p className="text-xs text-muted-foreground">{generation.profiles?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Briefcase size={20} className="text-muted-foreground" />
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={generation.workspaces?.avatar_url || ""} />
                      <AvatarFallback>{generation.workspaces?.name?.[0] || "W"}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{generation.workspaces?.name}</span>
                  </div>
                </div>

                <Separator />

                {/* Generation Info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Brain size={18} />
                    Informações da Geração
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Modelo</p>
                      <Badge variant="outline" className="font-mono text-xs">
                        {generation.model_used}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                      <Badge className={getCategoryColor(generation.generation_category)}>
                        {generation.generation_category === "text" ? "Texto" : "Imagem"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Ação</p>
                      <Badge variant="secondary">{getGenerationType(generation.generation_type)}</Badge>
                    </div>
                    {generation.copy_type && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Tipo de Copy</p>
                        <Badge variant="outline">{generation.copy_type}</Badge>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Tokens Usage & Cost */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Hash size={18} />
                    Uso de Tokens & Custo
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <ArrowsLeftRight size={20} className="mx-auto mb-1 text-blue-500" />
                      <p className="text-xs text-muted-foreground mb-1">Input</p>
                      <p className="text-lg font-bold">{formatTokens(generation.input_tokens)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <ArrowsLeftRight size={20} className="mx-auto mb-1 text-green-500" />
                      <p className="text-xs text-muted-foreground mb-1">Output</p>
                      <p className="text-lg font-bold">{formatTokens(generation.output_tokens)}</p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-3 text-center">
                      <Hash size={20} className="mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground mb-1">Total</p>
                      <p className="text-lg font-bold text-primary">{formatTokens(generation.total_tokens)}</p>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-3 text-center">
                      <CurrencyDollar size={20} className="mx-auto mb-1 text-green-600 dark:text-green-400" />
                      <p className="text-xs text-muted-foreground mb-1">Custo</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCost(
                          calculateGenerationCost(
                            generation.model_used || 'google/gemini-2.5-flash',
                            generation.input_tokens || 0,
                            generation.output_tokens || 0
                          )
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Prompt */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <FileText size={18} />
                    Prompt
                  </h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{generation.prompt}</p>
                  </div>
                </div>

                {/* Parameters */}
                {generation.parameters && Object.keys(generation.parameters).length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Code size={18} />
                        Parâmetros
                      </h3>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(generation.parameters, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </>
                )}

                {/* Context */}
                {(generation.project_identity || generation.audience_segment || generation.offer) && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold">Contexto</h3>
                      {generation.project_identity && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Identidade do Projeto</p>
                          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                            {generation.project_identity.brand_name && (
                              <p><span className="font-medium">Marca:</span> {generation.project_identity.brand_name}</p>
                            )}
                            {generation.project_identity.sector && (
                              <p><span className="font-medium">Setor:</span> {generation.project_identity.sector}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {generation.audience_segment && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Segmento de Audiência</p>
                          <div className="bg-muted/50 rounded-lg p-3 text-sm">
                            <p><span className="font-medium">Quem é:</span> {generation.audience_segment.who_is}</p>
                          </div>
                        </div>
                      )}
                      {generation.offer && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Oferta</p>
                          <div className="bg-muted/50 rounded-lg p-3 text-sm">
                            <p><span className="font-medium">Nome:</span> {generation.offer.name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Result Preview */}
                {generation.sessions && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold">Resultado</h3>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-xs text-muted-foreground mb-2">
                          {generation.generation_category === "image" 
                            ? "Imagem gerada com sucesso" 
                            : `${generation.sessions.length} sessão(ões) criada(s)`}
                        </p>
                        {generation.generation_category === "text" && generation.sessions.length > 0 && (
                          <div className="space-y-2 max-h-60 overflow-auto">
                            {generation.sessions.slice(0, 2).map((session: any, idx: number) => (
                              <div key={idx} className="border rounded p-2 bg-background">
                                <p className="text-xs font-medium mb-1">{session.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {session.blocks?.length || 0} bloco(s)
                                </p>
                              </div>
                            ))}
                            {generation.sessions.length > 2 && (
                              <p className="text-xs text-muted-foreground text-center">
                                + {generation.sessions.length - 2} sessão(ões)
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="prompts">
            <ScrollArea className="max-h-[calc(90vh-200px)]">
              <PromptVisualizationTab
                systemInstruction={generation.system_instruction}
                userPrompt={generation.prompt}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
