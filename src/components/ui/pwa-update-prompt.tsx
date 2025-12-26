import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

export function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [waitingSW, setWaitingSW] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Check for updates periodically
      const checkForUpdates = async () => {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            await registration.update();
            if (registration.waiting) {
              setWaitingSW(registration.waiting);
              setShowPrompt(true);
            }
          }
        } catch (error) {
          console.log('[PWA] Update check failed:', error);
        }
      };

      // Listen for new SW waiting
      const handleControllerChange = () => {
        window.location.reload();
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      // Check on mount and every 5 minutes
      checkForUpdates();
      const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

      // Also listen for statechange on installing worker
      const listenForWaiting = async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setWaitingSW(newWorker);
                  setShowPrompt(true);
                }
              });
            }
          });
        }
      };
      listenForWaiting();

      return () => {
        clearInterval(interval);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  const handleUpdate = useCallback(() => {
    if (waitingSW) {
      waitingSW.postMessage({ type: 'SKIP_WAITING' });
      setShowPrompt(false);
    }
  }, [waitingSW]);

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <RefreshCw className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground">Nova versão disponível</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Uma atualização está pronta. Atualize para ver as últimas melhorias.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleUpdate}>
                Atualizar agora
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                Depois
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
