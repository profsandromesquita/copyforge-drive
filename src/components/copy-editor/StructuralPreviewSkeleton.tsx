export const StructuralPreviewSkeleton = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6 animate-in fade-in duration-300">
      <div className="max-w-2xl w-full">
        {/* Skeleton Card simulando estrutura da copy */}
        <div className="bg-card rounded-xl border p-8 space-y-6 shadow-sm">
          {/* Headline skeleton */}
          <div className="h-8 bg-border dark:bg-muted-foreground/30 rounded-lg w-3/4 animate-pulse" />
          
          {/* Subheadline skeleton */}
          <div className="space-y-2">
            <div className="h-5 bg-border dark:bg-muted-foreground/30 rounded-lg w-full animate-pulse" />
            <div className="h-5 bg-border dark:bg-muted-foreground/30 rounded-lg w-5/6 animate-pulse" />
          </div>
          
          {/* Paragraph skeleton */}
          <div className="space-y-2 pt-2">
            <div className="h-4 bg-muted dark:bg-muted-foreground/20 rounded w-full animate-pulse" />
            <div className="h-4 bg-muted dark:bg-muted-foreground/20 rounded w-full animate-pulse" />
            <div className="h-4 bg-muted dark:bg-muted-foreground/20 rounded w-4/5 animate-pulse" />
          </div>
          
          {/* Second paragraph skeleton */}
          <div className="space-y-2 pt-2">
            <div className="h-4 bg-muted dark:bg-muted-foreground/20 rounded w-full animate-pulse" />
            <div className="h-4 bg-muted dark:bg-muted-foreground/20 rounded w-5/6 animate-pulse" />
          </div>
          
          {/* CTA skeleton */}
          <div className="pt-4">
            <div className="h-12 bg-primary/30 rounded-full w-48 animate-pulse" />
          </div>
        </div>
        
        {/* Legenda explicativa */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Sua copy será estruturada em blocos inteligentes como este.
          <br />
          <span className="text-primary font-medium">Configure ao lado para gerar.</span>
        </p>
      </div>
    </div>
  );
};
