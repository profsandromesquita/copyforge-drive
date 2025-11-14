import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProject } from '@/hooks/useProject';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Methodology } from '@/types/project-config';
import { VoiceInput } from './VoiceInput';
import { PencilSimple, Lightbulb, Info } from 'phosphor-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const fields = [
  {
    name: 'tese_central',
    label: 'Tese Central',
    placeholder: 'Ex: Você não engorda porque come muito, mas porque seu corpo perdeu sensibilidade à saciedade.',
    tooltip: "A ideia-mãe do seu método. A frase que explica 'o porquê' da transformação acontecer."
  },
  {
    name: 'mecanismo_primario',
    label: 'Mecanismo Primário',
    placeholder: 'Ex: Reprogramação de padrões, Ajuste hormonal...',
    tooltip: 'O motor interno da sua solução. Como a mudança realmente acontece.'
  },
  {
    name: 'por_que_funciona',
    label: 'Por que Funciona',
    placeholder: 'Explique tecnicamente de forma simples...',
    tooltip: 'A explicação técnica de forma simples. O que acontece no corpo, mente, comportamento, negócio ou processo para gerar a transformação.'
  },
  {
    name: 'erro_invisivel',
    label: 'Erro Invisível',
    placeholder: 'Ex: Você não vende pouco por falta de estratégia, mas por excesso de ruído mental.',
    tooltip: "O erro que mantém a pessoa presa no problema e que ela não percebe."
  },
  {
    name: 'diferenciacao',
    label: 'Diferenciação',
    placeholder: 'Por que seu método funciona quando outros falham?',
    tooltip: 'Por que seu método funciona quando outros falham? Qual variável você enxerga que os outros ignoram? Qual é sua alavanca única?'
  },
  {
    name: 'principios_fundamentos',
    label: 'Princípios/Fundamentos',
    placeholder: 'Base científica ou teórica do método...',
    tooltip: 'Base científica ou teórica do método: neurociência, psicologia, biologia, frameworks próprios, experiência clínica, análise de dados, etc.'
  },
  {
    name: 'etapas_metodo',
    label: 'Etapas do Método',
    placeholder: 'Descreva o processo claro com etapas e sequência...',
    tooltip: 'Processo claro com etapas, sequência e por que a ordem importa. O que acontece em cada fase da transformação.'
  },
  {
    name: 'transformacao_real',
    label: 'Transformação Real',
    placeholder: 'Descreva o antes e depois verdadeiro...',
    tooltip: 'O antes e depois verdadeiro: mental, emocional, técnico, financeiro, comportamental, relacional, físico ou operacional.'
  },
  {
    name: 'prova_funcionamento',
    label: 'Prova de Funcionamento',
    placeholder: 'Evidências que comprovam a eficácia...',
    tooltip: 'Evidências: princípios científicos, experiência prévia, validação psicológica, lógica operacional, estudos, testes iniciais, exemplos práticos.'
  },
] as const;

export const MethodologyTab = () => {
  const { activeProject, refreshProjects } = useProject();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Methodology>>({
    tese_central: '',
    mecanismo_primario: '',
    por_que_funciona: '',
    erro_invisivel: '',
    diferenciacao: '',
    principios_fundamentos: '',
    etapas_metodo: '',
    transformacao_real: '',
    prova_funcionamento: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeProject?.methodology) {
      setFormData(activeProject.methodology);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }, [activeProject?.methodology]);

  const handleSave = async () => {
    if (!activeProject?.id) return;

    // Validar campos obrigatórios
    const hasEmptyFields = fields.some(field => {
      const value = formData[field.name as keyof Methodology];
      return !value || value.trim().length < 10;
    });

    if (hasEmptyFields) {
      toast.error('Preencha todos os campos com pelo menos 10 caracteres');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ methodology: formData })
        .eq('id', activeProject.id);

      if (error) throw error;

      await refreshProjects();
      toast.success('Metodologia salva com sucesso!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving methodology:', error);
      toast.error('Erro ao salvar metodologia');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (activeProject?.methodology) {
      setFormData(activeProject.methodology);
      setIsEditing(false);
    }
  };

  // View mode - Card visual
  if (!isEditing && activeProject?.methodology) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Metodologia</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Metodologia completa do seu projeto
            </p>
          </div>
          <Button onClick={() => setIsEditing(true)} variant="outline">
            <PencilSimple size={20} className="mr-2" />
            Editar Metodologia
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            {fields.map((field) => {
              const value = formData[field.name as keyof Methodology];
              
              return (
                <div key={field.name} className="space-y-2 pb-4 border-b border-border last:border-0 last:pb-0">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {field.label}
                  </h3>
                  <p className="text-base whitespace-pre-wrap">{value}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Edit mode - Form
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">
            {activeProject?.methodology ? 'Editar Metodologia' : 'Criar Metodologia'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Defina a metodologia completa do seu projeto
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb size={24} className="text-primary" />
            Metodologia do Projeto
          </CardTitle>
          <CardDescription>
            Defina tese central, mecanismo, diferenciação e evidências de funcionamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={field.name} className="text-sm font-medium">
                  {field.label}
                </Label>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger type="button" asChild>
                      <button type="button" className="inline-flex">
                        <Info size={16} className="text-muted-foreground cursor-help" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-sm">
                      <p className="text-sm whitespace-pre-wrap">{field.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="relative">
                <Textarea
                  id={field.name}
                  value={formData[field.name as keyof Methodology] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  placeholder={field.placeholder}
                  className="min-h-[100px] resize-none pr-12 placeholder:text-xs"
                  rows={field.name === 'etapas_metodo' ? 6 : 4}
                />
                <VoiceInput
                  onTranscript={(text) => {
                    const currentValue = formData[field.name as keyof Methodology] || '';
                    setFormData({
                      ...formData,
                      [field.name]: currentValue ? `${currentValue} ${text}` : text
                    });
                  }}
                />
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none">
              {saving ? 'Salvando...' : 'Salvar Metodologia'}
            </Button>
            {activeProject?.methodology && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
