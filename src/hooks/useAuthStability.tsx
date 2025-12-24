import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';

// ============================================================
// AUTH STABILITY SYSTEM
// Prevents token refresh storms, multi-tab conflicts, and cascading fetches
// ============================================================

interface AuthStabilityContextType {
  /** True when auth is stable and safe to make requests */
  authReady: boolean;
  /** True if this tab is the "leader" (should perform fetches/subscriptions) */
  isLeader: boolean;
  /** Clock skew detected (device clock may be wrong) */
  clockSkewDetected: boolean;
  /** Multi-tab conflict detected */
  multiTabDetected: boolean;
  /** Manually mark auth as stable (used after successful operations) */
  markAuthStable: () => void;
  /** Manually mark auth as unstable (used when issues are detected) */
  markAuthUnstable: () => void;
}

const AuthStabilityContext = createContext<AuthStabilityContextType | undefined>(undefined);

// Configuration
const STABILITY_DELAY_MS = 1200; // Wait after SIGNED_IN before allowing fetches
const LEADER_HEARTBEAT_MS = 2000; // How often leader broadcasts presence
const LEADER_TIMEOUT_MS = 5000; // How long until we assume leader is gone

export const AuthStabilityProvider = ({ children }: { children: ReactNode }) => {
  const [authReady, setAuthReady] = useState(false);
  const [isLeader, setIsLeader] = useState(true); // Assume leader until proven otherwise
  const [clockSkewDetected, setClockSkewDetected] = useState(false);
  const [multiTabDetected, setMultiTabDetected] = useState(false);

  const stabilityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const leaderChannelRef = useRef<BroadcastChannel | null>(null);
  const leaderHeartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const lastLeaderPingRef = useRef<number>(0);
  const instanceIdRef = useRef<string>(Math.random().toString(36).substring(2, 9));

  // Clock skew detection helper
  const checkClockSkew = useCallback((expiresAt: number | undefined) => {
    if (!expiresAt) return false;
    
    const nowSec = Math.floor(Date.now() / 1000);
    const delta = expiresAt - nowSec;
    
    console.log(`[AuthStability] Token expires_at: ${expiresAt}, now: ${nowSec}, delta: ${delta}s`);
    
    // If token appears to expire very soon or already expired, likely clock skew
    // Normal tokens last ~3600s, so anything < 60s after login is suspicious
    if (delta <= 60) {
      console.warn('[AuthStability] ⚠️ Clock skew detected! Token appears expired or about to expire.');
      setClockSkewDetected(true);
      return true;
    }
    
    setClockSkewDetected(false);
    return false;
  }, []);

  // Leader election using BroadcastChannel
  useEffect(() => {
    // Check for BroadcastChannel support
    if (typeof BroadcastChannel === 'undefined') {
      console.log('[AuthStability] BroadcastChannel not supported, assuming leader');
      setIsLeader(true);
      return;
    }

    try {
      const channel = new BroadcastChannel('copydrive-leader-election');
      leaderChannelRef.current = channel;

      // Message types: 'leader-ping', 'leader-claim', 'leader-resign'
      channel.onmessage = (event) => {
        const { type, instanceId, timestamp } = event.data || {};
        
        if (instanceId === instanceIdRef.current) return; // Ignore own messages
        
        if (type === 'leader-ping' || type === 'leader-claim') {
          lastLeaderPingRef.current = Date.now();
          setMultiTabDetected(true);
          
          // If another tab claims leadership, become follower
          if (type === 'leader-claim') {
            console.log('[AuthStability] Another tab claimed leadership, becoming follower');
            setIsLeader(false);
          }
        }
        
        if (type === 'leader-resign') {
          // Leader resigned, we can try to claim
          console.log('[AuthStability] Leader resigned, attempting to claim leadership');
          claimLeadership();
        }
      };

      // Attempt to claim leadership
      const claimLeadership = () => {
        channel.postMessage({ 
          type: 'leader-claim', 
          instanceId: instanceIdRef.current, 
          timestamp: Date.now() 
        });
        setIsLeader(true);
        console.log('[AuthStability] Claimed leadership');
      };

      // Start heartbeat if we're leader
      const startHeartbeat = () => {
        if (leaderHeartbeatRef.current) {
          clearInterval(leaderHeartbeatRef.current);
        }
        
        leaderHeartbeatRef.current = setInterval(() => {
          if (isLeader) {
            channel.postMessage({ 
              type: 'leader-ping', 
              instanceId: instanceIdRef.current, 
              timestamp: Date.now() 
            });
          }
        }, LEADER_HEARTBEAT_MS);
      };

      // Check if there's already a leader
      channel.postMessage({ 
        type: 'leader-ping', 
        instanceId: instanceIdRef.current, 
        timestamp: Date.now() 
      });

      // Wait a bit to see if anyone responds as leader
      setTimeout(() => {
        if (Date.now() - lastLeaderPingRef.current > LEADER_TIMEOUT_MS) {
          // No leader responded, claim leadership
          claimLeadership();
          startHeartbeat();
        } else {
          // There's an existing leader
          setIsLeader(false);
          setMultiTabDetected(true);
          console.log('[AuthStability] Existing leader detected, becoming follower');
        }
      }, 500);

      // Resign leadership when tab closes
      const handleUnload = () => {
        if (isLeader) {
          channel.postMessage({ 
            type: 'leader-resign', 
            instanceId: instanceIdRef.current, 
            timestamp: Date.now() 
          });
        }
      };

      window.addEventListener('beforeunload', handleUnload);

      return () => {
        window.removeEventListener('beforeunload', handleUnload);
        if (leaderHeartbeatRef.current) {
          clearInterval(leaderHeartbeatRef.current);
        }
        channel.close();
      };
    } catch (error) {
      console.error('[AuthStability] BroadcastChannel error:', error);
      setIsLeader(true);
    }
  }, [isLeader]);

  // Stability delay after auth events
  const markAuthStable = useCallback(() => {
    if (stabilityTimerRef.current) {
      clearTimeout(stabilityTimerRef.current);
    }
    
    // Immediate stability (used after explicit user actions like clicking login)
    setAuthReady(true);
    console.log('[AuthStability] Auth marked as stable');
  }, []);

  const markAuthUnstable = useCallback(() => {
    setAuthReady(false);
    console.log('[AuthStability] Auth marked as unstable');
    
    // Auto-recover after delay
    if (stabilityTimerRef.current) {
      clearTimeout(stabilityTimerRef.current);
    }
    
    stabilityTimerRef.current = setTimeout(() => {
      setAuthReady(true);
      console.log('[AuthStability] Auth auto-stabilized after delay');
    }, STABILITY_DELAY_MS);
  }, []);

  // Listen for auth stability events from useAuth
  useEffect(() => {
    const handleAuthEvent = (event: CustomEvent) => {
      const { type, expiresAt } = event.detail || {};
      
      console.log('[AuthStability] Auth event received:', type);
      
      if (type === 'signed_in' || type === 'initial_session') {
        // Check for clock skew
        checkClockSkew(expiresAt);
        
        // Delay before allowing fetches
        markAuthUnstable();
      } else if (type === 'signed_out') {
        setAuthReady(false);
        setClockSkewDetected(false);
      } else if (type === 'storm_detected') {
        // Storm detected, hold off on requests
        markAuthUnstable();
      }
    };

    window.addEventListener('auth-stability-event', handleAuthEvent as EventListener);
    return () => window.removeEventListener('auth-stability-event', handleAuthEvent as EventListener);
  }, [checkClockSkew, markAuthUnstable]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stabilityTimerRef.current) {
        clearTimeout(stabilityTimerRef.current);
      }
      if (leaderHeartbeatRef.current) {
        clearInterval(leaderHeartbeatRef.current);
      }
    };
  }, []);

  return (
    <AuthStabilityContext.Provider value={{ 
      authReady, 
      isLeader, 
      clockSkewDetected,
      multiTabDetected,
      markAuthStable,
      markAuthUnstable,
    }}>
      {children}
    </AuthStabilityContext.Provider>
  );
};

export const useAuthStability = () => {
  const context = useContext(AuthStabilityContext);
  if (context === undefined) {
    // Return safe defaults if used outside provider (for safety during HMR)
    return {
      authReady: true,
      isLeader: true,
      clockSkewDetected: false,
      multiTabDetected: false,
      markAuthStable: () => {},
      markAuthUnstable: () => {},
    };
  }
  return context;
};
