import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PromptCard } from "@/components/admin/ai-prompts/PromptCard";
import { PromptEditorModal } from "@/components/admin/ai-prompts/PromptEditorModal";
import { PromptHistoryModal } from "@/components/admin/ai-prompts/PromptHistoryModal";
import { CharacteristicsList } from "@/components/admin/ai-characteristics/CharacteristicsList";
import { useAIPrompts } from "@/hooks/useAIPrompts";
import { AIPromptTemplate } from "@/types/ai-prompts";
import { Brain, Sliders } from "phosphor-react";

const AdminAIPrompts = () => {
  const { prompts, isLoading, updatePrompt, restoreDefault } = useAIPrompts();
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Brain size={32} weight="duotone" className="text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Prompts IA</h1>
            <p className="text-muted-foreground">
              Gerencie e personalize os prompts dos modelos de IA para melhorar a qualidade das entregas
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Carregando prompts...</p>
          </div>
        ) : (
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
                  <div className="grid gap-4">
                    {generateCopyPrompts.map((prompt) => (
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
        )}
      </div>

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
    </AdminLayout>
  );
};

export default AdminAIPrompts;
