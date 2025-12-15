import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const TemplateCardSkeleton = () => {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Visual Preview Area */}
      <div className="relative h-36 md:h-48 bg-muted/30 border-b">
        <Skeleton className="absolute inset-0 rounded-none" />
      </div>

      <CardContent className="flex-1 p-3 md:p-6">
        <div className="space-y-3">
          {/* Title */}
          <div>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-3 w-1/4 mt-2" />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <div className="flex-1" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 md:p-4 pt-0 gap-1.5 md:gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </CardFooter>
    </Card>
  );
};
