import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<{ error: any; justSignedUp?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const navigate = useNavigate();
  
  // Helper function to check onboarding with retry logic
  const checkOnboardingWithRetry = async (userId: string, attempt = 1): Promise<void> => {
    const maxAttempts = 3;
    const delays = [1000, 2000, 4000]; // Exponential backoff
    
    try {
      console.log(`[useAuth] Checking onboarding (attempt ${attempt}/${maxAttempts})...`);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('[useAuth] Error fetching profile:', error);
        
        if (attempt < maxAttempts) {
          console.log(`[useAuth] Retrying in ${delays[attempt - 1]}ms...`);
          await new Promise(resolve => setTimeout(resolve, delays[attempt - 1]));
          return checkOnboardingWithRetry(userId, attempt + 1);
        } else {
          console.log('[useAuth] Max retries reached, redirecting to onboarding');
          navigate('/onboarding');
          return;
        }
      }
      
      const isCompleted = profile?.onboarding_completed === true;
      console.log('[useAuth] Onboarding completed:', isCompleted);
      
      navigate(isCompleted ? '/dashboard' : '/onboarding');
    } catch (error) {
      console.error('[useAuth] Exception during profile check:', error);
      navigate('/onboarding');
    }
  };

  useEffect(() => {
    console.log('[useAuth] Setting up auth state listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuth] Auth state changed:', event, 'User:', session?.user?.email);
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Só verificar onboarding em páginas públicas e se não estiver em processo de signup
      if (event === 'SIGNED_IN' && session && !isSigningUp) {
        console.log('[useAuth] User signed in, checking if should redirect...');
        
        const currentPath = window.location.pathname;
        if (currentPath === '/auth' || currentPath === '/') {
          console.log('[useAuth] On auth/root page, checking onboarding with retry...');
          await checkOnboardingWithRetry(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[useAuth] Signed out, redirecting to auth');
        navigate('/auth');
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[useAuth] Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    try {
      console.log('[useAuth] Starting signup for:', email);
      setIsSigningUp(true);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
            phone,
          },
        },
      });

      if (error) {
        console.error('[useAuth] Signup error:', error);
        return { error, justSignedUp: false };
      }

      console.log('[useAuth] Signup successful, calling setup-new-user...');
      
      const { data: setupData, error: setupError } = await supabase.functions.invoke('setup-new-user', {
        body: {
          userId: data.user?.id,
          email: email,
          name: name,
        },
      });

      if (setupError) {
        console.error('[useAuth] Setup error:', setupError);
        return { error: setupError, justSignedUp: false };
      }

      console.log('[useAuth] User setup completed:', setupData);
      
      // Aguardar um pouco para garantir que o profile foi criado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { error: null, justSignedUp: true };
    } catch (error) {
      console.error('[useAuth] Signup exception:', error);
      return { error, justSignedUp: false };
    } finally {
      setIsSigningUp(false);
    }
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
