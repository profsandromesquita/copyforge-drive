import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authReady: boolean; // New: indicates when it's safe to make requests
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storm guard configuration
const STORM_WINDOW_MS = 30000; // 30 seconds
const STORM_THRESHOLD = 3; // Max TOKEN_REFRESHED events in window
const AUTH_READY_DELAY_MS = 1500; // Delay before allowing fetches after sign in

// Emit stability events for coordination with other hooks
const emitAuthStabilityEvent = (type: string, expiresAt?: number) => {
  window.dispatchEvent(new CustomEvent('auth-stability-event', { 
    detail: { type, expiresAt } 
  }));
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const navigate = useNavigate();
  
  // Guard to prevent multiple redirects
  const hasRedirected = useRef(false);
  
  // Storm guard: track TOKEN_REFRESHED events
  const tokenRefreshTimestamps = useRef<number[]>([]);
  const isStormDetected = useRef(false);
  
  // Fix stale closure: use ref to track current user ID
  const currentUserIdRef = useRef<string | null>(null);
  
  // Auth ready timer
  const authReadyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to set auth ready with delay
  const scheduleAuthReady = useCallback(() => {
    if (authReadyTimerRef.current) {
      clearTimeout(authReadyTimerRef.current);
    }
    
    authReadyTimerRef.current = setTimeout(() => {
      console.log('[useAuth] Auth now ready for requests');
      setAuthReady(true);
    }, AUTH_READY_DELAY_MS);
  }, []);

  // Helper to immediately set auth ready (for existing sessions)
  const setAuthReadyNow = useCallback(() => {
    if (authReadyTimerRef.current) {
      clearTimeout(authReadyTimerRef.current);
    }
    setAuthReady(true);
  }, []);

  // Check for clock skew
  const checkClockSkew = useCallback((expiresAt: number | undefined) => {
    if (!expiresAt) return false;
    
    const nowSec = Math.floor(Date.now() / 1000);
    const delta = expiresAt - nowSec;
    
    console.log(`[useAuth] Token check - expires_at: ${expiresAt}, now: ${nowSec}, delta: ${delta}s`);
    
    // Normal tokens last ~3600s (1 hour)
    // If delta is very small or negative, something is wrong
    if (delta <= 60) {
      console.warn('[useAuth] ⚠️ CLOCK SKEW DETECTED - Token appears expired immediately after login!');
      console.warn('[useAuth] This usually means your device clock is ahead of server time.');
      return true;
    }
    
    return false;
  }, []);

  useEffect(() => {
    console.log('=== useAuth initializing ===');
    
    // Reset guards on mount
    hasRedirected.current = false;
    isStormDetected.current = false;
    tokenRefreshTimestamps.current = [];
    currentUserIdRef.current = null;
    
    // Set up auth state listener
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
              emitAuthStabilityEvent('storm_detected');
              
              // During storm, pause auth ready to prevent cascading requests
              setAuthReady(false);
            }
            // Don't update state during storm to prevent cascading re-renders
            return;
          }
          
          // Use ref to compare user IDs (avoids stale closure)
          if (newSession && currentUserIdRef.current === newSession.user?.id) {
            // Same user, just update session (tokens refreshed)
            setSession(newSession);
            // Don't touch user or authReady - this is just a token refresh
            return;
          }
        }
        
        // Handle SIGNED_IN and INITIAL_SESSION
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          // Reset storm detection on fresh sign in
          isStormDetected.current = false;
          tokenRefreshTimestamps.current = [];
          
          // Update refs and state
          currentUserIdRef.current = newSession?.user?.id ?? null;
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setLoading(false);
          
          // Check for clock skew
          const hasClockSkew = checkClockSkew(newSession?.expires_at);
          
          // Emit stability event
          emitAuthStabilityEvent(event.toLowerCase(), newSession?.expires_at);
          
          // For INITIAL_SESSION with existing session, enable auth ready faster
          if (event === 'INITIAL_SESSION' && newSession && !hasClockSkew) {
            // Existing session, can allow requests sooner
            setTimeout(() => setAuthReady(true), 500);
          } else if (event === 'SIGNED_IN' && newSession && !hasClockSkew) {
            // Fresh sign in, use longer delay to let things stabilize
            scheduleAuthReady();
          }
          
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
                  navigate('/onboarding');
                }
              }, 0);
            }
          }
          return;
        }
        
        // Handle SIGNED_OUT
        if (event === 'SIGNED_OUT') {
          currentUserIdRef.current = null;
          setSession(null);
          setUser(null);
          setLoading(false);
          setAuthReady(false);
          hasRedirected.current = false;
          isStormDetected.current = false;
          tokenRefreshTimestamps.current = [];
          emitAuthStabilityEvent('signed_out');
          console.log('Signed out, redirecting to auth');
          navigate('/auth');
          return;
        }
        
        // Default: update session and user for any other events
        currentUserIdRef.current = newSession?.user?.id ?? null;
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
      
      currentUserIdRef.current = existingSession?.user?.id ?? null;
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);
      
      // If there's an existing session, enable auth ready after short delay
      if (existingSession) {
        setTimeout(() => setAuthReady(true), 300);
      }
      
      console.log('Auth loading complete');
    });

    return () => {
      subscription.unsubscribe();
      if (authReadyTimerRef.current) {
        clearTimeout(authReadyTimerRef.current);
      }
    };
  }, [navigate, scheduleAuthReady, checkClockSkew]);

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
    
    if (!error && data.user) {
      console.log('[useAuth] Signup successful, profile will be created by trigger');
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Reset guards before sign in
    hasRedirected.current = false;
    isStormDetected.current = false;
    tokenRefreshTimestamps.current = [];
    setAuthReady(false); // Disable requests during sign in process
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signInWithGoogle = async () => {
    // Reset guards before sign in
    hasRedirected.current = false;
    isStormDetected.current = false;
    tokenRefreshTimestamps.current = [];
    setAuthReady(false);
    
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
    localStorage.removeItem('onboarding_progress');
    hasRedirected.current = false;
    isStormDetected.current = false;
    tokenRefreshTimestamps.current = [];
    currentUserIdRef.current = null;
    setAuthReady(false);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, authReady, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During HMR or initial load, context may be temporarily undefined
    // Return a safe default instead of throwing to prevent cascading errors
    console.warn('[useAuth] Context not available yet, returning loading state');
    return {
      user: null,
      session: null,
      loading: true,
      authReady: false,
      signUp: async () => ({ error: new Error('Auth not initialized') }),
      signIn: async () => ({ error: new Error('Auth not initialized') }),
      signInWithGoogle: async () => ({ error: new Error('Auth not initialized') }),
      signOut: async () => {},
    };
  }
  return context;
};
