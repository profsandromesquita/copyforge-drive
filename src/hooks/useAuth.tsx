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
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Verificar se usuário tem workspace
          console.log('[useAuth] Checking if user has workspace...');
          
          setTimeout(async () => {
            try {
              const { data: membership, error } = await supabase
                .from('workspace_members')
                .select('workspace_id')
                .eq('user_id', session.user.id)
                .maybeSingle();

              if (error) {
                console.error('[useAuth] Error checking workspace:', error);
              } else if (!membership) {
                console.log('[useAuth] User has no workspace, attempting setup...');
                
                const { data: setupData, error: setupError } = await supabase.functions.invoke('setup-new-user', {
                  body: {
                    userId: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.name || session.user.email?.split('@')[0]
                  }
                });

                if (setupError) {
                  console.error('[useAuth] Setup retry failed:', setupError);
                } else {
                  console.log('[useAuth] Setup retry successful:', setupData);
                }
              } else {
                console.log('[useAuth] User has workspace:', membership.workspace_id);
              }
            } catch (error) {
              console.error('[useAuth] Workspace check failed:', error);
            }
          }, 0);
          
          // Only redirect if user is on auth page or root
          const currentPath = window.location.pathname;
          console.log('Signed in, current path:', currentPath);
          
          // Only redirect from auth page or root, never from other pages
          if (currentPath === '/auth' || currentPath === '/') {
            navigate('/dashboard');
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

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
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
