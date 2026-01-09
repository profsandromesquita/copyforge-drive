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
import { DeleteProjectDialog, ProjectDeletionImpact } from './DeleteProjectDialog';
import { SECTORS, VOICE_TONES, BRAND_PERSONALITIES } from '@/types/project-config';
import { useProject } from '@/hooks/useProject';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Trash } from 'lucide-react';

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
  const { activeProject, createProject, refreshProjects, setActiveProject, deleteProject, projects } = useProject();
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [brandPersonality, setBrandPersonality] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionImpact, setDeletionImpact] = useState<ProjectDeletionImpact>({
    totalCopies: 0,
    totalFolders: 0,
    publicCopies: 0,
    templates: 0,
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      brand_name: activeProject?.brand_name || activeProject?.name || '',
      sector: activeProject?.sector || '',
      central_purpose: activeProject?.central_purpose || '',
    },
  });

  // Iniciar em modo de edição se for novo projeto ou se não houver dados essenciais
  useEffect(() => {
    const hasBrandName = activeProject?.brand_name || activeProject?.name;
    if (isNew || !hasBrandName || !activeProject?.sector) {
      setIsEditing(true);
    } else {
      // Se tem projeto completo, mostrar o card
      setIsEditing(false);
    }
  }, [isNew, activeProject?.brand_name, activeProject?.name, activeProject?.sector]);

  // Sincronizar formulário quando activeProject mudar
  useEffect(() => {
    if (activeProject && !isNew) {
      reset({
        brand_name: activeProject.brand_name || activeProject.name || '',
        sector: activeProject.sector || '',
        central_purpose: activeProject.central_purpose || '',
      });
      setBrandPersonality(activeProject.brand_personality || []);
    }
  }, [activeProject?.id, isNew, reset]);

  // Garantir população dos campos quando componente monta com projeto existente
  useEffect(() => {
    if (!isNew && activeProject) {
      reset({
        brand_name: activeProject.brand_name || activeProject.name || '',
        sector: activeProject.sector || '',
        central_purpose: activeProject.central_purpose || '',
      });
      setBrandPersonality(activeProject.brand_personality || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePersonality = (personality: string) => {
    setBrandPersonality(prev =>
      prev.includes(personality) ? prev.filter(p => p !== personality) : [...prev, personality]
    );
  };

  const onSubmit = async (data: any) => {
    console.log('🚀 [IdentityTab] onSubmit iniciado', { isNew, hasActiveProject: !!activeProject, data });
    setSaving(true);
    try {
      const updates = {
        brand_name: data.brand_name,
        sector: data.sector,
        central_purpose: data.central_purpose || null,
        brand_personality: brandPersonality,
      };

      if (isNew) {
        console.log('📝 [IdentityTab] Modo criação de projeto novo');
        // Create new project with identity data
        if (!activeWorkspace?.id || !user?.id) {
          console.error('❌ [IdentityTab] Workspace ou usuário não encontrado', { workspaceId: activeWorkspace?.id, userId: user?.id });
          toast.error('Workspace ou usuário não encontrado');
          return;
        }

        const projectName = data.brand_name || 'Novo Projeto';
        
        // Verificar se já existe projeto com mesmo nome no workspace
        const { data: existingProjects, error: checkError } = await supabase
          .from('projects')
          .select('id, name')
          .eq('workspace_id', activeWorkspace.id)
          .eq('name', projectName);

        if (checkError) {
          console.error('Error checking existing projects:', checkError);
          throw checkError;
        }

        if (existingProjects && existingProjects.length > 0) {
          toast.error('Já existe um projeto com este nome neste workspace');
          setSaving(false);
          return;
        }
        
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
          console.error('❌ [IdentityTab] Erro ao criar projeto:', createError);
          throw createError;
        }

        console.log('✅ [IdentityTab] Projeto criado com sucesso:', projectData);
        toast.success('Projeto criado com sucesso!');
        await refreshProjects();
        setActiveProject(projectData as any);
        setIsEditing(false);
        
        // Navega para página do projeto recém-criado
        console.log('🔄 [IdentityTab] Navegando para:', `/project/${projectData.id}`);
        navigate(`/project/${projectData.id}`, { replace: true });
        
        // Avança para próxima aba após navegação
        setTimeout(() => {
          console.log('➡️ [IdentityTab] Chamando onSaveSuccess');
          onSaveSuccess?.();
        }, 100);
      } else if (activeProject) {
        // Update existing project
        
        // Verificar se está tentando usar um nome que já existe em outro projeto do mesmo workspace
        const { data: existingProjects, error: checkError } = await supabase
          .from('projects')
          .select('id, name')
          .eq('workspace_id', activeProject.workspace_id)
          .eq('name', data.brand_name)
          .neq('id', activeProject.id);

        if (checkError) {
          console.error('Error checking existing projects:', checkError);
          throw checkError;
        }

        if (existingProjects && existingProjects.length > 0) {
          toast.error('Já existe outro projeto com este nome neste workspace');
          setSaving(false);
          return;
        }

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

  // Buscar impacto da deleção antes de abrir o modal
  const fetchDeletionImpact = async () => {
    if (!activeProject?.id) return;
    
    try {
      const [copiesResult, foldersResult] = await Promise.all([
        supabase
          .from('copies')
          .select('id, is_public, is_template')
          .eq('project_id', activeProject.id),
        supabase
          .from('folders')
          .select('id')
          .eq('project_id', activeProject.id),
      ]);

      const copies = copiesResult.data || [];
      const folders = foldersResult.data || [];

      setDeletionImpact({
        totalCopies: copies.length,
        totalFolders: folders.length,
        publicCopies: copies.filter(c => c.is_public).length,
        templates: copies.filter(c => c.is_template).length,
      });

      setShowDeleteDialog(true);
    } catch (error) {
      console.error('Error fetching deletion impact:', error);
      toast.error('Erro ao verificar dados do projeto');
    }
  };

  const handleDeleteProject = async () => {
    if (!activeProject?.id) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteProject(activeProject.id);
      
      if (success) {
        setShowDeleteDialog(false);
        // Se não houver mais projetos, redirecionar para o drive
        if (projects.length <= 1) {
          navigate('/drive');
        }
        // Se houver outros projetos, permanece na página (já selecionou outro automaticamente)
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Modo de visualização
  if (!isEditing && activeProject && (activeProject.brand_name || activeProject.name) && activeProject.sector) {
    return (
      <div className="space-y-6">
        <IdentityCard 
          project={activeProject} 
          onEdit={() => setIsEditing(true)} 
        />

        {/* Danger Zone - Card Minimalista */}
        <div className="rounded-lg border border-destructive/50 bg-card p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-destructive">Zona de Perigo</h3>
              <p className="text-sm text-muted-foreground">
                A exclusão do projeto é permanente e irá remover todas as copies, pastas e configurações associadas.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={fetchDeletionImpact}
              className="shrink-0"
            >
              <Trash className="h-4 w-4 mr-2" />
              Excluir Projeto
            </Button>
          </div>
        </div>

        {/* Delete Project Dialog */}
        <DeleteProjectDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          projectName={activeProject?.brand_name || activeProject?.name || ''}
          impact={deletionImpact}
          onConfirm={handleDeleteProject}
          isDeleting={isDeleting}
        />
      </div>
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
            placeholder="Ex: Método EmagreceVida"
            className="placeholder:text-xs"
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
            <SelectTrigger>
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
              placeholder="Ex: Ajudar pessoas acima do peso a emagrecer de forma saudável e definitiva"
              rows={2}
              className="pr-12 resize-none placeholder:text-xs"
            />
            <VoiceInput
              onTranscript={(text) => {
                const currentValue = watch('central_purpose') || '';
                setValue('central_purpose', currentValue ? `${currentValue} ${text}` : text);
              }}
            />
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

      {/* Danger Zone - Card Minimalista (apenas para projetos existentes) */}
      {!isNew && activeProject && (
        <div className="rounded-lg border border-destructive/50 bg-card p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-destructive">Zona de Perigo</h3>
              <p className="text-sm text-muted-foreground">
                A exclusão do projeto é permanente e irá remover todas as copies, pastas e configurações associadas.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={fetchDeletionImpact}
              className="shrink-0"
            >
              <Trash className="h-4 w-4 mr-2" />
              Excluir Projeto
            </Button>
          </div>
        </div>
      )}

      {/* Delete Project Dialog */}
      <DeleteProjectDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        projectName={activeProject?.brand_name || activeProject?.name || ''}
        impact={deletionImpact}
        onConfirm={handleDeleteProject}
        isDeleting={isDeleting}
      />
    </form>
  );
};
