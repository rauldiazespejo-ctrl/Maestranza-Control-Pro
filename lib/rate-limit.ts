/**
 * Rate Limiting — Login protection
 * 5 intentos por IP en ventana de 15 minutos
 */
import { LRUCache } from "lru-cache";

interface RateLimitEntry {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil: number | null;
}

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_BLOCK_MS = 15 * 60 * 1000; // 15 minutos de bloqueo

const cache = new LRUCache<string, RateLimitEntry>({
  max: 500, // máximo 500 IPs trackeadas
  ttl: RATE_LIMIT_WINDOW_MS,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
});

function getClientIdentifier(ip: string): string {
  return `ratelimit:login:${ip}`;
}

/** Verifica si una IP puede intentar login. Retorna { allowed, remaining, resetAt } */
export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const key = getClientIdentifier(ip);
  const now = Date.now();
  const entry = cache.get(key);

  // Si está bloqueado activamente
  if (entry && entry.blockedUntil && now < entry.blockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
    };
  }

  // Si no hay entry o la ventana expiró, permitir
  if (!entry) {
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_ATTEMPTS - 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    };
  }

  // Dentro de la ventana, contar intentos
  const attemptsInWindow = entry.attempts;
  const remaining = Math.max(0, RATE_LIMIT_MAX_ATTEMPTS - attemptsInWindow - 1);

  return {
    allowed: attemptsInWindow < RATE_LIMIT_MAX_ATTEMPTS,
    remaining,
    resetAt: entry.firstAttemptAt + RATE_LIMIT_WINDOW_MS,
  };
}

/** Registra un intento fallido de login para una IP */
export function recordFailedAttempt(ip: string): void {
  const key = getClientIdentifier(ip);
  const now = Date.now();
  const entry = cache.get(key);

  if (!entry) {
    cache.set(key, {
      attempts: 1,
      firstAttemptAt: now,
      blockedUntil: null,
    });
    return;
  }

  const newAttempts = entry.attempts + 1;
  const shouldBlock = newAttempts >= RATE_LIMIT_MAX_ATTEMPTS;

  cache.set(key, {
    attempts: newAttempts,
    firstAttemptAt: entry.firstAttemptAt,
    blockedUntil: shouldBlock ? now + RATE_LIMIT_BLOCK_MS : entry.blockedUntil,
  });
}

/** Resetea los intentos de una IP (ej: login exitoso) */
export function resetRateLimit(ip: string): void {
  const key = getClientIdentifier(ip);
  cache.delete(key);
}

/** Formatea el tiempo restante para mensajes de error */
export function formatRetryAfter(resetAt: number): string {
  const remainingMs = resetAt - Date.now();
  if (remainingMs <= 0) return "ahora";
  const minutes = Math.ceil(remainingMs / 60000);
  return `${minutes} minuto${minutes > 1 ? "s" : ""}`;
}
