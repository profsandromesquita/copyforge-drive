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
  framework: z.string().min(1, 'Framework é obrigatório'),
  step1_name: z.string().min(1, 'Nome do passo 1 é obrigatório'),
  step1_description: z.string().min(1, 'Descrição do passo 1 é obrigatória'),
  step2_name: z.string().min(1, 'Nome do passo 2 é obrigatório'),
  step2_description: z.string().min(1, 'Descrição do passo 2 é obrigatória'),
  step3_name: z.string().min(1, 'Nome do passo 3 é obrigatório'),
  step3_description: z.string().min(1, 'Descrição do passo 3 é obrigatória'),
  step4_name: z.string().min(1, 'Nome do passo 4 é obrigatório'),
  step4_description: z.string().min(1, 'Descrição do passo 4 é obrigatória'),
});

type MethodologyFormData = z.infer<typeof methodologySchema>;

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
            Defina o framework estratégico que você segue e descreva os 4 passos principais da sua metodologia de trabalho.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FieldWithTooltip
            label="Framework Estratégico"
            name="framework"
            placeholder="Ex: Identidade > Audiência > Oferta > Copy"
            tooltip="O modelo estratégico que você segue para criar suas copies"
            type="input"
            register={register}
            error={errors.framework}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                <h3 className="font-medium text-sm text-muted-foreground">Passo {step}</h3>
                
                <FieldWithTooltip
                  label="Nome do Passo"
                  name={`step${step}_name`}
                  placeholder={`Ex: ${step === 1 ? 'Identidade' : step === 2 ? 'Audiência' : step === 3 ? 'Oferta' : 'Copy'}`}
                  tooltip={`Nome da ${step === 1 ? 'primeira' : step === 2 ? 'segunda' : step === 3 ? 'terceira' : 'quarta'} etapa da sua metodologia`}
                  type="input"
                  register={register}
                  error={errors[`step${step}_name` as keyof typeof errors] as any}
                />

                <FieldWithTooltip
                  label="Descrição"
                  name={`step${step}_description`}
                  placeholder="Descreva o que acontece nesta etapa..."
                  tooltip={`Descrição detalhada da ${step === 1 ? 'primeira' : step === 2 ? 'segunda' : step === 3 ? 'terceira' : 'quarta'} etapa`}
                  type="textarea"
                  register={register}
                  error={errors[`step${step}_description` as keyof typeof errors] as any}
                />
              </div>
            ))}
          </div>

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
