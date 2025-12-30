import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackSheet } from './FeedbackSheet';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// Routes where widget should NOT appear
const EXCLUDED_ROUTES = ['/auth', '/signup-invite', '/super-admin', '/view/'];

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Don't render if not authenticated
  if (!user) return null;

  // Don't render on excluded routes
  const isExcludedRoute = EXCLUDED_ROUTES.some((route) =>
    location.pathname.startsWith(route)
  );
  if (isExcludedRoute) return null;

  // Check if on copy editor route (has chat input at bottom-right)
  const isCopyRoute = location.pathname.includes('/copy/');

  // Position classes based on context
  const positionClasses = cn(
    'fixed z-[60] transition-all duration-300',
    {
      // Copy route: move to left to avoid EditorSidebar chat input
      'bottom-6 left-6': isCopyRoute,
      // Mobile with bottom nav: position above MobileMenu
      'bottom-20 right-6': !isCopyRoute && isMobile,
      // Default: bottom-right
      'bottom-6 right-6': !isCopyRoute && !isMobile,
    }
  );

  return (
    <>
      <div className={positionClasses}>
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          aria-label="Enviar feedback"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </div>

      <FeedbackSheet open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
