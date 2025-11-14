import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProject } from '@/hooks/useProject';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Methodology } from '@/types/project-config';
import { FieldWithTooltip } from './FieldWithTooltip';
import { MethodologyCard } from './MethodologyCard';
import { Lightbulb } from 'phosphor-react';

const methodologySchema = z.object({
  tese_central: z.string()
    .trim()
    .min(10, 'A tese central deve ter pelo menos 10 caracteres')
    .max(1000, 'A tese central deve ter no máximo 1000 caracteres'),
  mecanismo_primario: z.string()
    .trim()
    .min(10, 'O mecanismo primário deve ter pelo menos 10 caracteres')
    .max(1000, 'O mecanismo primário deve ter no máximo 1000 caracteres'),
  por_que_funciona: z.string()
    .trim()
    .min(10, 'A explicação deve ter pelo menos 10 caracteres')
    .max(1000, 'A explicação deve ter no máximo 1000 caracteres'),
  erro_invisivel: z.string()
    .trim()
    .min(10, 'O erro invisível deve ter pelo menos 10 caracteres')
    .max(1000, 'O erro invisível deve ter no máximo 1000 caracteres'),
  diferenciacao: z.string()
    .trim()
    .min(10, 'A diferenciação deve ter pelo menos 10 caracteres')
    .max(1000, 'A diferenciação deve ter no máximo 1000 caracteres'),
  principios_fundamentos: z.string()
    .trim()
    .min(10, 'Os princípios devem ter pelo menos 10 caracteres')
    .max(1000, 'Os princípios devem ter no máximo 1000 caracteres'),
  etapas_metodo: z.string()
    .trim()
    .min(10, 'As etapas devem ter pelo menos 10 caracteres')
    .max(2000, 'As etapas devem ter no máximo 2000 caracteres'),
  transformacao_real: z.string()
    .trim()
    .min(10, 'A transformação deve ter pelo menos 10 caracteres')
    .max(1000, 'A transformação deve ter no máximo 1000 caracteres'),
  prova_funcionamento: z.string()
    .trim()
    .min(10, 'A prova deve ter pelo menos 10 caracteres')
    .max(1000, 'A prova deve ter no máximo 1000 caracteres'),
});

type MethodologyFormData = z.infer<typeof methodologySchema>;

const fields = [
  {
    name: 'tese_central',
    label: 'Tese Central',
    placeholder: 'Ex: Você não engorda porque come muito, mas porque seu corpo perdeu sensibilidade à saciedade.',
    tooltip: "A ideia-mãe do seu método. A frase que explica 'o porquê' da transformação acontecer. Ex: 'Você não engorda porque come muito, mas porque seu corpo perdeu sensibilidade à saciedade.'"
  },
  {
    name: 'mecanismo_primario',
    label: 'Mecanismo Primário',
    placeholder: 'Ex: Reprogramação de padrões, Ajuste hormonal...',
    tooltip: 'O motor interno da sua solução. Como a mudança realmente acontece. Ex: Reprogramação de padrões, Ajuste hormonal, Treinamento neurocomportamental.'
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
    tooltip: "O erro que mantém a pessoa presa no problema e que ela não percebe. Ex: 'Você não vende pouco por falta de estratégia, mas por excesso de ruído mental.'"
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
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MethodologyFormData>({
    resolver: zodResolver(methodologySchema),
  });

  useEffect(() => {
    if (activeProject?.methodology) {
      reset(activeProject.methodology);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }, [activeProject?.methodology, reset]);

  const onSubmit = async (data: MethodologyFormData) => {
    if (!activeProject?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ methodology: data })
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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (activeProject?.methodology) {
      reset(activeProject.methodology);
      setIsEditing(false);
    }
  };

  if (!isEditing && activeProject?.methodology) {
    return (
      <MethodologyCard
        methodology={activeProject.methodology}
        onEdit={handleEdit}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Metodologia do Projeto</CardTitle>
        <CardDescription className="flex items-start gap-2 pt-2">
          <Lightbulb size={20} className="text-primary mt-0.5 flex-shrink-0" />
          <span>
            Defina a metodologia completa do seu projeto: tese central, mecanismo, diferenciação e evidências de funcionamento.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {fields.map((field) => (
            <FieldWithTooltip
              key={field.name}
              label={field.label}
              name={field.name}
              placeholder={field.placeholder}
              tooltip={field.tooltip}
              type="textarea"
              register={register}
              error={errors[field.name as keyof typeof errors] as any}
            />
          ))}

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving} className="flex-1 sm:flex-none">
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
        </form>
      </CardContent>
    </Card>
  );
};
