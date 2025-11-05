import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkspaceGeneral } from "./settings/WorkspaceGeneral";
import { WorkspaceUsers } from "./settings/WorkspaceUsers";
import { WorkspaceBilling } from "./settings/WorkspaceBilling";

interface WorkspaceSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WorkspaceSettingsModal = ({ open, onOpenChange }: WorkspaceSettingsModalProps) => {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[600px] p-0 gap-0 flex flex-col">
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-64 border-r border-border bg-muted/30 p-6 overflow-y-auto">
            <h2 className="text-lg font-bold mb-6">Configurações</h2>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("general")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "general"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                Geral
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "users"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                Usuários
              </button>
              <button
                onClick={() => setActiveTab("billing")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "billing"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                Planos e Faturas
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <Tabs value={activeTab} className="flex-1 flex flex-col min-h-0">
            <TabsContent value="general" className="flex-1 overflow-y-auto p-6 m-0 h-0">
              <WorkspaceGeneral />
            </TabsContent>
            <TabsContent value="users" className="flex-1 overflow-y-auto p-6 m-0 h-0">
              <WorkspaceUsers />
            </TabsContent>
            <TabsContent value="billing" className="flex-1 overflow-y-auto p-6 m-0 h-0">
              <WorkspaceBilling />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
