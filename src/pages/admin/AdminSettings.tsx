import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { GeneralSettings } from "@/components/admin/settings/GeneralSettings";
import { IntegrationsSettings } from "@/components/admin/settings/IntegrationsSettings";
import { UsersSettings } from "@/components/admin/settings/UsersSettings";
import { AISettings } from "@/components/admin/settings/AISettings";
import { SettingsSidebar } from "@/components/admin/settings/SettingsSidebar";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("geral");

  const renderContent = () => {
    switch (activeTab) {
      case "geral":
        return <GeneralSettings />;
      case "integracoes":
        return <IntegrationsSettings />;
      case "usuarios":
        return <UsersSettings />;
      case "ia":
        return <AISettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <AdminLayout>
      <div className="flex h-full">
        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </AdminLayout>
  );
}
