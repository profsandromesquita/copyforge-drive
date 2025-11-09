import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Skeleton } from '@/components/ui/skeleton';

interface UsageData {
  projects: {
    current: number;
    limit: number | null;
  };
  copies: {
    current: number;
    limit: number | null;
  };
  planName: string;
}

export const PlanUsageIndicator = () => {
  const { activeWorkspace } = useWorkspace();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeWorkspace?.id) {
      fetchUsage();
    }
  }, [activeWorkspace?.id]);

  const fetchUsage = async () => {
    if (!activeWorkspace?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workspace_subscriptions')
        .select(`
          projects_count,
          copies_count,
          current_max_projects,
          current_max_copies,
          subscription_plans!inner(name)
        `)
        .eq('workspace_id', activeWorkspace.id)
        .eq('status', 'active')
        .single();

      if (error) throw error;

      if (data) {
        setUsage({
          projects: {
            current: data.projects_count || 0,
            limit: data.current_max_projects,
          },
          copies: {
            current: data.copies_count || 0,
            limit: data.current_max_copies,
          },
          planName: (data.subscription_plans as any)?.name || 'Free',
        });
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = () => {
    window.dispatchEvent(
      new CustomEvent('show-upgrade-modal', {
        detail: { limitType: 'projects' },
      })
    );
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3 border-t">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (!usage) return null;

  const getProgressColor = (current: number, limit: number | null) => {
    if (limit === null) return 'bg-green-600';
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return 'bg-red-600';
    if (percentage >= 70) return 'bg-orange-600';
    return 'bg-green-600';
  };

  return (
    <div className="p-4 space-y-3 border-t">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Plano {usage.planName}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={handleUpgradeClick}
        >
          <TrendingUp className="h-3 w-3 mr-1" />
          Upgrade
        </Button>
      </div>

      {/* Projetos */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Projetos</span>
          <span className="font-medium">
            {usage.projects.current}
            {usage.projects.limit !== null ? ` / ${usage.projects.limit}` : ' (Ilimitado)'}
          </span>
        </div>
        {usage.projects.limit !== null && (
          <Progress
            value={(usage.projects.current / usage.projects.limit) * 100}
            className="h-1.5"
          />
        )}
      </div>

      {/* Copies */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Copies</span>
          <span className="font-medium">
            {usage.copies.current}
            {usage.copies.limit !== null ? ` / ${usage.copies.limit}` : ' (Ilimitado)'}
          </span>
        </div>
        {usage.copies.limit !== null && (
          <Progress
            value={(usage.copies.current / usage.copies.limit) * 100}
            className="h-1.5"
          />
        )}
      </div>
    </div>
  );
};
