import { WorkspaceCredits } from "./WorkspaceCredits";
import { WorkspaceCreditsHistory } from "./WorkspaceCreditsHistory";
import { Separator } from "@/components/ui/separator";

export const WorkspaceCreditsTab = () => {
  return (
    <div className="space-y-4">
      <WorkspaceCredits />
      <Separator />
      <WorkspaceCreditsHistory />
    </div>
  );
};
