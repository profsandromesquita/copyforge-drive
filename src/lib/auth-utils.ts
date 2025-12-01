import { supabase } from '@/integrations/supabase/client';

export const isSessionExpiredError = (error: any): boolean => {
  return (
    error?.code === 'PGRST303' ||
    error?.message?.includes('JWT expired') ||
    error?.status === 401
  );
};

export const handleSessionExpiredError = async (error: any): Promise<boolean> => {
  if (isSessionExpiredError(error)) {
    console.warn('[Auth] Session expired, signing out...');
    await supabase.auth.signOut();
    return true;
  }
  return false;
};
