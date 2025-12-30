import { Badge } from "@/components/ui/badge";
import { Bug, Lightbulb, HelpCircle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeedbackCategory } from "@/hooks/useAdminFeedbacks";

const categoryConfig: Record<FeedbackCategory, { 
  label: string; 
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}> = {
  bug: {
    label: "Bug",
    icon: Bug,
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  suggestion: {
    label: "Sugestão",
    icon: Lightbulb,
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  question: {
    label: "Dúvida",
    icon: HelpCircle,
    className: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  },
  other: {
    label: "Outro",
    icon: MessageSquare,
    className: "bg-muted text-muted-foreground",
  },
};

interface FeedbackCategoryBadgeProps {
  category: FeedbackCategory;
  className?: string;
}

export function FeedbackCategoryBadge({ category, className }: FeedbackCategoryBadgeProps) {
  const config = categoryConfig[category] || categoryConfig.other;
  const Icon = config.icon;

  return (
    <Badge variant="secondary" className={cn("gap-1", config.className, className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
