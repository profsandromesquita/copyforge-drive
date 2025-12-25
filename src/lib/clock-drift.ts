/**
 * Clock Drift Detection Utility
 * 
 * Verifica se o relógio do dispositivo do usuário está dessincronizado
 * com o servidor, o que pode causar falhas de autenticação JWT.
 */

export interface ClockDriftResult {
  driftMs: number;
  driftMinutes: number;
  isSignificant: boolean;
  direction: 'ahead' | 'behind' | 'synced';
  serverTime: Date;
  clientTime: Date;
}

// Tolerância de 30 minutos - diferenças maiores podem causar problemas com JWT
const TOLERANCE_MS = 30 * 60 * 1000;

export async function checkClockDrift(): Promise<ClockDriftResult | null> {
  try {
    const clientTimeBeforeRequest = Date.now();
    
    // HEAD request para o Supabase REST API (leve, não precisa de auth)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      console.warn('[ClockDrift] VITE_SUPABASE_URL not configured');
      return null;
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
      },
    });
    
    const clientTimeAfterRequest = Date.now();
    const dateHeader = response.headers.get('Date');
    
    if (!dateHeader) {
      console.warn('[ClockDrift] No Date header in response');
      return null;
    }
    
    // Calcular tempo médio do cliente durante a requisição (compensa latência de rede)
    const clientTimeMidpoint = (clientTimeBeforeRequest + clientTimeAfterRequest) / 2;
    const serverTime = new Date(dateHeader).getTime();
    
    const driftMs = serverTime - clientTimeMidpoint;
    const absDriftMs = Math.abs(driftMs);
    
    const result: ClockDriftResult = {
      driftMs,
      driftMinutes: Math.round(absDriftMs / 60000),
      isSignificant: absDriftMs > TOLERANCE_MS,
      direction: driftMs > 60000 ? 'behind' : driftMs < -60000 ? 'ahead' : 'synced',
      serverTime: new Date(serverTime),
      clientTime: new Date(clientTimeMidpoint),
    };

    if (result.isSignificant) {
      console.warn(
        `[ClockDrift] ⚠️ CRITICAL: Device clock is ${result.driftMinutes} minutes ${result.direction}!`,
        { serverTime: result.serverTime, clientTime: result.clientTime }
      );
    } else {
      console.log(`[ClockDrift] Clock synced (drift: ${Math.round(driftMs / 1000)}s)`);
    }

    return result;
  } catch (error) {
    console.warn('[ClockDrift] Could not check clock drift:', error);
    return null;
  }
}
