import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ProfileInfo } from "./ProfileInfo";
import { SystemPreferences } from "./SystemPreferences";

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserProfileModal = ({ open, onOpenChange }: UserProfileModalProps) => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[600px] p-0 gap-0 flex flex-col">
        <DialogTitle className="sr-only">Minha Conta</DialogTitle>
        <DialogDescription className="sr-only">
          Gerencie seu perfil e preferências do sistema.
        </DialogDescription>
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-64 border-r border-border bg-muted/30 p-6 overflow-y-auto">
            <h2 className="text-lg font-bold mb-6">Minha Conta</h2>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "profile"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                Meu Perfil
              </button>
              <button
                onClick={() => setActiveTab("preferences")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "preferences"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                Preferências do Sistema
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <Tabs value={activeTab} className="flex-1 flex flex-col min-h-0">
            <TabsContent value="profile" className="flex-1 overflow-y-auto p-6 m-0 h-0">
              <ProfileInfo />
            </TabsContent>
            <TabsContent value="preferences" className="flex-1 overflow-y-auto p-6 m-0 h-0">
              <SystemPreferences />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
