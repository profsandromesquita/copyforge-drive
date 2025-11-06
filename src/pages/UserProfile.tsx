import { useState } from "react";
import { ProfileSidebar } from "@/components/user-profile/ProfileSidebar";
import { ProfileGeneral } from "@/components/user-profile/ProfileGeneral";
import { ProfileSecurity } from "@/components/user-profile/ProfileSecurity";

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState("geral");

  const renderContent = () => {
    switch (activeTab) {
      case "geral":
        return <ProfileGeneral />;
      case "seguranca":
        return <ProfileSecurity />;
      default:
        return <ProfileGeneral />;
    }
  };

  return (
    <div className="h-screen flex bg-background">
      <ProfileSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default UserProfile;
