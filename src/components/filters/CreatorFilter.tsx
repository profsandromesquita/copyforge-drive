import { User } from "phosphor-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";

interface WorkspaceMember {
  user_id: string;
  profile: {
    name: string;
    avatar_url?: string;
  };
}

interface CreatorFilterProps {
  selectedCreator: string | null;
  onCreatorChange: (creatorId: string | null) => void;
}

export const CreatorFilter = ({ selectedCreator, onCreatorChange }: CreatorFilterProps) => {
  const { activeWorkspace } = useWorkspace();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!activeWorkspace?.id) return;

      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          user_id,
          profile:profiles!user_id (
            name,
            avatar_url
          )
        `)
        .eq('workspace_id', activeWorkspace.id);

      if (!error && data) {
        setMembers(data as any);
      }
      setLoading(false);
    };

    fetchMembers();
  }, [activeWorkspace?.id]);

  const selectedMember = members.find(m => m.user_id === selectedCreator);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 bg-background">
          <User size={16} weight="bold" />
          Criador
          {selectedCreator && selectedMember && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {selectedMember.profile.name}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-background">
        <DropdownMenuItem
          onClick={() => onCreatorChange(null)}
          className={!selectedCreator ? 'bg-accent' : ''}
        >
          Todos os criadores
        </DropdownMenuItem>
        {loading ? (
          <DropdownMenuItem disabled>Carregando...</DropdownMenuItem>
        ) : (
          members.map((member) => (
            <DropdownMenuItem
              key={member.user_id}
              onClick={() => onCreatorChange(member.user_id)}
              className={selectedCreator === member.user_id ? 'bg-accent' : ''}
            >
              <Avatar className="h-5 w-5 mr-2">
                <AvatarImage src={member.profile.avatar_url} />
                <AvatarFallback className="text-xs">
                  {member.profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {member.profile.name}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
