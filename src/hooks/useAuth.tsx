import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('=== useAuth initializing ===');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, 'Session:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[useAuth] User signed in:', session.user.email);
          
          // Wait a bit before checking workspace (gives trigger time to run)
          setTimeout(async () => {
            try {
              const { data: memberships, error: membershipError } = await supabase
                .from('workspace_members')
                .select('workspace_id')
                .eq('user_id', session.user.id)
                .limit(1);

              if (membershipError) {
                console.error('[useAuth] Error checking membership:', membershipError);
              }

              const membership = memberships?.[0];

              if (!membership) {
                console.log('[useAuth] No workspace found, calling setup...');
                
                const { data: setupData, error: setupError } = await supabase.functions.invoke('setup-new-user', {
                  body: {
                    userId: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.name || 
                          session.user.user_metadata?.full_name ||
                          session.user.email?.split('@')[0]
                  }
                });

                if (setupError) {
                  console.error('[useAuth] Setup error:', setupError);
                  
                  // Verify again if workspace was created despite error
                  const { data: retryMemberships } = await supabase
                    .from('workspace_members')
                    .select('workspace_id')
                    .eq('user_id', session.user.id)
                    .limit(1);
                  
                  if (!retryMemberships?.[0]) {
                    // Show warning but don't block login
                    import('sonner').then(({ toast }) => {
                      toast.warning('Configuração inicial pendente. Entre em contato com o suporte se problemas persistirem.');
                    });
                  } else {
                    console.log('[useAuth] Workspace created despite error');
                  }
                } else if (!setupData?.success) {
                  console.warn('[useAuth] Setup returned non-success:', setupData);
                  
                  // Verify if workspace exists anyway
                  const { data: retryMemberships } = await supabase
                    .from('workspace_members')
                    .select('workspace_id')
                    .eq('user_id', session.user.id)
                    .limit(1);
                  
                  if (retryMemberships?.[0]) {
                    console.log('[useAuth] Workspace exists despite setup warning');
                  }
                } else {
                  console.log('[useAuth] Setup completed successfully');
                }
              } else {
                console.log('[useAuth] User has workspace:', membership.workspace_id);
              }
            } catch (error) {
              console.error('[useAuth] Workspace check failed:', error);
              // Don't block login
            }
          }, 500); // Wait 500ms for trigger to execute
          
          // Check onboarding status and redirect
          const currentPath = window.location.pathname;
          console.log('[useAuth] Signed in, current path:', currentPath);
          
          // Only redirect if on auth page or root
          if (currentPath === '/auth' || currentPath === '/') {
            console.log('[useAuth] On auth page, checking onboarding status...');
            
            // Wait a bit to ensure profile is created
            console.log('[useAuth] Waiting 1 second for profile creation...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            try {
              console.log('[useAuth] Fetching profile for user:', session.user.id);
              
              // Add timeout to prevent hanging
              const profilePromise = supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', session.user.id)
                .single();
              
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
              );
              
              const { data: profile, error: profileError } = await Promise.race([
                profilePromise,
                timeoutPromise
              ]) as any;
              
              console.log('[useAuth] Profile fetch result - Data:', profile, 'Error:', profileError);
              
              if (profileError) {
                console.error('[useAuth] Error fetching profile:', profileError);
                // If profile doesn't exist yet, definitely go to onboarding
                if (profileError.code === 'PGRST116') {
                  console.log('[useAuth] Profile not found (PGRST116), redirecting to onboarding');
                  navigate('/onboarding');
                  return;
                }
                // Default to onboarding for other errors
                console.log('[useAuth] Redirecting to onboarding due to error');
                navigate('/onboarding');
              } else {
                // Trata NULL ou false como não completado
                const isCompleted = profile?.onboarding_completed === true;
                console.log('[useAuth] Onboarding completed:', isCompleted);
                
                if (isCompleted) {
                  console.log('[useAuth] Redirecting to dashboard');
                  navigate('/dashboard');
                } else {
                  console.log('[useAuth] Redirecting to onboarding');
                  navigate('/onboarding');
                }
              }
            } catch (error) {
              console.error('[useAuth] Exception during profile check:', error);
              // On any exception, go to onboarding
              console.log('[useAuth] Redirecting to onboarding due to exception');
              navigate('/onboarding');
            }
          } else {
            console.log('[useAuth] Not on auth page, skipping redirect');
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('Signed out, redirecting to auth');
          navigate('/auth');
        }
      }
    );

    // Check for existing session
    console.log('Checking for existing session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Existing session found:', !!session);
      console.log('User:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      console.log('Auth loading complete');
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
          phone
        }
      }
    });
    
    // Se signup foi bem-sucedido, chamar Edge Function para setup
    if (!error && data.user) {
      console.log('[useAuth] Signup successful, calling setup-new-user...');
      
      try {
        const { data: setupData, error: setupError } = await supabase.functions.invoke('setup-new-user', {
          body: {
            userId: data.user.id,
            email: data.user.email,
            name: name
          }
        });

        if (setupError) {
          console.error('[useAuth] Setup function error:', setupError);
        } else if (setupData && !setupData.success) {
          console.error('[useAuth] Setup failed:', setupData.error, setupData.details);
        } else {
          console.log('[useAuth] User setup completed successfully:', setupData);
        }
      } catch (setupError) {
        console.error('[useAuth] Failed to call setup function:', setupError);
      }
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        }
      }
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
