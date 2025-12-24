import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
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

// Storm guard configuration
const STORM_WINDOW_MS = 30000; // 30 seconds
const STORM_THRESHOLD = 3; // Max TOKEN_REFRESHED events in window

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Guard to prevent multiple redirects
  const hasRedirected = useRef(false);
  
  // Storm guard: track TOKEN_REFRESHED events
  const tokenRefreshTimestamps = useRef<number[]>([]);
  const isStormDetected = useRef(false);

  useEffect(() => {
    console.log('=== useAuth initializing ===');
    
    // Reset guards on mount
    hasRedirected.current = false;
    isStormDetected.current = false;
    tokenRefreshTimestamps.current = [];
    
    // Set up auth state listener - MUST be synchronous callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('Auth state changed:', event, 'Session:', !!newSession);
        
        // Handle TOKEN_REFRESHED separately - only update session, not user
        if (event === 'TOKEN_REFRESHED') {
          // Storm detection: count events in window
          const now = Date.now();
          tokenRefreshTimestamps.current = tokenRefreshTimestamps.current.filter(
            ts => now - ts < STORM_WINDOW_MS
          );
          tokenRefreshTimestamps.current.push(now);
          
          if (tokenRefreshTimestamps.current.length > STORM_THRESHOLD) {
            if (!isStormDetected.current) {
              isStormDetected.current = true;
              console.warn('[useAuth] ⚠️ Token refresh storm detected! Possible multi-tab or clock skew issue.');
            }
            // Don't update state during storm to prevent cascading re-renders
            return;
          }
          
          // Only update session if user ID hasn't changed (avoid triggering provider re-fetches)
          if (newSession && user?.id === newSession.user?.id) {
            setSession(newSession);
            // Don't update user - it's the same user, just new tokens
            return;
          }
        }
        
        // Handle SIGNED_IN and INITIAL_SESSION
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          // Reset storm detection on fresh sign in
          isStormDetected.current = false;
          tokenRefreshTimestamps.current = [];
          
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setLoading(false);
          
          // Handle redirect for SIGNED_IN only
          if (event === 'SIGNED_IN' && newSession?.user && !hasRedirected.current) {
            const currentPath = window.location.pathname;
            console.log('[useAuth] Signed in, current path:', currentPath);
            
            // Only redirect if on auth page or root
            if (currentPath === '/auth' || currentPath === '/') {
              hasRedirected.current = true;
              
              // Defer Supabase calls with setTimeout(0) to avoid auth deadlock
              setTimeout(async () => {
                try {
                  const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('onboarding_completed')
                    .eq('id', newSession.user.id)
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
                  navigate('/onboarding');
                }
              }, 0);
            }
          }
          return;
        }
        
        // Handle SIGNED_OUT
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setLoading(false);
          hasRedirected.current = false;
          isStormDetected.current = false;
          tokenRefreshTimestamps.current = [];
          console.log('Signed out, redirecting to auth');
          navigate('/auth');
          return;
        }
        
        // Default: update session and user for any other events
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    console.log('Checking for existing session...');
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      console.log('Existing session found:', !!existingSession);
      console.log('User:', existingSession?.user?.email);
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
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
    // Reset redirect guard before sign in
    hasRedirected.current = false;
    isStormDetected.current = false;
    tokenRefreshTimestamps.current = [];
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signInWithGoogle = async () => {
    // Reset redirect guard before sign in
    hasRedirected.current = false;
    isStormDetected.current = false;
    tokenRefreshTimestamps.current = [];
    
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
    hasRedirected.current = false;
    isStormDetected.current = false;
    tokenRefreshTimestamps.current = [];
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
