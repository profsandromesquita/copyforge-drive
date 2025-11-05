import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';

export const CopyEditorLoading = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simular progresso suave
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-8 z-50">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <img 
          src="/src/assets/copydrive-icon.svg" 
          alt="CopyDrive" 
          className="w-24 h-24 animate-pulse"
        />
        <div className="w-64 space-y-3">
          <Progress value={progress} className="h-1.5" />
          <p className="text-sm text-muted-foreground text-center animate-fade-in">
            Carregando copy...
          </p>
        </div>
      </div>
    </div>
  );
};
