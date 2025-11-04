import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X } from "phosphor-react";

export const WorkspaceGeneral = () => {
  const { activeWorkspace, refreshWorkspaces } = useWorkspace();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeWorkspace) {
      setName(activeWorkspace.name);
      setAvatarUrl(activeWorkspace.avatar_url || null);
    }
  }, [activeWorkspace]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 2MB");
        return;
      }
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarUrl(null);
  };

  const uploadAvatar = async () => {
    if (!activeWorkspace || !avatarFile) return null;

    setUploading(true);
    try {
      // Delete old avatar if exists
      if (activeWorkspace.avatar_url) {
        const oldPath = activeWorkspace.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('workspace-avatars')
            .remove([`${activeWorkspace.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${activeWorkspace.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('workspace-avatars')
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('workspace-avatars')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error("Erro ao fazer upload do avatar");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!activeWorkspace) return;

    setSaving(true);
    
    let finalAvatarUrl = avatarUrl;
    
    // Upload avatar if changed
    if (avatarFile) {
      const uploadedUrl = await uploadAvatar();
      if (uploadedUrl) {
        finalAvatarUrl = uploadedUrl;
      }
    }

    const { error } = await supabase
      .from('workspaces')
      .update({ 
        name,
        avatar_url: finalAvatarUrl 
      })
      .eq('id', activeWorkspace.id);

    if (error) {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    } else {
      toast.success("Configurações salvas com sucesso");
      setAvatarFile(null);
      refreshWorkspaces();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-2">Configurações Gerais</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie as informações básicas do seu workspace
        </p>
      </div>

      <div className="space-y-6">
        {/* Avatar Upload */}
        <div className="space-y-3">
          <Label>Avatar do Workspace</Label>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-2xl">
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload size={16} className="mr-2" />
                {avatarUrl ? 'Alterar' : 'Upload'}
              </Button>
              
              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={uploading}
                >
                  <X size={16} className="mr-2" />
                  Remover
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Recomendado: Imagem quadrada de no máximo 2MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* Workspace Name */}
        <div className="space-y-2">
          <Label htmlFor="workspace-name">Nome do Workspace</Label>
          <Input
            id="workspace-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do workspace"
          />
        </div>

        <Button onClick={handleSave} disabled={saving || uploading}>
          {saving || uploading ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
};
