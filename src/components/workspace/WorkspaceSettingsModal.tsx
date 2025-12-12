import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkspaceGeneral } from "./settings/WorkspaceGeneral";
import { WorkspaceUsers } from "./settings/WorkspaceUsers";
import { WorkspaceBilling } from "./settings/WorkspaceBilling";
import { WorkspaceCreditsTab } from "./settings/WorkspaceCreditsTab";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WorkspaceSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
}

export const WorkspaceSettingsModal = ({ open, onOpenChange, defaultTab = "general" }: WorkspaceSettingsModalProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();

  // Fetch user role in workspace
  const { data: memberRole } = useQuery({
    queryKey: ['workspace-member-role', activeWorkspace?.id, user?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id || !user?.id) return null;
      const { data } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', activeWorkspace.id)
        .eq('user_id', user.id)
        .single();
      return data?.role as 'owner' | 'admin' | 'member' | null;
    },
    enabled: !!activeWorkspace?.id && !!user?.id,
  });

  const isAdmin = memberRole === 'owner' || memberRole === 'admin';
  
  // Update activeTab when defaultTab changes
  useEffect(() => {
    if (open) {
      // If non-admin trying to access restricted tabs, redirect to general
      if (!isAdmin && (defaultTab === 'credits' || defaultTab === 'billing')) {
        setActiveTab('general');
      } else {
        setActiveTab(defaultTab);
      }
    }
  }, [open, defaultTab, isAdmin]);

  // Handle close with navigation logic
  const handleClose = (newOpen: boolean) => {
    // If trying to close and not on general tab, go back to general instead
    if (!newOpen && activeTab !== "general") {
      setActiveTab("general");
    } else {
      // Otherwise close the modal
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0 flex flex-col">
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-48 border-r border-border bg-muted/30 p-4 overflow-y-auto">
            <h2 className="text-base font-bold mb-4">Configurações</h2>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("general")}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeTab === "general"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                Geral
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeTab === "users"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                Usuários
              </button>
              {/* Tabs restritas apenas para admins/owners */}
              {isAdmin && (
                <>
                  <button
                    onClick={() => setActiveTab("credits")}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      activeTab === "credits"
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent"
                    }`}
                  >
                    Créditos
                  </button>
                  <button
                    onClick={() => setActiveTab("billing")}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      activeTab === "billing"
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent"
                    }`}
                  >
                    Planos e Faturas
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Content Area */}
          <Tabs value={activeTab} className="flex-1 flex flex-col min-h-0">
            <TabsContent value="general" className="flex-1 overflow-y-auto p-8 m-0 h-0">
              <WorkspaceGeneral />
            </TabsContent>
            <TabsContent value="users" className="flex-1 overflow-y-auto p-8 m-0 h-0">
              <WorkspaceUsers />
            </TabsContent>
            {/* Conteúdo restrito apenas para admins/owners */}
            {isAdmin && (
              <>
                <TabsContent value="credits" className="flex-1 overflow-y-auto overflow-x-hidden p-8 m-0 h-0">
                  <WorkspaceCreditsTab />
                </TabsContent>
                <TabsContent value="billing" className="flex-1 overflow-y-auto p-8 m-0 h-0">
                  <WorkspaceBilling />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
