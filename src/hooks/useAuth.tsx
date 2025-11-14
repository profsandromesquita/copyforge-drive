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
          
          // Check onboarding status and redirect
          const currentPath = window.location.pathname;
          console.log('[useAuth] Signed in, current path:', currentPath);
          
            // Only redirect if on auth page or root
            if (currentPath === '/auth' || currentPath === '/') {
              // Wait a bit for profile to be created (Google login needs more time)
              setTimeout(async () => {
                try {
                  console.log('[useAuth] Checking onboarding status...');
                  const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('onboarding_completed')
                    .eq('id', session.user.id)
                    .maybeSingle();
                  
                  console.log('[useAuth] Profile data:', profile, 'Error:', profileError);
                  
                  if (profile?.onboarding_completed) {
                    console.log('[useAuth] Redirecting to my-project (onboarding completed)');
                    navigate('/my-project');
                  } else {
                    console.log('[useAuth] Redirecting to onboarding (first access or incomplete)');
                    navigate('/onboarding');
                  }
                } catch (error) {
                  console.error('[useAuth] Error checking onboarding:', error);
                  // Default to onboarding if there's an error
                  console.log('[useAuth] Redirecting to onboarding (error fallback)');
                  navigate('/onboarding');
                }
              }, 1000); // Increased timeout for Google login profile creation
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
    
    // Profile será criado pelo trigger - workspace será criado no onboarding
    if (!error && data.user) {
      console.log('[useAuth] Signup successful, profile will be created by trigger');
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
        redirectTo: `${window.location.origin}/my-project`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        }
      }
    });
    
    return { error };
  };

  const signOut = async () => {
    // Limpar qualquer dado de onboarding do localStorage antes de deslogar
    localStorage.removeItem('onboarding_progress');
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
