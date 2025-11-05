import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralSettings } from "@/components/admin/settings/GeneralSettings";
import { IntegrationsSettings } from "@/components/admin/settings/IntegrationsSettings";
import { UsersSettings } from "@/components/admin/settings/UsersSettings";
import { AISettings } from "@/components/admin/settings/AISettings";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("geral");

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="integracoes">Integrações</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="ia">IA</TabsTrigger>
          </TabsList>

          <TabsContent value="geral">
            <GeneralSettings />
          </TabsContent>

          <TabsContent value="integracoes">
            <IntegrationsSettings />
          </TabsContent>

          <TabsContent value="usuarios">
            <UsersSettings />
          </TabsContent>

          <TabsContent value="ia">
            <AISettings />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
