import { useState } from "react";
import { ProfileHeader } from "@/components/user-profile/ProfileHeader";
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
    <div className="h-screen flex flex-col bg-background">
      <ProfileHeader />
      <div className="flex flex-1 overflow-hidden">
        <ProfileSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default UserProfile;
