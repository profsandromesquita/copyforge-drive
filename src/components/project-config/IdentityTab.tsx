import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VoiceInput } from './VoiceInput';
import { IdentityCard } from './IdentityCard';
import { SECTORS, VOICE_TONES, BRAND_PERSONALITIES } from '@/types/project-config';
import { useProject } from '@/hooks/useProject';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const identitySchema = z.object({
  brand_name: z.string().min(1, 'Nome da marca é obrigatório'),
  sector: z.string().min(1, 'Setor é obrigatório'),
  central_purpose: z.string().optional(),
});

interface IdentityTabProps {
  isNew: boolean;
  onSaveSuccess?: () => void;
}

export const IdentityTab = ({ isNew, onSaveSuccess }: IdentityTabProps) => {
  const navigate = useNavigate();
  const { activeProject, createProject, refreshProjects, setActiveProject } = useProject();
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [voiceTones, setVoiceTones] = useState<string[]>([]);
  const [brandPersonality, setBrandPersonality] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      brand_name: '',
      sector: '',
      central_purpose: '',
    },
  });

  // Iniciar em modo de edição se for novo projeto ou se não houver dados essenciais
  useEffect(() => {
    if (isNew || !activeProject?.brand_name || !activeProject?.sector) {
      setIsEditing(true);
    }
  }, [isNew, activeProject]);

  useEffect(() => {
    if (activeProject && !isNew) {
      setValue('brand_name', activeProject.brand_name || '');
      setValue('sector', activeProject.sector || '');
      setValue('central_purpose', activeProject.central_purpose || '');
      setVoiceTones(activeProject.voice_tones || []);
      setBrandPersonality(activeProject.brand_personality || []);
    }
  }, [activeProject, isNew, setValue]);

  const toggleVoiceTone = (tone: string) => {
    setVoiceTones(prev =>
      prev.includes(tone) ? prev.filter(t => t !== tone) : [...prev, tone]
    );
  };

  const togglePersonality = (personality: string) => {
    setBrandPersonality(prev =>
      prev.includes(personality) ? prev.filter(p => p !== personality) : [...prev, personality]
    );
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      const updates = {
        brand_name: data.brand_name,
        sector: data.sector,
        central_purpose: data.central_purpose || null,
        voice_tones: voiceTones,
        brand_personality: brandPersonality,
      };

      if (isNew && !activeProject) {
        // Create new project with identity data
        if (!activeWorkspace?.id || !user?.id) {
          toast.error('Workspace ou usuário não encontrado');
          return;
        }

        const projectName = data.brand_name || 'Novo Projeto';
        
        const { data: projectData, error: createError } = await supabase
          .from('projects')
          .insert({
            workspace_id: activeWorkspace.id,
            name: projectName,
            created_by: user.id,
            ...updates,
          })
          .select()
          .single();

        if (createError) {
          if (createError.code === '23505') {
            toast.error('Já existe um projeto com este nome neste workspace');
          } else {
            throw createError;
          }
          return;
        }

        toast.success('Projeto criado com sucesso!');
        await refreshProjects();
        setActiveProject(projectData as any);
        setIsEditing(false);
        onSaveSuccess?.();
        navigate(`/project/${projectData.id}`);
      } else if (activeProject) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update({
            ...updates,
            name: data.brand_name, // Atualiza o name com o brand_name
          })
          .eq('id', activeProject.id);

        if (error) throw error;
        toast.success('Alterações salvas!');
        await refreshProjects();
        setIsEditing(false);
        onSaveSuccess?.();
      }
    } catch (error) {
      console.error('Error saving identity:', error);
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const sector = watch('sector');
  const brandName = watch('brand_name');
  
  // Verificar se os campos obrigatórios estão preenchidos
  const isFormValid = brandName && brandName.trim() !== '' && sector && sector.trim() !== '';

  // Modo de visualização
  if (!isEditing && activeProject && activeProject.brand_name && activeProject.sector) {
    return (
      <IdentityCard 
        project={activeProject} 
        onEdit={() => setIsEditing(true)} 
      />
    );
  }

  // Modo de edição
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="bg-card border border-border rounded-xl p-4 md:p-6 space-y-6 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Identidade do Projeto
          </h2>
        </div>

        {/* Nome da Marca */}
        <div className="space-y-2 group">
          <Label htmlFor="brand_name" className="text-sm font-medium flex items-center gap-1">
            Nome da marca/projeto 
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="brand_name"
            {...register('brand_name')}
            placeholder="Projeto Digital"
            className="transition-all focus:ring-2 focus:ring-primary/20"
          />
          {errors.brand_name && (
            <p className="text-sm text-destructive animate-fade-in">{errors.brand_name.message}</p>
          )}
        </div>

        {/* Setor */}
        <div className="space-y-2">
          <Label htmlFor="sector" className="text-sm font-medium flex items-center gap-1">
            Setor de atuação 
            <span className="text-destructive">*</span>
          </Label>
          <Select value={sector} onValueChange={(value) => setValue('sector', value)}>
            <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
              <SelectValue placeholder="Selecione um setor" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {SECTORS.map((sector) => (
                <SelectItem key={sector} value={sector} className="cursor-pointer">
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.sector && (
            <p className="text-sm text-destructive animate-fade-in">{errors.sector.message}</p>
          )}
        </div>

        {/* Propósito Central */}
        <div className="space-y-2">
          <Label htmlFor="central_purpose" className="text-sm font-medium">
            Propósito central
            <span className="text-muted-foreground ml-1 text-xs">(opcional)</span>
          </Label>
          <div className="relative">
            <Textarea
              id="central_purpose"
              {...register('central_purpose')}
              placeholder="Qual é o propósito da sua marca?"
              rows={3}
              className="pr-12 resize-none transition-all focus:ring-2 focus:ring-primary/20"
            />
            <VoiceInput
              onTranscript={(text) => {
                const currentValue = watch('central_purpose') || '';
                setValue('central_purpose', currentValue ? `${currentValue} ${text}` : text);
              }}
            />
          </div>
        </div>

        {/* Tom de Voz */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Tom de voz da comunicação
            <span className="text-muted-foreground ml-1 text-xs">(opcional)</span>
          </Label>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {VOICE_TONES.map((tone) => (
              <label
                key={tone}
                htmlFor={`tone-${tone}`}
                className={cn(
                  "flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/50",
                  voiceTones.includes(tone) 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-border bg-background"
                )}
              >
                <Checkbox
                  id={`tone-${tone}`}
                  checked={voiceTones.includes(tone)}
                  onCheckedChange={() => toggleVoiceTone(tone)}
                  className="pointer-events-none flex-shrink-0"
                />
                <span className="text-xs md:text-sm font-medium leading-tight">{tone}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Personalidade da Marca */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Personalidade da marca
            <span className="text-muted-foreground ml-1 text-xs">(opcional)</span>
          </Label>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {BRAND_PERSONALITIES.map((personality) => (
              <label
                key={personality}
                htmlFor={`personality-${personality}`}
                className={cn(
                  "flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/50",
                  brandPersonality.includes(personality)
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-background"
                )}
              >
                <Checkbox
                  id={`personality-${personality}`}
                  checked={brandPersonality.includes(personality)}
                  onCheckedChange={() => togglePersonality(personality)}
                  className="pointer-events-none flex-shrink-0"
                />
                <span className="text-xs md:text-sm font-medium leading-tight">{personality}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={cn(
          "flex gap-2 pt-4",
          isMobile && "hidden"
        )}>
          <Button 
            type="submit" 
            disabled={saving || !isFormValid}
            className="min-w-[140px] shadow-sm"
          >
            {saving ? 'Salvando...' : isNew ? 'Criar Projeto' : 'Salvar Identidade'}
          </Button>
          {!isNew && (
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
          )}
        </div>
      </div>
      
      {/* Botão fixo no rodapé mobile */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg animate-slide-in-bottom z-50">
          <Button 
            type="submit" 
            disabled={saving || !isFormValid}
            className="w-full h-12 text-base font-medium shadow-md"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Salvando...
              </span>
            ) : (
              isNew ? 'Criar Projeto' : 'Salvar Identidade'
            )}
          </Button>
        </div>
      )}
    </form>
  );
};
