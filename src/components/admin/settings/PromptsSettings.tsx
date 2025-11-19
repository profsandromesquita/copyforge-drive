import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PromptCard } from "@/components/admin/ai-prompts/PromptCard";
import { PromptEditorModal } from "@/components/admin/ai-prompts/PromptEditorModal";
import { PromptHistoryModal } from "@/components/admin/ai-prompts/PromptHistoryModal";
import { CharacteristicsList } from "@/components/admin/ai-characteristics/CharacteristicsList";
import { useAIPrompts } from "@/hooks/useAIPrompts";
import { AIPromptTemplate } from "@/types/ai-prompts";
import { Brain, Sliders } from "phosphor-react";

export const PromptsSettings = () => {
  const { prompts, isLoading, error, refetch, updatePrompt, restoreDefault } = useAIPrompts();
  const [selectedPrompt, setSelectedPrompt] = useState<AIPromptTemplate | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleEdit = (prompt: AIPromptTemplate) => {
    setSelectedPrompt(prompt);
    setIsEditorOpen(true);
  };

  const handleHistory = (prompt: AIPromptTemplate) => {
    setSelectedPrompt(prompt);
    setIsHistoryOpen(true);
  };

  const handleSave = (id: string, newPrompt: string, reason?: string) => {
    updatePrompt.mutate({ id, current_prompt: newPrompt, change_reason: reason });
  };

  const handleRestore = (id: string) => {
    if (confirm('Tem certeza que deseja restaurar o prompt para o padrão? Esta ação não pode ser desfeita.')) {
      restoreDefault.mutate(id);
    }
  };

  const generateCopyPrompts = prompts.filter(p => p.category === 'generate_copy');
  const optimizeCopyPrompts = prompts.filter(p => p.category === 'optimize_copy');
  const analyzeAudiencePrompts = prompts.filter(p => p.category === 'analyze_audience');

  // Filtrar prompts por tipo de copy
  const basePrompt = generateCopyPrompts.find(p => p.prompt_key === 'generate_copy_base');
  const anuncioPrompts = generateCopyPrompts.filter(p => p.prompt_key === 'generate_copy_ad');
  const landingPrompts = generateCopyPrompts.filter(p => p.prompt_key === 'generate_copy_landing_page');
  const vslPrompts = generateCopyPrompts.filter(p => p.prompt_key === 'generate_copy_vsl');
  const emailPrompts = generateCopyPrompts.filter(p => p.prompt_key === 'generate_copy_email');
  const webinarPrompts = generateCopyPrompts.filter(p => p.prompt_key === 'generate_copy_webinar');
  const conteudoPrompts = generateCopyPrompts.filter(p => p.prompt_key === 'generate_copy_content');
  const mensagemPrompts = generateCopyPrompts.filter(p => p.prompt_key === 'generate_copy_message');

  const customizedCount = generateCopyPrompts.filter(
    p => p.current_prompt !== p.default_prompt
  ).length;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">Carregando prompts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-destructive mb-2">Erro ao carregar prompts</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'Erro desconhecido ao buscar prompts'}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // Debug visual
  console.log('📝 [PromptsSettings] Prompts carregados:', {
    total: prompts.length,
    generate_copy: generateCopyPrompts.length,
    optimize_copy: optimizeCopyPrompts.length,
    analyze_audience: analyzeAudiencePrompts.length,
    base: basePrompt?.name,
    anuncios: anuncioPrompts.length,
    landing: landingPrompts.length,
    vsl: vslPrompts.length,
    email: emailPrompts.length,
    webinar: webinarPrompts.length,
    conteudo: conteudoPrompts.length,
    mensagens: mensagemPrompts.length
  });

  if (prompts.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-amber-600 mb-2">Nenhum prompt encontrado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Não foram encontrados prompts no banco de dados. Verifique se você tem permissão de super_admin.
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Tabs defaultValue="prompts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <Brain size={18} />
            Prompts IA
          </TabsTrigger>
          <TabsTrigger value="characteristics" className="flex items-center gap-2">
            <Sliders size={18} />
            Características
          </TabsTrigger>
        </TabsList>

        {/* Aba de Prompts */}
        <TabsContent value="prompts" className="mt-6">
          <Tabs defaultValue="generate_copy" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="generate_copy">
                Geração de Copy ({generateCopyPrompts.length})
              </TabsTrigger>
              <TabsTrigger value="optimize_copy">
                Otimização ({optimizeCopyPrompts.length})
              </TabsTrigger>
              <TabsTrigger value="analyze_audience">
                Análise ({analyzeAudiencePrompts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate_copy" className="space-y-4 mt-6">
              {/* Estatísticas */}
              <div className="flex items-center gap-3 mb-6">
                <Badge variant="outline" className="text-sm">
                  {generateCopyPrompts.length} prompts configurados
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {customizedCount} personalizados
                </Badge>
              </div>

              {/* Sub-abas por tipo de copy */}
              <Tabs defaultValue="base" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto">
                  <TabsTrigger value="base" className="text-xs lg:text-sm">📋 Base</TabsTrigger>
                  <TabsTrigger value="anuncios" className="text-xs lg:text-sm">📢 Anúncios</TabsTrigger>
                  <TabsTrigger value="landing" className="text-xs lg:text-sm">🌐 Landing</TabsTrigger>
                  <TabsTrigger value="vsl" className="text-xs lg:text-sm">🎬 VSL</TabsTrigger>
                  <TabsTrigger value="emails" className="text-xs lg:text-sm">📧 Emails</TabsTrigger>
                  <TabsTrigger value="webinars" className="text-xs lg:text-sm">🎥 Webinars</TabsTrigger>
                  <TabsTrigger value="conteudo" className="text-xs lg:text-sm">📝 Conteúdo</TabsTrigger>
                  <TabsTrigger value="mensagens" className="text-xs lg:text-sm">💬 Mensagens</TabsTrigger>
                </TabsList>

                {/* Base Prompt */}
                <TabsContent value="base" className="mt-6">
                  <div className="mb-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm text-foreground">
                      <strong>Prompt Base:</strong> Este é o prompt fundamental usado como base para todas as gerações de copy. 
                      Modificações aqui afetarão TODOS os tipos de copy.
                    </p>
                  </div>
                  {basePrompt ? (
                    <PromptCard
                      prompt={basePrompt}
                      onEdit={handleEdit}
                      onHistory={handleHistory}
                      onRestore={handleRestore}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum prompt base configurado
                    </div>
                  )}
                </TabsContent>

                {/* Anúncios */}
                <TabsContent value="anuncios" className="mt-6">
                  <div className="grid gap-4">
                    {anuncioPrompts.length > 0 ? (
                      anuncioPrompts.map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          onEdit={handleEdit}
                          onHistory={handleHistory}
                          onRestore={handleRestore}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum prompt de anúncios configurado
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Landing Pages */}
                <TabsContent value="landing" className="mt-6">
                  <div className="grid gap-4">
                    {landingPrompts.length > 0 ? (
                      landingPrompts.map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          onEdit={handleEdit}
                          onHistory={handleHistory}
                          onRestore={handleRestore}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum prompt de landing page configurado
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* VSL */}
                <TabsContent value="vsl" className="mt-6">
                  <div className="grid gap-4">
                    {vslPrompts.length > 0 ? (
                      vslPrompts.map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          onEdit={handleEdit}
                          onHistory={handleHistory}
                          onRestore={handleRestore}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum prompt de VSL configurado
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Emails */}
                <TabsContent value="emails" className="mt-6">
                  <div className="grid gap-4">
                    {emailPrompts.length > 0 ? (
                      emailPrompts.map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          onEdit={handleEdit}
                          onHistory={handleHistory}
                          onRestore={handleRestore}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum prompt de email configurado
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Webinars */}
                <TabsContent value="webinars" className="mt-6">
                  <div className="grid gap-4">
                    {webinarPrompts.length > 0 ? (
                      webinarPrompts.map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          onEdit={handleEdit}
                          onHistory={handleHistory}
                          onRestore={handleRestore}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum prompt de webinar configurado
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Conteúdo */}
                <TabsContent value="conteudo" className="mt-6">
                  <div className="grid gap-4">
                    {conteudoPrompts.length > 0 ? (
                      conteudoPrompts.map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          onEdit={handleEdit}
                          onHistory={handleHistory}
                          onRestore={handleRestore}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum prompt de conteúdo configurado
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Mensagens */}
                <TabsContent value="mensagens" className="mt-6">
                  <div className="grid gap-4">
                    {mensagemPrompts.length > 0 ? (
                      mensagemPrompts.map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          onEdit={handleEdit}
                          onHistory={handleHistory}
                          onRestore={handleRestore}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum prompt de mensagem configurado
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="optimize_copy" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {optimizeCopyPrompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onEdit={handleEdit}
                    onHistory={handleHistory}
                    onRestore={handleRestore}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analyze_audience" className="space-y-4 mt-6">
              <div className="grid gap-4">
                {analyzeAudiencePrompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onEdit={handleEdit}
                    onHistory={handleHistory}
                    onRestore={handleRestore}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Aba de Características */}
        <TabsContent value="characteristics" className="mt-6">
          <Tabs defaultValue="objetivos" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
              <TabsTrigger value="estilos">Estilos</TabsTrigger>
              <TabsTrigger value="tamanhos">Tamanhos</TabsTrigger>
              <TabsTrigger value="preferencias">Preferências</TabsTrigger>
            </TabsList>

            <TabsContent value="objetivos" className="mt-6">
              <CharacteristicsList category="objetivos" />
            </TabsContent>

            <TabsContent value="estilos" className="mt-6">
              <CharacteristicsList category="estilos" />
            </TabsContent>

            <TabsContent value="tamanhos" className="mt-6">
              <CharacteristicsList category="tamanhos" />
            </TabsContent>

            <TabsContent value="preferencias" className="mt-6">
              <CharacteristicsList category="preferencias" />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      <PromptEditorModal
        prompt={selectedPrompt}
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSave}
      />

      <PromptHistoryModal
        prompt={selectedPrompt}
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </>
  );
};
