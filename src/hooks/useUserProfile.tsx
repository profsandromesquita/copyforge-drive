import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { handleSessionExpiredError } from '@/lib/auth-utils';

interface UserProfile {
  name: string;
  email: string;
  avatar_url: string | null;
  cpf: string | null;
  phone: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Guard to prevent infinite fetch loops
  const fetchAttempted = useRef(false);

  useEffect(() => {
    // Reset fetch guard when user changes
    fetchAttempted.current = false;
    
    if (user) {
      loadProfile();

      // Subscribe to realtime changes
      const channel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            setProfile(payload.new as UserProfile);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    // Prevent multiple fetch attempts if profile doesn't exist
    if (fetchAttempted.current) {
      setLoading(false);
      return;
    }
    fetchAttempted.current = true;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, email, avatar_url, cpf, phone, cep, street, number, complement, neighborhood, city, state')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle to handle 0 rows gracefully

      if (error) {
        // Only handle as session error if it's NOT a "0 rows" error
        if (error.code !== 'PGRST116') {
          const wasExpired = await handleSessionExpiredError(error);
          if (wasExpired) return;
        }
        throw error;
      }

      if (data) {
        setProfile(data);
      } else {
        // Profile doesn't exist yet - use user metadata as fallback
        // This is NOT an error, just means profile wasn't created yet
        console.log('[useUserProfile] Profile not found, using metadata fallback');
        setProfile({
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
          avatar_url: null, // Don't use Google avatar as fallback
          cpf: null,
          phone: null,
          cep: null,
          street: null,
          number: null,
          complement: null,
          neighborhood: null,
          city: null,
          state: null,
        });
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      
      // Don't logout on PGRST116 (0 rows) - it's not a session error
      if (error?.code !== 'PGRST116') {
        const wasExpired = await handleSessionExpiredError(error);
        if (wasExpired) return;
      }
      
      // Fallback to user metadata - no avatar to avoid Google flash
      setProfile({
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
        email: user.email || '',
        avatar_url: null, // Don't use Google avatar as fallback
        cpf: null,
        phone: null,
        cep: null,
        street: null,
        number: null,
        complement: null,
        neighborhood: null,
        city: null,
        state: null,
      });
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, refreshProfile: loadProfile };
};
