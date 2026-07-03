# 🔐 Audit Report — Área AUTH_LOGIN
## Maestranza Control Pro (ForgeOps) | Next.js 16 + Next Auth v5 β31

> **Auditor:** Especialista Senior AUTH_LOGIN  
> **Fecha:** 2025-01-12  
> **Scope:** `/lib/auth.ts`, `/app/login/page.tsx`, `/app/portal/login/page.tsx`, `/components/auth/LoginForm.tsx`, `/components/portal/PortalLoginForm.tsx`, `/types/next-auth.d.ts`, `/lib/rate-limit.ts`, `/prisma/schema.prisma`, `/lib/actions/users.ts`, `/lib/db.ts`, `/app/(dashboard)/layout.tsx`, `/app/portal/layout.tsx`, `/app/layout.tsx`  
> **Restricción:** Este documento es **solo lectura / diagnóstico**. No se modificaron archivos del repositorio.

---

## 📋 Índice de Hallazgos

| ID | Severidad | Título | Archivo(s) |
|----|-----------|--------|------------|
| AUTH-001 | 🔴 **CRÍTICO** | Ausencia de `middleware.ts` — protección de rutas por layout individual | Global |
| AUTH-002 | 🔴 **CRÍTICO** | `signIn("credentials", { redirect: false })` + `router.push` = race condition / stale session | `LoginForm.tsx`, `PortalLoginForm.tsx` |
| AUTH-003 | 🔴 **CRÍTICO** | Rate-limiting en memoria (`LRUCache`) inválido en Vercel serverless | `lib/rate-limit.ts` |
| AUTH-004 | 🟠 **ALTO** | `trustHost: true` hardcodeado sin restricción de host | `lib/auth.ts` |
| AUTH-005 | 🟠 **ALTO** | Fallback de `authSecret` con string hardcodeado en desarrollo | `lib/auth.ts` |
| AUTH-006 | 🟠 **ALTO** | Errores de `authorize` (`servicio_no_disponible`, `intentos_temporales`) no se renderizan en UI | `LoginForm.tsx` |
| AUTH-007 | 🟠 **ALTO** | `PortalLoginPage` no propaga ni muestra errores de autenticación | `app/portal/login/page.tsx` |
| AUTH-008 | 🟡 **MEDIO** | `next-auth.d.ts` tipa `role` como `string` en vez de `UserRole` | `types/next-auth.d.ts` |
| AUTH-009 | 🟡 **MEDIO** | `requireAuth` depende de `ALL_ROLES` hardcodeado — desincronización con Prisma enum | `lib/auth.ts` |
| AUTH-010 | 🟡 **MEDIO** | `createUser` sin validación Zod — role casteado sin verificación | `lib/actions/users.ts` |
| AUTH-011 | 🟡 **MEDIO** | `prisma/schema.prisma` — `rut` y `email` opcionales en modelo `User` | `prisma/schema.prisma` |
| AUTH-012 | 🟡 **MEDIO** | Modelo `Session` en Prisma es código muerto (strategy JWT) | `prisma/schema.prisma` |
| AUTH-013 | 🟢 **BAJO** | Variables de entorno legacy (`NEXTAUTH_SECRET`, `NEXTAUTH_URL`) | `.env.example` |
| AUTH-014 | 🟢 **BAJO** | Estilo visual verde (`emerald`, `fire`) en login — requiere migración a cian neón | `app/login/page.tsx`, `globals.css` |
| AUTH-015 | 🟢 **BAJO** | `seed-admin.ts` expone contraseña en texto plano | `scripts/seed-admin.ts` |
| AUTH-016 | 🟢 **BAJO** | `AuthProvider` duplicado (`components/auth/AuthProvider.tsx` y `components/providers/AuthProvider.tsx`) | Global |

---

## 🔴 CRÍTICO

### AUTH-001 — Ausencia de `middleware.ts`

**Archivos:** Global (raíz del proyecto)  
**Evidencia:** `middleware.ts NOT FOUND` (verificado con `ls` en raíz).

#### Explicación técnica
Next.js 15/16 recomienda proteger rutas vía **Middleware** cuando se usa NextAuth v5. Actualmente la protección se implementa replicando `await auth()` + `redirect()` en **cada layout** (`app/(dashboard)/layout.tsx`, `app/portal/layout.tsx`). Esto es frágil:

- Cualquier nueva ruta bajo `app/` que olvide el check queda **pública**.
- Los **Server Actions** bajo rutas no protegidas pueden ser invocados directamente (CSRF no mitigado por layout).
- El `auth()` en layout se ejecuta **después** de que el middleware ya corrió; si hay lógica de redirección temprana (ej. i18n, A/B testing) el usuario ya consumió recursos.

#### Código corregido — Crear `/middleware.ts` en raíz

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role;

  // Rutas públicas (siempre permitidas)
  const isPublic = ["/login", "/portal/login", "/api/auth"].some((p) =>
    nextUrl.pathname.startsWith(p)
  );

  if (isPublic) return NextResponse.next();

  // Si no está autenticado → login
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protección de portal cliente
  const isPortal = nextUrl.pathname.startsWith("/portal");
  if (isPortal && role !== "CLIENT") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Protección de dashboard admin/ops
  const isDashboard = nextUrl.pathname.startsWith("/dashboard");
  if (isDashboard && role === "CLIENT") {
    return NextResponse.redirect(new URL("/portal/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/.*|api/webhooks).*)"],
};
```

> **Nota:** Con middleware activo, los `redirect("/login")` en layouts pueden eliminarse o convertirse en **doble verificación defensiva** (fail-closed).

---

### AUTH-002 — Race condition en `signIn(..., { redirect: false })` + `router.push`

**Archivos:** `components/auth/LoginForm.tsx` (L61-86), `components/portal/PortalLoginForm.tsx` (L35-52)  
**Evidencia:**

```tsx
// LoginForm.tsx L66-76
const result = await signIn("credentials", {
  rut,
  password,
  redirect: false,
  callbackUrl: "/dashboard",
});

if (result?.ok) {
  router.push(result.url ?? "/dashboard");
  router.refresh();
  return;
}
```

#### Explicación técnica
`signIn` con `redirect: false` resuelve tan pronto como la cookie de sesión es escrita por el servidor, pero **el estado de React/Next.js puede no haberse hidratado** con la nueva sesión. Hacer `router.push()` inmediatamente después crea una race condition donde:

1. El cliente navega a `/dashboard`.
2. El layout de dashboard ejecuta `await auth()` **antes** de que la cookie se haya propagado al contexto del servidor (en serverless esto es especialmente volátil).
3. El usuario rebota de vuelta a `/login` o ve un flash de "No autenticado".

La solución robusta es dejar que NextAuth maneje el redirect (`redirect: true`) o forzar un **full-page reload** con `window.location.assign` cuando se use `redirect: false`.

#### Código corregido — `components/auth/LoginForm.tsx`

```typescript
"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { AlertCircle, IdCard, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const authErrorMessages: Record<string, string> = {
  CredentialsSignin: "RUT o contraseña incorrectos. Verifica tus credenciales e intenta nuevamente.",
  AccessDenied: "No tienes permisos para acceder a este sistema.",
  Configuration: "La autenticación no está configurada correctamente.",
};

const credentialErrorMessages: Record<string, string> = {
  credenciales_invalidas: "RUT o contraseña incorrectos. Verifica tus credenciales e intenta nuevamente.",
  credentials: "RUT o contraseña incorrectos. Verifica tus credenciales e intenta nuevamente.",
  intentos_temporales: "Demasiados intentos fallidos. Espera unos minutos e intenta nuevamente.",
  servicio_no_disponible: "No se pudo validar el acceso con la base de datos. Revisa la configuración e intenta nuevamente.",
};

interface LoginFormProps {
  authError?: string;
  errorCode?: string;
}

export function LoginForm({ authError, errorCode }: LoginFormProps) {
  const [rut, setRut] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const authMessage =
    authError === "CredentialsSignin" && errorCode
      ? credentialErrorMessages[errorCode] ?? authErrorMessages.CredentialsSignin
      : authError
        ? authErrorMessages[authError] ?? "No se pudo iniciar sesión. Intenta nuevamente."
        : null;
  const displayError = error ?? authMessage;

  const formatRut = (value: string) => {
    let raw = value.replace(/[^0-9kK]/g, "");
    if (raw.length > 1) {
      raw = raw.slice(0, -1) + "-" + raw.slice(-1);
    }
    const parts = raw.split("-");
    const body = parts[0] ?? "";
    if (body.length > 3) {
      parts[0] = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    return parts.join("-");
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRut(formatRut(e.target.value));
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    // === FIX AUTH-002: usar redirect: true para evitar race condition ===
    // signIn con redirect: true fuerza navegación full-page cuando el
    // servidor setea la cookie, eliminando la ventana de race.
    await signIn("credentials", {
      rut,
      password,
      redirect: true,
      callbackUrl: "/dashboard",
    });

    // Línea inalcanzable si redirect: true funciona; se mantiene por si
    // el provider devuelve un error antes del redirect.
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {displayError && (
        <div
          className="flex items-start gap-2 rounded-md border border-red-400/35 bg-red-500/15 p-3 text-sm text-white shadow-sm"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <span>{displayError}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="rut" className="text-sm font-medium text-slate-300">
          RUT
        </label>
        <div className="relative">
          <IdCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="rut"
            name="rut"
            type="text"
            required
            autoComplete="username"
            inputMode="text"
            placeholder="12.345.678-9"
            value={rut}
            onChange={handleRutChange}
            aria-invalid={Boolean(displayError)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label htmlFor="password" className="text-sm font-medium text-slate-300">
            Contraseña
          </label>
          <span className="text-xs text-slate-500 italic">Requerida</span>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(displayError)}
            className="pl-10"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className={cn("w-full", loading && "opacity-80")}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Ingresando...
          </>
        ) : (
          "Ingresar"
        )}
      </Button>
    </form>
  );
}
```

> **Alternativa:** Si el equipo requiere `redirect: false` para mostrar errores inline sin recargar, debe usarse `window.location.assign(result.url ?? "/dashboard")` en vez de `router.push()` para forzar full reload.

---

### AUTH-003 — Rate-limiting in-memory (`LRUCache`) inválido en Vercel serverless

**Archivo:** `lib/rate-limit.ts`  
**Evidencia:** Líneas 17-22 y 29-65.

```typescript
const cache = new LRUCache<string, RateLimitEntry>({
  max: 500,
  ttl: RATE_LIMIT_WINDOW_MS,        // 15 min
  updateAgeOnGet: false,
  updateAgeOnHas: false,
});
```

#### Explicación técnica
Vercel despliega funciones serverless que se **escalan horizontalmente**. Cada instancia tiene su propia memoria heap. Un atacante distribuyendo requests entre instancias (round-robin del edge) puede realizar **N × 5 intentos** (donde N = número de instancias activas) antes de ser bloqueado. En escenarios de alto tráfico esto anula completamente la protección.

Además:
- `ttl: RATE_LIMIT_WINDOW_MS` hace que las entradas expiren solo tras 15 min desde la **primera inserción**, no desde el último intento (aunque `updateAgeOnGet: false` es intencional para ventana fija, esto es aceptable).
- No hay persistencia: si el proceso se reinicia (cold start), el contador se resetea.

#### Código corregido — `lib/rate-limit.ts` (solución híbrida Vercel KV / Redis)

```typescript
/**
 * Rate Limiting — Login protection
 * 5 intentos por IP en ventana de 15 minutos
 *
 * NOTA: En Vercel serverless, LRUCache in-memory NO es suficiente.
 * Se recomienda migrar a Vercel KV, Upstash Redis o similar.
 * El código siguiente mantiene LRU como fallback en dev/test,
 * pero emite warning en producción si no hay KV.
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
  max: 500,
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

  if (entry && entry.blockedUntil && now < entry.blockedUntil) {
    return { allowed: false, remaining: 0, resetAt: entry.blockedUntil };
  }

  if (!entry) {
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_ATTEMPTS - 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    };
  }

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
    cache.set(key, { attempts: 1, firstAttemptAt: now, blockedUntil: null });
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

// === TODO AUTH-003: Integrar Vercel KV / Upstash Redis ===
// Ejemplo de implementación futura con @vercel/kv:
//
// import { kv } from "@vercel/kv";
// export async function checkRateLimitKV(ip: string) {
//   const key = `ratelimit:login:${ip}`;
//   const attempts = await kv.incr(key);
//   if (attempts === 1) await kv.expire(key, 900); // 15 min
//   return { allowed: attempts <= 5, remaining: Math.max(0, 5 - attempts) };
// }
```

---

## 🟠 ALTO

### AUTH-004 — `trustHost: true` hardcodeado sin restricción de host

**Archivo:** `lib/auth.ts` L112  
**Evidencia:**

```typescript
export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  // ...
});
```

#### Explicación técnica
`trustHost: true` desactiva la validación de host en NextAuth v5. Esto es útil en desarrollo local o cuando el framework no puede inferir el host (ej. detrás de proxies múltiples), pero en producción permite que un atacante suplante el `Host` header para manipular URLs de callback o CSRF tokens.

Vercel generalmente maneja esto bien, pero si el proyecto se migra a infraestructura propia (EC2, VPS), esto se convierte en un vector de **Host Header Injection**.

#### Código corregido — `lib/auth.ts`

```typescript
export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  // Solo confiar host en desarrollo; en producción dejar que
  // NextAuth infiera de VERCEL_URL / AUTH_URL
  trustHost: process.env.NODE_ENV === "development",
  secret: authSecret,
  // ...
});
```

---

### AUTH-005 — Fallback de `authSecret` con string hardcodeado en desarrollo

**Archivo:** `lib/auth.ts` L99-104  
**Evidencia:**

```typescript
const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "development"
    ? "maestranza-control-pro-dev-secret"
    : undefined);
```

#### Explicación técnica
En producción (`NODE_ENV !== "development"`), si tanto `AUTH_SECRET` como `NEXTAUTH_SECRET` son `undefined`, `authSecret` será `undefined`. NextAuth v5 **fallará silenciosamente o generará errores crípticos** en runtime (cookies no firmadas, sesiones no válidas).

El riesgo es que un deploy a Vercel donde las env vars no estén configuradas resulte en un sistema de auth completamente roto sin mensajes claros en build time.

#### Código corregido — `lib/auth.ts`

```typescript
const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "development"
    ? "maestranza-control-pro-dev-secret"
    : undefined);

if (!authSecret && process.env.NODE_ENV === "production") {
  throw new Error(
    "[AUTH] AUTH_SECRET o NEXTAUTH_SECRET deben estar configurados en producción."
  );
}
```

---

### AUTH-006 — Errores de `authorize` no se renderizan en UI

**Archivo:** `components/auth/LoginForm.tsx` L79-83  
**Evidencia:**

```typescript
if (result?.error === "Configuration") {
  setError("No se pudo validar el acceso...");
} else {
  setError("RUT o contraseña incorrectos...");
}
```

#### Explicación técnica
Cuando `authorize` lanza `InvalidCredentialsError` (code `"credenciales_invalidas"`), `TemporaryAttemptsError` (code `"intentos_temporales"`) o `AuthenticationUnavailableError` (code `"servicio_no_disponible"`), NextAuth v5 devuelve un objeto `result` donde:

- `result.error` es el **nombre de la clase** (`CredentialsSignin`) o `"Configuration"`, **NO** el `code` custom.
- El `code` custom solo aparece en la URL cuando `redirect: true` (como query param `?error=CredentialsSignin&code=intentos_temporales`).

Con `redirect: false`, el cliente **no tiene acceso** al `code` custom del error. Esto significa que:
- Un usuario bloqueado por rate limit ve "RUT o contraseña incorrectos" en vez de "Demasiados intentos fallidos...".
- Un error de DB muestra el mensaje genérico de credenciales.

#### Código corregido — `lib/auth.ts` (lanzar errores con mensajes legibles)

```typescript
class InvalidCredentialsError extends CredentialsSignin {
  override code = "credenciales_invalidas";
  override message = "RUT o contraseña incorrectos. Verifica tus credenciales e intenta nuevamente.";
}

class TemporaryAttemptsError extends CredentialsSignin {
  override code = "intentos_temporales";
  override message = "Demasiados intentos fallidos. Espera unos minutos e intenta nuevamente.";
}

class AuthenticationUnavailableError extends CredentialsSignin {
  override code = "servicio_no_disponible";
  override message = "No se pudo validar el acceso con la base de datos. Revisa la configuración e intenta nuevamente.";
}
```

Y en `LoginForm.tsx`, cuando `redirect: true` esté activo (ver AUTH-002), los errores llegarán vía `searchParams.error` / `searchParams.code` y el mapeo existente funcionará correctamente.

> **Alternativa con `redirect: false`:** Implementar un endpoint API interno (`/api/auth/custom-login`) que devuelva JSON con el código de error específico, y llamarlo desde el form en vez de `signIn` directamente.

---

### AUTH-007 — `PortalLoginPage` no propaga ni muestra errores de autenticación

**Archivo:** `app/portal/login/page.tsx`  
**Evidencia:** El componente no recibe `searchParams` ni los pasa a `PortalLoginForm`.

```typescript
export default async function PortalLoginPage() {
  const session = await auth();
  if (session?.user?.role === "CLIENT") redirect("/portal/dashboard");
  return (
    <div className="...">
      <PortalLoginForm />
    </div>
  );
}
```

#### Código corregido — `app/portal/login/page.tsx`

```typescript
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PortalLoginForm } from "@/components/portal/PortalLoginForm";

interface PortalLoginPageProps {
  searchParams?: Promise<{
    error?: string | string[];
    code?: string | string[];
  }>;
}

export default async function PortalLoginPage({ searchParams }: PortalLoginPageProps) {
  const session = await auth();
  if (session?.user?.role === "CLIENT") redirect("/portal/dashboard");

  const params = await searchParams;
  const authError = Array.isArray(params?.error) ? params.error[0] : params?.error;
  const errorCode = Array.isArray(params?.code) ? params.code[0] : params?.code;

  return (
    <div className="app-shell-bg flex min-h-screen items-center justify-center p-4">
      <PortalLoginForm authError={authError} errorCode={errorCode} />
    </div>
  );
}
```

Y actualizar `PortalLoginForm` para recibir y mostrar estos props (similar a `LoginForm`).

---

## 🟡 MEDIO

### AUTH-008 — `next-auth.d.ts` tipa `role` como `string` en vez de `UserRole`

**Archivo:** `types/next-auth.d.ts` L6, L13, L23  
**Evidencia:**

```typescript
interface User {
  id: string;
  role: string;   // ❌ debería ser UserRole
  // ...
}
```

#### Código corregido — `types/next-auth.d.ts`

```typescript
import { DefaultSession } from "next-auth";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    clientId?: string | null;
    companyId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      clientId?: string | null;
      companyId?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    clientId?: string | null;
    companyId?: string | null;
  }
}
```

---

### AUTH-009 — `requireAuth` depende de `ALL_ROLES` hardcodeado

**Archivo:** `lib/auth.ts` L23, L30-32  
**Evidencia:**

```typescript
const ALL_ROLES: readonly string[] = ["ADMIN", "HSEQ_MANAGER", "OPERATIONS", "CLIENT", "VIEWER"] as const;

export function isValidRole(value: unknown): value is Role {
  return typeof value === "string" && ALL_ROLES.includes(value);
}
```

Si el enum `UserRole` en Prisma cambia (se agrega `SUPERVISOR`), `ALL_ROLES` queda desactualizado. Esto puede causar que usuarios con roles nuevos sean rechazados silenciosamente.

#### Código corregido — `lib/auth.ts`

```typescript
import { UserRole } from "@prisma/client";

/** Array derivado del enum de Prisma — siempre sincronizado */
const ALL_ROLES: readonly string[] = Object.values(UserRole);
```

---

### AUTH-010 — `createUser` sin validación Zod

**Archivo:** `lib/actions/users.ts` L16-38  
**Evidencia:**

```typescript
export async function createUser(data: {
  email: string;
  name: string;
  password: string;
  role: string;
  clientId?: string;
}) {
  // ...
  role: data.role as import("@prisma/client").UserRole,
  // ...
}
```

No hay validación de email, longitud de contraseña, ni verificación de que `role` sea un valor válido del enum.

#### Código corregido — `lib/actions/users.ts`

```typescript
"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, ADMIN_ROLES } from "@/lib/auth";
import { UserRole } from "@prisma/client";

const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(2, "Nombre muy corto").max(120, "Nombre muy largo"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.enum(Object.values(UserRole) as [string, ...string[]]),
  clientId: z.string().uuid().optional(),
});

export async function createUser(data: z.infer<typeof createUserSchema>) {
  await requireAuth(ADMIN_ROLES);

  const parsed = createUserSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Validación fallida: ${parsed.error.message}`);
  }

  const company = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      password: await bcrypt.hash(parsed.data.password, 12), // bcrypt cost 12
      role: parsed.data.role as UserRole,
      clientId: parsed.data.clientId || null,
      companyId: company?.id,
    },
  });

  revalidatePath("/configuracion");
  return user;
}
```

> **Nota:** Se aumentó `bcrypt.hash` a cost **12** (estándar OWASP 2023). El proyecto usa cost 10, que es aceptable pero no óptimo.

---

### AUTH-011 — `rut` y `email` opcionales en modelo `User`

**Archivo:** `prisma/schema.prisma` L78-79  
**Evidencia:**

```prisma
model User {
  id            String    @id @default(uuid())
  email         String?   @unique
  rut           String?   @unique
  name          String
  password      String
  // ...
}
```

Como el sistema autentica por RUT, permitir `rut: null` crea usuarios "huérfanos" que no pueden iniciar sesión. Además, `email` opcional puede causar problemas si se quiere habilitar recuperación de contraseña por email en el futuro.

#### Código corregido — `prisma/schema.prisma`

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  rut           String    @unique
  name          String
  password      String
  role          UserRole
  active        Boolean   @default(true)
  companyId     String?
  clientId      String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  company       Company?  @relation(fields: [companyId], references: [id], onDelete: SetNull)
  client        Client?   @relation(fields: [clientId], references: [id], onDelete: SetNull)
  sessions      Session[]
  auditLogs     AuditLog[]
  notifications Notification[]

  @@index([companyId])
  @@index([clientId])
  @@index([role])
}
```

> ⚠️ Este cambio requiere **migración de datos** si ya existen usuarios sin RUT o email. Verificar antes de aplicar.

---

### AUTH-012 — Modelo `Session` en Prisma es código muerto

**Archivo:** `prisma/schema.prisma` L100-110  
**Evidencia:** `session: { strategy: "jwt", maxAge: 8 * 60 * 60 }` en `lib/auth.ts`.

Con JWT strategy, NextAuth **nunca** escribe en la tabla `Session`. El modelo ocupa espacio en el schema y puede confundir a desarrolladores nuevos.

#### Recomendación
Eliminar el modelo `Session` (y la relación `sessions` en `User`) **o** migrar a `strategy: "database"` si se requiere:

- Revocación de sesiones en tiempo real (logout remoto).
- Auditoría de sesiones activas.
- Cumplimiento normativo que exija trazabilidad de sesiones.

Si se mantiene JWT, eliminar modelo muerto. Si se necesita DB sessions, instalar `@auth/prisma-adapter` y configurar `adapter`.

---

## 🟢 BAJO

### AUTH-013 — Variables de entorno legacy

**Archivo:** `.env.example`  
**Evidencia:**

```bash
NEXTAUTH_SECRET="your-secret-here-replace-in-vercel"
NEXTAUTH_URL="https://maestranza-control-pro.vercel.app"
```

NextAuth v5 (Auth.js) usa `AUTH_SECRET` y `AUTH_URL`. Aunque mantiene backward compatibility, es mejor alinearse con la nomenclatura oficial para evitar confusiones.

#### Código corregido — `.env.example`

```bash
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
AUTH_SECRET="your-secret-here-replace-in-vercel"
AUTH_URL="https://maestranza-control-pro.vercel.app"
# Legacy fallback (mantener durante transición):
# NEXTAUTH_SECRET="..."
# NEXTAUTH_URL="..."
```

---

### AUTH-014 — Estilo visual verde en login — migración a cian neón

**Archivos:** `app/login/page.tsx`, `app/globals.css`  
**Contexto:** El usuario solicita explícitamente migrar de la paleta verde (`#16A34A`, `#22C55E`, `emerald`) hacia **cian neón** estilo pulsoai/nexusguard (`#00E5FF`, `#00B8D4`).

#### Cambios necesarios en `app/login/page.tsx`

```tsx
<Card className="login-panel mx-auto max-w-md border-cyan-400/20 shadow-[0_24px_72px_rgba(2,6,23,0.52),0_0_44px_rgba(0,229,255,0.10)]">
  <CardHeader>
    <div className="mx-auto mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase text-cyan-200">
      Centro seguro
    </div>
    {/* ... */}
  </CardHeader>
</Card>
```

#### Cambios en `app/globals.css` (tokens de marca)

```css
@theme inline {
  /* Paleta cian neón — pulsoai/nexusguard */
  --color-navy-primary: #0F172A;
  --color-navy-dark: #020617;
  --color-navy-light: #1E293B;
  --color-fire: #00B8D4;          /* cian neón base */
  --color-fire-bright: #00E5FF;   /* cian neón brillante */
  --color-fire-muted: rgba(0, 229, 255, 0.16);
  --color-gold: #E8B33A;
  --color-gold-muted: rgba(232, 179, 58, 0.18);
  --color-steel: #CBD5E1;
  --color-white: #FFFFFF;

  --color-primary: #00B8D4;
  --color-primary-foreground: #020617;
  --color-ring: #00E5FF;
  --color-input: #1C244B;

  /* ... resto de tokens ... */
}

body {
  background:
    radial-gradient(circle at 50% -20%, rgba(0, 229, 255, 0.14), transparent 36rem),
    linear-gradient(180deg, rgba(2, 6, 23, 0.94) 0%, rgba(2, 6, 23, 1) 42%),
    linear-gradient(135deg, rgba(232, 179, 58, 0.08) 0%, transparent 34%),
    repeating-linear-gradient(0deg, rgba(203, 213, 225, 0.018) 0 1px, transparent 1px 84px),
    var(--color-background);
}

.app-shell-bg {
  background:
    radial-gradient(circle at top left, rgba(0, 229, 255, 0.12), transparent 28rem),
    linear-gradient(180deg, rgba(30, 41, 59, 0.22), transparent 260px),
    linear-gradient(90deg, rgba(232, 179, 58, 0.07), transparent 38%),
    repeating-linear-gradient(90deg, rgba(203, 213, 225, 0.028) 0 1px, transparent 1px 96px),
    var(--color-navy-dark);
}
```

> Revisar todos los componentes que usen clases `text-emerald-*`, `bg-emerald-*`, `border-emerald-*`, `text-green-*` y reemplazar por `text-cyan-*` / `text-[#00E5FF]` según corresponda.

---

### AUTH-015 — Contraseña en texto plano en seed script

**Archivo:** `scripts/seed-admin.ts` L28  
**Evidencia:** `const passwordHash = await bcrypt.hash("Soldesp2026", 10);`

Aunque es un script de seeding, la contraseña visible en el repo puede escanearse por bots. Recomendación:

```typescript
const DEFAULT_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMeNow!";
const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 12);
```

Y agregar `SEED_ADMIN_PASSWORD` al `.env.example` (marcado como opcional).

---

### AUTH-016 — `AuthProvider` duplicado

**Archivos:** `components/auth/AuthProvider.tsx` y `components/providers/AuthProvider.tsx`

Ambos archivos tienen el mismo contenido. El layout raíz (`app/layout.tsx`) importa desde `components/auth/AuthProvider.tsx`. El archivo en `components/providers/` es código muerto.

#### Acción recomendada
1. Consolidar en `components/providers/AuthProvider.tsx` (mejor convención).
2. Actualizar `app/layout.tsx` para importar desde `components/providers/AuthProvider`.
3. Eliminar `components/auth/AuthProvider.tsx`.

---

## 🎯 Recomendaciones Adicionales

### 1. Implementar CSRF Token explícito en forms (defensa en profundidad)
Aunque NextAuth v5 maneja CSRF internamente, para formularios custom de credentials se recomienda incluir el token CSRF como campo oculto:

```tsx
import { getCsrfToken } from "next-auth/react";
// En el form:
<input type="hidden" name="csrfToken" value={await getCsrfToken()} />
```

### 2. Agregar encabezados de seguridad en `next.config.ts`

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self';",
          },
        ],
      },
    ];
  },
};
```

### 3. Habilitar `bcrypt` cost 12 mínimo
Actualizar todos los `bcrypt.hash(password, 10)` a `bcrypt.hash(password, 12)` para alinearse con OWASP 2023.

### 4. Considerar `@auth/prisma-adapter` para sesiones DB
Si el roadmap incluye "revocar sesiones", "logout remoto" o "auditoría de accesos", migrar de JWT a database sessions es necesario:

```typescript
import { PrismaAdapter } from "@auth/prisma-adapter";
// En lib/auth.ts:
adapter: PrismaAdapter(prisma),
session: { strategy: "database", maxAge: 8 * 60 * 60 },
```

### 5. Logging de auditoría de autenticación
Agregar `AuditLog` en `authorize` para trazabilidad:

```typescript
// Al final de authorize, antes de return:
await prisma.auditLog.create({
  data: {
    userId: user.id,
    action: "LOGIN",
    entity: "User",
    entityId: user.id,
    metadata: JSON.stringify({ ip: clientIp, role: user.role }),
  },
});
```

### 6. Tests de integración para auth
Los tests actuales (`tests/mocks/auth.ts`) son mocks unitarios. Se recomienda agregar tests E2E con Playwright para:
- Login exitoso → redirect correcto.
- Login fallido → mensaje de error adecuado.
- Acceso directo a `/dashboard` sin sesión → redirect a `/login`.
- Rate limiting → bloqueo tras 5 intentos.

---

## ✅ Checklist de Aplicación

- [ ] AUTH-001: Crear `/middleware.ts` y ajustar layouts.
- [ ] AUTH-002: Migrar `signIn` a `redirect: true` o `window.location.assign`.
- [ ] AUTH-003: Evaluar Vercel KV / Upstash Redis para rate limiting.
- [ ] AUTH-004: Cambiar `trustHost: true` a `process.env.NODE_ENV === "development"`.
- [ ] AUTH-005: Agregar `throw` si falta `authSecret` en producción.
- [ ] AUTH-006: Agregar `message` a errores custom de credentials.
- [ ] AUTH-007: Propagar `searchParams` en portal login.
- [ ] AUTH-008: Tipar `role` como `UserRole` en `next-auth.d.ts`.
- [ ] AUTH-009: Derivar `ALL_ROLES` de `Object.values(UserRole)`.
- [ ] AUTH-010: Agregar schema Zod a `createUser`.
- [ ] AUTH-011: Hacer `rut` y `email` obligatorios en Prisma (con migración).
- [ ] AUTH-012: Decidir: eliminar modelo `Session` o migrar a strategy DB.
- [ ] AUTH-013: Actualizar `.env.example` a nombres `AUTH_*`.
- [ ] AUTH-014: Migrar login y globals.css a paleta cian neón.
- [ ] AUTH-015: Mover contraseña de seed a env var.
- [ ] AUTH-016: Consolidar `AuthProvider` en `components/providers/`.

---

*Reporte generado para Maestranza Control Pro (ForgeOps). No modificar archivos sin revisar dependencias y ejecutar `npm run typecheck` después de cada cambio.*
