import { useState, useEffect, useCallback, useRef } from 'react';
import { checkClockDrift, ClockDriftResult } from '@/lib/clock-drift';

const RECHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos
const MIN_CHECK_INTERVAL_MS = 10000; // 10 segundos mínimo entre checks

export function useClockDrift() {
  const [driftResult, setDriftResult] = useState<ClockDriftResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const lastCheckTimeRef = useRef<number>(0);

  const runCheck = useCallback(async () => {
    // Evitar checks muito frequentes
    if (Date.now() - lastCheckTimeRef.current < MIN_CHECK_INTERVAL_MS) {
      return;
    }
    
    setIsChecking(true);
    try {
      const result = await checkClockDrift();
      setDriftResult(result);
      lastCheckTimeRef.current = Date.now();
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Check inicial (assíncrono, não bloqueia a UI)
  useEffect(() => {
    // Pequeno delay para não competir com o carregamento inicial
    const timer = setTimeout(() => {
      runCheck();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [runCheck]);

  // Re-check periódico se drift significativo foi detectado
  useEffect(() => {
    if (!driftResult?.isSignificant) return;
    
    const interval = setInterval(runCheck, RECHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [driftResult?.isSignificant, runCheck]);

  return {
    driftResult,
    isChecking,
    recheck: runCheck,
    hasCriticalDrift: driftResult?.isSignificant ?? false,
  };
}
