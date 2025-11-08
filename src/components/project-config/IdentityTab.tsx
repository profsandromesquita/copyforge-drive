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
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'phosphor-react';
import { VoiceInput } from './VoiceInput';
import { IdentityCard } from './IdentityCard';
import { SECTORS, VOICE_TONES, BRAND_PERSONALITIES } from '@/types/project-config';
import { useProject } from '@/hooks/useProject';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const identitySchema = z.object({
  brand_name: z.string().min(1, 'Nome da marca é obrigatório'),
  sector: z.string().min(1, 'Setor é obrigatório'),
  central_purpose: z.string().optional(),
});

interface IdentityTabProps {
  isNew: boolean;
}

export const IdentityTab = ({ isNew }: IdentityTabProps) => {
  const navigate = useNavigate();
  const { activeProject, createProject, refreshProjects, setActiveProject } = useProject();
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [voiceTones, setVoiceTones] = useState<string[]>([]);
  const [brandPersonality, setBrandPersonality] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
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
      setKeywords(activeProject.keywords || []);
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

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
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
        keywords: keywords,
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
      }
    } catch (error) {
      console.error('Error saving identity:', error);
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const sector = watch('sector');

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-xl font-bold">Identidade da Marca</h2>

        {/* Nome da Marca */}
        <div className="space-y-2">
          <Label htmlFor="brand_name">Nome da marca/projeto *</Label>
          <Input
            id="brand_name"
            {...register('brand_name')}
            placeholder="Ex: Acme Corp"
          />
          {errors.brand_name && (
            <p className="text-sm text-destructive">{errors.brand_name.message}</p>
          )}
        </div>

        {/* Setor */}
        <div className="space-y-2">
          <Label htmlFor="sector">Setor de atuação *</Label>
          <Select value={sector} onValueChange={(value) => setValue('sector', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um setor" />
            </SelectTrigger>
            <SelectContent>
              {SECTORS.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.sector && (
            <p className="text-sm text-destructive">{errors.sector.message}</p>
          )}
        </div>

        {/* Propósito Central */}
        <div className="space-y-2">
          <Label htmlFor="central_purpose">Propósito central</Label>
          <div className="relative">
            <Textarea
              id="central_purpose"
              {...register('central_purpose')}
              placeholder="Qual é o propósito da sua marca?"
              rows={3}
              className="pr-12"
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
          <Label>Tom de voz da comunicação</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {VOICE_TONES.map((tone) => (
              <div key={tone} className="flex items-center space-x-2">
                <Checkbox
                  id={`tone-${tone}`}
                  checked={voiceTones.includes(tone)}
                  onCheckedChange={() => toggleVoiceTone(tone)}
                />
                <label
                  htmlFor={`tone-${tone}`}
                  className="text-sm cursor-pointer"
                >
                  {tone}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Personalidade da Marca */}
        <div className="space-y-3">
          <Label>Personalidade da marca</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {BRAND_PERSONALITIES.map((personality) => (
              <div key={personality} className="flex items-center space-x-2">
                <Checkbox
                  id={`personality-${personality}`}
                  checked={brandPersonality.includes(personality)}
                  onCheckedChange={() => togglePersonality(personality)}
                />
                <label
                  htmlFor={`personality-${personality}`}
                  className="text-sm cursor-pointer"
                >
                  {personality}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Palavras-chave */}
        <div className="space-y-3">
          <Label>Palavras-chave da marca (opcional)</Label>
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Digite uma palavra-chave"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addKeyword();
                }
              }}
            />
            <Button type="button" size="icon" onClick={addKeyword}>
              <Plus size={20} />
            </Button>
          </div>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="pl-3 pr-2">
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : isNew ? 'Criar Projeto' : 'Salvar Identidade'}
          </Button>
          {!isNew && (
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};
