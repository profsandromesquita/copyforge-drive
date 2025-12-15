import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const DiscoverCardSkeleton = () => {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Preview Area */}
      <div className="relative h-48 md:h-56 bg-muted/30 border-b">
        <Skeleton className="absolute inset-0 rounded-none" />
      </div>

      <CardContent className="flex-1 p-4 md:p-6">
        <div className="space-y-3">
          {/* Title */}
          <div>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-3 w-1/4 mt-2" />
          </div>

          {/* Creator info */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <div className="flex-1" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </CardFooter>
    </Card>
  );
};
