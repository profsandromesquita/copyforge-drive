import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Upload, X, User } from "phosphor-react";

export const ProfileGeneral = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, email, avatar_url")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setName(data.name || "");
        setEmail(data.email || "");
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Erro ao carregar perfil",
        description: "Não foi possível carregar suas informações",
        variant: "destructive",
      });
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O avatar deve ter no máximo 2MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Use apenas arquivos JPG, PNG ou WEBP",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarUrl(null);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return avatarUrl;

    setUploading(true);
    try {
      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split("/").pop();
        if (oldPath) {
          await supabase.storage
            .from("user-avatars")
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("user-avatars")
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("user-avatars").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Erro ao fazer upload",
        description: "Não foi possível fazer upload do avatar",
        variant: "destructive",
      });
      return avatarUrl;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Upload avatar if changed
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar();
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          avatar_url: newAvatarUrl,
        })
        .eq("id", user.id);

      if (error) throw error;

      setAvatarUrl(newAvatarUrl);
      setAvatarFile(null);

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso",
      });

      // Reload page to update avatar everywhere
      window.location.reload();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar suas informações",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getAvatarPreview = () => {
    if (avatarFile) {
      return URL.createObjectURL(avatarFile);
    }
    return avatarUrl;
  };

  const getInitials = () => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Informações Gerais</h3>
        <p className="text-sm text-muted-foreground">
          Atualize suas informações pessoais
        </p>
      </div>

      <div className="space-y-6">
        {/* Avatar Section */}
        <div className="space-y-2">
          <Label>Foto de Perfil</Label>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={getAvatarPreview() || undefined} />
              <AvatarFallback className="text-lg">
                {getInitials()}
              </AvatarFallback>
            </Avatar>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("avatar-upload")?.click()}
                disabled={uploading || saving}
              >
                <Upload size={16} className="mr-2" />
                {avatarFile ? "Alterar" : "Upload"}
              </Button>

              {(avatarFile || avatarUrl) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={uploading || saving}
                >
                  <X size={16} className="mr-2" />
                  Remover
                </Button>
              )}

              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            JPG, PNG ou WEBP. Máximo 2MB.
          </p>
        </div>

        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            disabled={saving}
          />
        </div>

        {/* Email Field (Read-only) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={email}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            O email não pode ser alterado por questões de segurança
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={saving || uploading || !name.trim()}
        >
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
};
