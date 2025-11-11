import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { GeneralSettings } from "@/components/admin/settings/GeneralSettings";
import { PaymentSettings } from "@/components/admin/settings/PaymentSettings";
import { UsersSettings } from "@/components/admin/settings/UsersSettings";
import { AISettings } from "@/components/admin/settings/AISettings";
import { CreditSettings } from "@/components/admin/settings/CreditSettings";
import { PlanSettings } from "@/components/admin/settings/PlanSettings";
import { WorkspaceSettings } from "@/components/admin/settings/WorkspaceSettings";
import { SettingsSidebar } from "@/components/admin/settings/SettingsSidebar";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("geral");

  const renderContent = () => {
    switch (activeTab) {
      case "geral":
        return <GeneralSettings />;
      case "pagamentos":
        return <PaymentSettings />;
      case "usuarios":
        return <UsersSettings />;
      case "ia":
        return <AISettings />;
      case "creditos":
        return <CreditSettings />;
      case "planos":
        return <PlanSettings />;
      case "workspace":
        return <WorkspaceSettings />;
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
