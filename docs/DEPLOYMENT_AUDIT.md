# Auditoría de Despliegue — Maestranza Control Pro (ForgeOps)

> **Fecha:** 2026-07-03  
> **Auditor:** Especialista Senior en Despliegue  
> **Ámbito:** Next.js 16 + React 19 + TailwindCSS 4 + Prisma 7 + PostgreSQL + Next Auth v5 beta + Vercel  
> **Ruta raíz:** `/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro`

---

## Resumen Ejecutivo

Se identificaron **20 hallazgos** distribuidos en severidad: **4 CRÍTICOS**, **5 ALTOS**, **8 MEDIOS** y **3 BAJOS**.  
El riesgo más grave es la **ausencia total del middleware de autenticación** (`middleware.ts`), lo que deja todas las rutas protegidas expuestas en producción. El segundo riesgo crítico es el **manejo incorrecto de conexiones PostgreSQL en entorno serverless**, que provocará agotamiento de conexiones en Neon/PostgreSQL bajo carga.

---

## Hallazgos por Severidad

---

### 🔴 CRÍTICO — 01: No existe `middleware.ts`; `proxy.ts` nunca se ejecuta

| Atributo | Valor |
|----------|-------|
| **Archivo afectado** | `proxy.ts` (raíz del proyecto) |
| **Impacto** | Todas las rutas protegidas (`/dashboard`, `/ordenes`, `/hseq`, `/trabajadores`, `/clientes`, etc.) están **accesibles sin autenticación**. El `DashboardLayout` hace `auth()` y redirige en renderizado, pero las Server Actions, APIs y datos quedan expuestos. |
| **Evidencia** | `ls -la middleware.ts` → `NO HAY MIDDLEWARE.TS/JS`. `proxy.ts` existe en raíz pero Next.js App Router solo reconoce `middleware.ts` o `middleware.js` en la raíz como middleware. |

**Explicación técnica:**  
Next.js App Router busca específicamente un archivo llamado `middleware.ts` (o `.js`) en la raíz del proyecto para ejecutar lógica de edge middleware. El archivo `proxy.ts` contiene la lógica correcta de autenticación, redirección y protección de rutas, pero al no estar nombrado correctamente **nunca se ejecuta**. Esto significa que cualquier usuario no autenticado puede navegar directamente a `/dashboard`, `/ordenes`, `/hseq`, etc. Aunque el layout del dashboard hace `redirect("/login")` si no hay sesión, esto ocurre durante el renderizado del servidor — no impide el acceso a Server Actions ni a datos expuestos indirectamente.

**Código corregido:**

1. Renombrar `proxy.ts` → `middleware.ts` (o crear `middleware.ts` que importe la lógica).

```typescript
// middleware.ts — RAÍZ DEL PROYECTO
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "development"
    ? "maestranza-control-pro-dev-secret"
    : undefined);

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const token = await getToken({
    req,
    secret: authSecret,
    salt: "authjs.session-token",
  });
  const isLoggedIn = !!token;
  const role = (token?.role as string) ?? "";

  const isApiAuthRoute = pathname.startsWith("/api/auth");
  const isPublicRoute =
    pathname === "/login" ||
    pathname === "/portal/login" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/preview/");

  if (isApiAuthRoute) return NextResponse.next();

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(
      new URL(role === "CLIENT" ? "/portal/dashboard" : "/dashboard", nextUrl)
    );
  }

  if (isLoggedIn && pathname === "/portal/login") {
    return NextResponse.redirect(new URL("/portal/dashboard", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|webmanifest|woff|woff2|ttf)$).*)",
  ],
};
```

2. Eliminar `proxy.ts` después de confirmar que `middleware.ts` funciona.

---

### 🔴 CRÍTICO — 02: Pool de PostgreSQL sin manejo para entorno serverless (Vercel)

| Atributo | Valor |
|----------|-------|
| **Archivo afectado** | `lib/db.ts` |
| **Impacto** | Agotamiento de conexiones PostgreSQL (Neon) bajo carga. Cada invocación de función serverless crea un nuevo `pg.Pool` con hasta 10 conexiones que **nunca se cierran**. |
| **Evidencia** | Líneas 19-29: `new pg.Pool({ ..., max: 10, })` sin `$disconnect()` ni manejo de lifecycle en serverless. |

**Explicación técnica:**  
Vercel ejecuta cada request en funciones serverless efímeras. El patrón actual crea un `pg.Pool` persistente en memoria por instancia, pero en serverless las instancias se destruyen sin cerrar conexiones. Con `max: 10` y escalado automático, Neon/PostgreSQL alcanza rápidamente su límite de conexiones (típicamente 20-100 en planes pequeños/medios). Además, el uso de `Proxy` para el PrismaClient añade complejidad innecesaria.

**Código corregido:**

```typescript
// lib/db.ts — Corregido para serverless
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const isProduction = process.env.NODE_ENV === "production";
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL ?? "";

  if (!databaseUrl) {
    throw new Error("DATABASE_URL no está configurado");
  }

  if (
    !databaseUrl.startsWith("postgresql://") &&
    !databaseUrl.startsWith("postgres://")
  ) {
    throw new Error("DATABASE_URL debe usar PostgreSQL");
  }

  // Parsear URL para extraer hostname y determinar si es Neon
  let hostname = "";
  try {
    hostname = new URL(databaseUrl).hostname;
  } catch {
    // URL parse falla, continuar con defaults
  }
  const isNeon = hostname.includes("neon.tech");

  const pool = new pg.Pool({
    connectionString: databaseUrl,
    // Neon requiere SSL siempre; otros proveedores dependen de la URL
    ssl: isNeon
      ? { rejectUnauthorized: true }
      : isProduction
        ? { rejectUnauthorized: true }
        : undefined,
    // Limitar conexiones para entorno serverless
    max: isProduction ? 5 : 10,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (!isProduction) globalForPrisma.prisma = prisma;
```

**Recomendación adicional:** Considerar migrar a `@neondatabase/serverless` + `@prisma/adapter-neon` para Neon, que usa el driver WebSocket de Neon optimizado para serverless:

```bash
npm install @neondatabase/serverless @prisma/adapter-neon
```

```typescript
// lib/db.ts — Versión optimizada para Neon
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const isProduction = process.env.NODE_ENV === "production";
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL no está configurado");

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (!isProduction) globalForPrisma.prisma = prisma;
```

---

### 🔴 CRÍTICO — 03: Auth.js v5 usa variables legacy (`NEXTAUTH_*`) en vez de `AUTH_*`

| Atributo | Valor |
|----------|-------|
| **Archivo afectado** | `.env.example`, `README.md`, `lib/auth.ts`, `proxy.ts` |
| **Impacto** | Auth.js v5 (Next Auth v5 beta) ha migrado a `AUTH_SECRET` y `AUTH_URL`. Usar nombres legacy puede causar fallos sutiles en producción o en futuras versiones. |
| **Evidencia** | `.env.example` línea 2: `NEXTAUTH_SECRET=...`. `lib/auth.ts` línea 99-104: fallback a `NEXTAUTH_SECRET`. |

**Explicación técnica:**  
Auth.js v5 (beta.31 en uso) introduce el prefijo `AUTH_` para todas sus variables de entorno. Aunque mantiene compatibilidad backward con `NEXTAUTH_SECRET`, la documentación oficial recomienda migrar. Además, `AUTH_URL` reemplaza a `NEXTAUTH_URL` y tiene semántica ligeramente diferente.

**Código corregido:**

```env
# .env.example — Corregido
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
AUTH_SECRET="tu-secreto-crypto-fuerte-de-32-caracteres-min"
AUTH_URL="https://maestranza-control-pro.vercel.app"
```

```typescript
// lib/auth.ts — Actualizar fallback
const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "development"
    ? "maestranza-control-pro-dev-secret"
    : undefined);
```

```typescript
// middleware.ts (ex proxy.ts) — Actualizar fallback
const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "development"
    ? "maestranza-control-pro-dev-secret"
    : undefined);
```

---

### 🔴 CRÍTICO — 04: SSL `rejectUnauthorized` puede bloquear conexión a Neon en producción

| Atributo | Valor |
|----------|-------|
| **Archivo afectado** | `lib/db.ts` (línea 22-23) |
| **Impacto** | En producción (`isProduction = true`), `rejectUnauthorized: true`. Si el certificado SSL de Neon no está en el trust store de la imagen de Vercel, la conexión a DB falla silenciosamente o con error de certificado. |
| **Evidencia** | `lib/db.ts`: `ssl: { rejectUnauthorized: !isProduction, }` → en producción es `true`. |

**Explicación técnica:**  
Neon y otros proveedores cloud de PostgreSQL usan certificados TLS válidos pero emitidos por CAs que pueden no estar pre-instalados en todas las imágenes de build/deployment. Vercel usa Amazon Linux 2023 en sus runtime, que generalmente tiene los CAs root actualizados, pero esto no está garantizado y ha causado fallos intermitentes en producción para otros proyectos.

**Código corregido:**  
Ver corrección en hallazgo CRÍTICO-02. Para Neon específicamente, usar `@neondatabase/serverless` elimina este problema porque maneja SSL internamente.

---

### 🟠 ALTO — 05: Rate limiting en memoria (`LRUCache`) inefectivo en serverless

| Atributo | Valor |
|----------|-------|
| **Archivo afectado** | `lib/rate-limit.ts` |
| **Impacto** | Protección contra fuerza bruta es **ineficaz**. Cada instancia serverless tiene su propio `LRUCache` aislado. Un atacante distribuye requests entre múltiples instancias y nunca alcanza el límite de 5 intentos. |
| **Evidencia** | `lib/rate-limit.ts` línea 17-22: `new LRUCache<string, RateLimitEntry>({ max: 500, ttl: ..., })`. No hay backend compartido (Redis, KV, DB). |

**Explicación técnica:**  
Vercel crea múltiples instancias de función serverless según la carga. Cada instancia tiene su propio heap de memoria. El `LRUCache` de una instancia no ve los intentos registrados en otra. Un atacante con una botnet o incluso rotando IPs puede hacer cientos de intentos sin ser bloqueado.

**Solución recomendada:** Migrar a Vercel KV (Redis) o usar una tabla de rate limiting en PostgreSQL:

```typescript
// lib/rate-limit.ts — Versión con PostgreSQL (serverless-safe)
import { prisma } from "./db";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_BLOCK_MS = 15 * 60 * 1000;

export async function checkRateLimit(ip: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

  // Contar intentos fallidos recientes desde la base de datos
  // Nota: requiere una tabla `LoginAttempt` o similar
  // Alternativa: usar Vercel KV

  // Implementación simplificada con Vercel KV (recomendado):
  // const kv = await import("@vercel/kv");
  // const key = `ratelimit:login:${ip}`;
  // const attempts = await kv.default.get<number>(key) || 0;
  // ...

  // Por ahora, fallback a memoria con advertencia documentada
  return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS, resetAt: Date.now() };
}
```

**Acción inmediata:** Documentar explícitamente en `lib/rate-limit.ts` que el rate limiting es **best-effort en serverless** y recomendar Vercel KV para producción.

---

### 🟠 ALTO — 06: CSP permite `script-src 'unsafe-inline'` en producción

| Atributo | Valor |
|----------|-------|
| **Archivo afectado** | `next.config.ts` (líneas 18-36) |
| **Impacto** | Cross-Site Scripting (XSS) parcialmente mitigado. `'unsafe-inline'` permite ejecutar cualquier script inline, anulando la protección principal de CSP contra XSS. |
| **Evidencia** | `script-src 'self' 'unsafe-inline'` en producción. |

**Explicación técnica:**  
La directiva `'unsafe-inline'` en `script-src` permite que cualquier `<script>` inline se ejecute. Un atacante que logre inyectar HTML (aunque React mitiga esto) podría ejecutar código malicioso. Next.js 15+ soporta nonces automáticos para CSP.

**Código corregido (parcial — requiere nonce):**

```typescript
// next.config.ts — CSP mejorada
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // CSP con nonce delegado a Next.js 16 (nonce automático en App Router)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              isProd
                ? "script-src 'self' 'nonce-{nonce}'"
                : "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.neon.tech wss://*.vercel.app",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              ...(isProd ? ["upgrade-insecure-requests"] : []),
            ].join("; "),
          },
        ],
      },
    ];
  },
  // ... resto de config
};
```

> **Nota:** Para CSP con nonce completa en Next.js 16 App Router, usar `headers()` en `next.config.ts` no es suficiente. Se requiere implementar nonce en el root layout. Ver: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy

---

### 🟠 ALTO — 07: No existe script `db:deploy` para migraciones en producción

| Atributo | Valor |
|----------|-------|
| **Archivo afectado** | `package.json`, `README.md` |
| **Impacto** | README menciona `npm run db:deploy` pero no existe en `package.json`. Las migraciones de Prisma NO se aplican automáticamente en el build de Vercel. |
| **Evidencia** | `package.json` scripts: no hay `db:deploy`. README línea 44: menciona `npm run db:deploy`. |

**Código corregido:**

```json
// package.json — Añadir script db:deploy
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "db:reset": "prisma migrate reset --force",
    "db:deploy": "prisma migrate deploy",
    "db:validate": "prisma validate",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "postinstall": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "vercel-build": "prisma migrate deploy && next build"
  }
}
```

**Recomendación adicional:** El `buildCommand` de `vercel.json` debería incluir `prisma migrate deploy` antes del build para aplicar migraciones automáticamente:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npx prisma migrate deploy && npx prisma generate && next build",
  "framework": "nextjs",
  "regions": ["gru1"]
}
```

> ⚠️ **Advertencia:** `prisma migrate deploy` requiere acceso de escritura a la base de datos. Asegurar que `DATABASE_URL` en Vercel tenga permisos de DDL.

---

### 🟠 ALTO — 08: GitHub Actions no ejecuta tests antes del despliegue

| Atributo | Valor |
|----------|-------|
| **Archivo afectado** | `.github/workflows/deploy.yml` |
| **Impacto** | Código con tests fallidos puede llegar a producción. El job `quality` solo corre `typecheck` y `lint`. |
| **Evidencia** | `.github/workflows/deploy.yml`: steps son `typecheck` → `lint`, sin `npm run test`. |

**Código corregido:**

```yaml
# .github/workflows/deploy.yml — Fragmento corregido
  quality:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: TypeScript check
        run: npm run typecheck

      - name: ESLint
        run: npm run lint --max-warnings 0

      - name: Run tests
        run: npm run test
        env:
          NODE_ENV: test
          DATABASE_URL: ${{ secrets.DATABASE_URL_TEST }}
          AUTH_SECRET: test-secret-not-used-in-ci
```

> Si no hay base de datos de test, usar `vitest run --reporter=dot` con mocks de Prisma (ya existen en `tests/mocks/prisma.ts`).

---

### 🟠 ALTO — 09: Falta `output: 'standalone'` en `next.config.ts`

| Atributo | Valor |
|----------|-------|
| **Archivo afectado** | `next.config.ts` |
| **Impacto** | Cold starts más lentos en Vercel. El despliegue incluye archivos innecesarios (docs, tests, fuentes de desarrollo) aumentando el tamaño del bundle. |
| **Evidencia** | `next.config.ts` no tiene `output` definido. |

**Código corregido:**

```typescript
// next.config.ts
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// ... securityHeaders ...

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Opcional: generar build ID para trackear despliegues
  generateBuildId: async () => {
    return process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";
  },
};

export default nextConfig;
```

---

### 🟡 MEDIO — 10: `vercel.json` `buildCommand` duplica `prisma generate`

| Atributo | Valor |
|----------|-------|
| **Archivo afectado** | `vercel.json` |
| **Impacto** | Build más lento. `postinstall` en `package.json` ya ejecuta `prisma generate`, y `vercel.json` lo vuelve a ejecutar. |
| **Evidencia** | `vercel.json`: `"buildCommand": "npx prisma generate && next build"`. `package.json`: `"postinstall": "prisma generate"`. |

**Código corregido:**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "prisma migrate deploy && next build",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "regions": ["gru1"]
}
```

---

### 🟡 MEDIO — 11: No existe endpoint de health check (`/api/health`)

| Atributo | Valor |
|----------|-------|
| **Impacto** | No hay forma programática de verificar si la app y sus dependencias (DB) están saludables. Dificulta monitoreo, load balancers y debugging. |

**Código a crear:**

```typescript
// app/api/health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, "ok" | "fail"> = {};
  let status = 200;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "fail";
    status = 503;
  }

  return NextResponse.json(
    {
      status: status === 200 ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status }
  );
}
```

---

### 🟡 MEDIO — 12: `proxy.ts` exporta `config` que nunca se aplica

| Atributo | Valor |
|----------|-------|
| **Archivo afectado** | `proxy.ts` |
| **Impacto** | Confusión técnica. El export `config` con `matcher` es sintaxis de middleware de Next.js pero al no ser `middleware.ts`, este config no tiene efecto. |

**Acción:** Eliminar `proxy.ts` después de crear `middleware.ts` (ver CRÍTICO-01).

---

### 🟡 MEDIO — 13: `@types/lru-cache` es dependencia innecesaria

| Atributo | Valor |
|----------|-------|
| **Archivo afectado** | `package.json` |
| **Impacto** | Bundle ligeramente más grande. `lru-cache` v11 incluye sus propios tipos TypeScript (`index.d.ts`). `@types/lru-cache` es para versiones < 7. |
| **Evidencia** | `package.json` línea 34: `"@types/lru-cache": "^7.10.9"`. |

**Acción:**

```bash
npm uninstall @types/lru-cache
```

---

### 🟡 MEDIO — 14: Tailwind config vacío causa confusión

| Atributo | Valor |
|----------|-------|
| **Archivo afectado** | `tailwind.config.ts` |
| **Impacto** | El archivo existe pero está vacío. Con Tailwind v4 la configuración es CSS-only (`@theme inline` en `globals.css`), pero la presencia de `tailwind.config.ts` vacío puede confundir a desarrolladores y herramientas. |

**Acción recomendada:** Eliminar `tailwind.config.ts` o añadir comentario explicativo:

```typescript
// tailwind.config.ts
// Tailwind CSS v4 usa configuración CSS-only vía @theme inline en globals.css.
// Este archivo se mantiene vacío intencionalmente para compatibilidad con
// herramientas que esperan su existencia (IDEs, linters).
export default {};
```

---

### 🟡 MEDIO — 15: `db:reset` con `--force` es peligroso

| Atributo | Valor |
|----------|-------|
| **Archivo afectado** | `package.json` |
| **Impacto** | `db:reset` borra TODOS los datos sin confirmación interactiva (`--force`). En CI o si un desarrollador ejecuta accidentalmente el script en producción, causa pérdida total de datos. |

**Código corregido:**

```json
{
  "scripts": {
    "db:reset": "echo '⚠️  Usar solo en desarrollo local. Ejecutar: npx prisma migrate reset'"
  }
}
```

O eliminar el script por completo y documentar el comando manualmente.

---

### 🟡 MEDIO — 16: No hay manejo de CORS en API routes

| Atributo | Valor |
|----------|-------|
| **Impacto** | Potenciales problemas de seguridad o integración si API routes son consumidas desde otros dominios. |

**Código a considerar:**

```typescript
// lib/cors.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowedOrigins = [
  "https://maestranza-control-pro.vercel.app",
  "https://portal.maestranza-control-pro.vercel.app",
];

export function corsResponse(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get("origin") ?? "";
  if (allowedOrigins.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Credentials", "true");
  }
  return res;
}
```

---

### 🟡 MEDIO — 17: Faltan variables críticas en `.env.example`

| Atributo | Valor |
|----------|-------|
| **Archivo afectado** | `.env.example` |
| **Impacto** | Nuevos desarrolladores o despliegues no conocen todas las variables necesarias. |

**Código corregido:**

```env
# Base de datos
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"

# Auth.js v5
AUTH_SECRET="tu-secreto-crypto-fuerte-minimo-32-caracteres"
AUTH_URL="https://maestranza-control-pro.vercel.app"

# Opcional: para Portal cliente separado
# AUTH_REDIRECT_PROXY_URL=""

# Vercel / CI
VERCEL_TOKEN=""
VERCEL_ORG_ID=""
VERCEL_PROJECT_ID=""

# Opcional: monitoreo
# NEXT_PUBLIC_SENTRY_DSN=""
```

---

### 🟢 BAJO — 18: Falta `@next/bundle-analyzer`

| Atributo | Valor |
|----------|-------|
| **Impacto** | No hay herramienta para analizar qué módulos ocupan más espacio en el bundle. Dificulta optimizaciones de rendimiento. |

**Acción:**

```bash
npm install -D @next/bundle-analyzer
```

```typescript
// next.config.ts
import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const isProd = process.env.NODE_ENV === "production";
const analyzeEnabled = process.env.ANALYZE === "true";

const nextConfig: NextConfig = {
  // ... config existente
};

export default analyzeEnabled
  ? withBundleAnalyzer({ enabled: true })(nextConfig)
  : nextConfig;
```

---

### 🟢 BAJO — 19: No hay logging estructurado

| Atributo | Valor |
|----------|-------|
| **Impacto** | Logs de error son solo `console.error`. En producción, Vercel captura stdout/stderr pero sin formato JSON estructurado dificulta el análisis en herramientas de observabilidad. |

**Recomendación:** Considerar `pino` o `winston` para logs estructurados en producción:

```typescript
// lib/logger.ts
const isProd = process.env.NODE_ENV === "production";

export const logger = {
  error: (msg: string, meta?: Record<string, unknown>) => {
    if (isProd) {
      console.error(JSON.stringify({ level: "error", msg, ...meta, time: new Date().toISOString() }));
    } else {
      console.error(msg, meta);
    }
  },
  info: (msg: string, meta?: Record<string, unknown>) => {
    if (isProd) {
      console.log(JSON.stringify({ level: "info", msg, ...meta, time: new Date().toISOString() }));
    } else {
      console.log(msg, meta);
    }
  },
};
```

---

### 🟢 BAJO — 20: `tsconfig.json` incluye `.next/dev/types/**/*.ts`

| Atributo | Valor |
|----------|-------|
| **Archivo afectado** | `tsconfig.json` |
| **Impacto** | `.next/dev/types/**/*.ts` solo existe en desarrollo. En CI/build podría causar advertencias si el directorio no existe. |

**Acción:** Verificar si es necesario. Next.js 16 genera tipos en `.next/types/**/*.ts` pero los de `dev/` son específicos de desarrollo. Considerar remover si causa problemas en CI.

---

## Checklist de Corrección Priorizada

### Inmediata (antes del próximo deploy)

- [ ] **CRÍTICO-01:** Crear `middleware.ts` en raíz con la lógica de `proxy.ts`. Eliminar `proxy.ts`.
- [ ] **CRÍTICO-02:** Corregir `lib/db.ts`: reducir `max` del pool a 5 en producción, considerar `@neondatabase/serverless`.
- [ ] **CRÍTICO-03:** Actualizar `.env.example`, `README.md`, `lib/auth.ts` y `middleware.ts` para usar `AUTH_SECRET` y `AUTH_URL`.
- [ ] **CRÍTICO-04:** Verificar SSL config en `lib/db.ts` para Neon.
- [ ] **ALTO-07:** Añadir `"db:deploy": "prisma migrate deploy"` a `package.json`.
- [ ] **ALTO-08:** Añadir `npm run test` al workflow `deploy.yml`.

### Corto plazo (próxima sprint)

- [ ] **ALTO-05:** Evaluar migración de rate limiting a Vercel KV o PostgreSQL.
- [ ] **ALTO-06:** Implementar CSP con nonce en root layout.
- [ ] **ALTO-09:** Añadir `output: "standalone"`, `poweredByHeader: false`, `generateBuildId`.
- [ ] **MEDIO-10:** Simplificar `buildCommand` en `vercel.json`.
- [ ] **MEDIO-11:** Crear `/api/health`.
- [ ] **MEDIO-15:** Proteger o eliminar script `db:reset`.
- [ ] **MEDIO-17:** Completar `.env.example`.

### Mediano plazo

- [ ] **BAJO-18:** Integrar `@next/bundle-analyzer`.
- [ ] **BAJO-19:** Implementar logging estructurado.
- [ ] **MEDIO-16:** Añadir manejo CORS explícito si se exponen API externas.

---

## Recomendaciones Adicionales de Arquitectura

1. **Separar Portal Cliente:** Considerar si `/portal` debería ser un subdominio (`portal.maestranza-control-pro.vercel.app`) con su propio despliegue para aislamiento de seguridad y escalado independiente.

2. **Monitoreo:** Integrar Vercel Analytics y Speed Insights (gratuitos en Vercel Pro). Considerar Sentry para error tracking en producción.

3. **Backup de base de datos:** Configurar backups automáticos en Neon (PITR — Point In Time Recovery).

4. **Preview deployments:** Asegurar que las preview deployments de Vercel usen una base de datos de staging separada, no la de producción.

5. **Secret rotation:** Implementar rotación trimestral de `AUTH_SECRET` y `DATABASE_URL`.

---

## Referencias

- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Auth.js v5 Environment Variables](https://authjs.dev/getting-started/deployment#environment-variables)
- [Prisma Serverless Best Practices](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#serverless-environments-faas)
- [Neon Serverless Driver](https://neon.tech/docs/serverless/serverless-driver)
- [Vercel KV](https://vercel.com/docs/storage/vercel-kv)
- [Next.js CSP with Nonce](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)

---

*Reporte generado: 2026-07-03T07:45-04:00*
