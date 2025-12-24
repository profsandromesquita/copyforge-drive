import { supabase } from '@/integrations/supabase/client';

export const isSessionExpiredError = (error: any): boolean => {
  // PGRST116 = "0 rows returned" - NOT a session expiration, just missing data
  if (error?.code === 'PGRST116') return false;
  
  return (
    error?.code === 'PGRST303' ||
    error?.message?.includes('JWT expired') ||
    error?.message?.includes('Unauthorized') ||
    error?.status === 401 ||
    // Supabase FunctionsHttpError pattern
    error?.context?.status === 401
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
