# PROMPT MAESTRO: Análisis de Errores y Corrección Automática

> **Uso:** Pega este prompt en cualquier sesión de IA (Kimi, Claude, GPT-4, etc.) para auditar automáticamente el proyecto **Maestranza Control Pro** (ForgeOps) o cualquier fork/successor del stack Next.js + Prisma + PostgreSQL + Auth.js v5.

---

## 1. CONTEXTO DEL PROYECTO

```
Nombre:     Maestranza Control Pro (ForgeOps)
Stack:      Next.js 16 + React 19 + TailwindCSS 4 + Prisma 7 + PostgreSQL + Auth.js v5 beta
Deploy:     Vercel (serverless functions, región gru1)
Estilo:     Dark cybersecurity — navy profundo (#020617) + acentos cian neón (#00E5FF, #00B8D4)
Arquitectura: App Router, Server Components + Client Components, Server Actions
```

---

## 2. CHECKLIST DE AUDITORÍA AUTOMÁTICA

Ejecuta las siguientes verificaciones en **TODO** el codebase. Clasifica cada hallazgo: 🔴 CRÍTICO | 🟠 ALTO | 🟡 MEDIO | 🟢 BAJO.

### 2.1 AUTENTICACIÓN Y SEGURIDAD (Auth)

| # | Verificación | ¿Cómo detectar? | Impacto si falla |
|---|-------------|-----------------|-----------------|
| A1 | ¿Existe `middleware.ts` en la raíz? | `ls middleware.ts` | Rutas protegidas accesibles sin login |
| A2 | ¿`signIn("credentials")` usa `redirect: false` + `router.push()`? | Buscar `redirect: false` en `LoginForm.tsx` | Race condition: rebote login↔dashboard |
| A3 | ¿Rate limiting usa memoria in-memory (LRUCache)? | Buscar `new LRUCache` en `lib/rate-limit.ts` | Inefectivo en Vercel serverless (múltiples instancias) |
| A4 | ¿`trustHost: true` está hardcodeado? | Buscar en `lib/auth.ts` | Host Header Injection en prod |
| A5 | ¿`authSecret` tiene fallback en producción? | Buscar `process.env.NODE_ENV === "development"` en auth config | Auth roto silenciosamente en prod |
| A6 | ¿Errores custom de `authorize` se muestran en UI? | Verificar que `errorCode` se propaga desde URL a form | Usuario ve mensaje genérico en vez de "demasiados intentos" |
| A7 | ¿Portal login recibe y muestra `searchParams.error`? | Revisar `app/portal/login/page.tsx` | Errores de portal login invisibles |
| A8 | ¿`next-auth.d.ts` tipa `role` como `UserRole`? | Revisar `types/next-auth.d.ts` | Type-safety rota en sesiones |
| A9 | ¿`requireAuth` deriva roles de Prisma enum? | Buscar `Object.values(UserRole)` | Desincronización si cambia enum |
| A10 | ¿`createUser` valida con Zod? | Revisar `lib/actions/users.ts` | Role injection, contraseñas débiles |
| A11 | ¿Modelo `Session` en Prisma está muerto (strategy JWT)? | Revisar `prisma/schema.prisma` | Confusión + tablas huérfanas |
| A12 | ¿Variables `.env` usan prefijo `AUTH_*` (v5) o `NEXTAUTH_*` (v4)? | Revisar `.env.example` | Fallos sutiles en futuras versiones |

### 2.2 BASE DE DATOS Y PRISMA (DB)

| # | Verificación | ¿Cómo detectar? | Impacto si falla |
|---|-------------|-----------------|-----------------|
| D1 | ¿Operaciones compuestas usan `$transaction`? | Buscar `auditLog.create` en actions; verificar si está dentro de tx | Trazabilidad HSEQ perdida si falla segundo query |
| D2 | ¿`companyId` se obtiene de sesión o de `findFirst`? | Buscar `prisma.company.findFirst` en actions | Multi-tenancy roto: todo va a primera empresa |
| D3 | ¿Prisma se importa directamente en Server Components? | Buscar `import { prisma }` en `app/**/*.tsx` (no actions) | Fuga de conexiones, arquitectura rota |
| D4 | ¿Pool PostgreSQL está optimizado para serverless? | Revisar `lib/db.ts`: `max`, timeouts, SSL | Agotamiento de conexiones en Neon/Vercel |
| D5 | ¿`AuditLog.entityId` es FK genérica o a `WorkOrder`? | Revisar `prisma/schema.prisma` | Auditoría limitada a órdenes de trabajo |
| D6 | ¿Campos monetarios usan `Decimal`? | Buscar `estimatedCost`, `actualCost`, `cost` en schema | Pérdida de precisión financiera |
| D7 | ¿`progress` tiene constraint de rango 0-100? | Buscar `@@check` en schema | Valores corruptos en KPIs |
| D8 | ¿Búsquedas usan `mode: "insensitive"`? | Buscar `contains:` sin `mode` en actions | Case-sensitive en PostgreSQL |
| D9 | ¿Faltan `updatedAt` en modelos transaccionales? | Revisar `Session`, `Contact`, `WorkerAssignment`, `Document` | Sin tracking de modificaciones |
| D10 | ¿Seed usa transacción? | Revisar `prisma/seed.ts` | BD en estado inconsistente si seed falla |
| D11 | ¿Filtros usan `Record<string, unknown>`? | Buscar `Record<string, unknown>` en actions | Type-safety anulada |
| D12 | ¿Índices compuestos críticos existen? | Revisar `@@index` en `WorkOrder`, `HseqRecord` | Sequential scans en dashboard |

### 2.3 DESPLIEGUE Y CONFIGURACIÓN (Deploy)

| # | Verificación | ¿Cómo detectar? | Impacto si falla |
|---|-------------|-----------------|-----------------|
| P1 | ¿Existe `middleware.ts` (no `proxy.ts`)? | `ls middleware.ts && ls proxy.ts` | Middleware nunca ejecuta |
| P2 | ¿`next.config.ts` tiene `output: "standalone"`? | Revisar `next.config.ts` | Cold starts lentos, bundle grande |
| P3 | ¿`package.json` tiene script `db:deploy`? | `cat package.json | grep db:deploy` | Migraciones no aplicadas en prod |
| P4 | ¿`vercel.json` incluye `prisma migrate deploy`? | Revisar `buildCommand` | Schema desactualizado en deploy |
| P5 | ¿SSL `rejectUnauthorized` está invertido? | Revisar `lib/db.ts` | Conexiones bloqueadas en prod |
| P6 | ¿CSP permite `unsafe-inline` en prod? | Revisar `next.config.ts` | XSS parcialmente mitigado |
| P7 | ¿`.env.example` tiene todas las variables críticas? | Comparar con lista de `process.env` en código | Nuevos devs/deploys sin config completa |
| P8 | ¿Existe endpoint `/api/health`? | `ls app/api/health/route.ts` | Sin monitoreo programático |
| P9 | ¿`db:reset` usa `--force`? | Revisar `package.json` | Pérdida de datos accidental |
| P10 | ¿Tests corren en CI antes de deploy? | Revisar `.github/workflows/*.yml` | Código roto en producción |

### 2.4 DISEÑO UI/UX (Design)

| # | Verificación | ¿Cómo detectar? | Impacto si falla |
|---|-------------|-----------------|-----------------|
| U1 | ¿Tokens CSS usan paleta objetivo (cian neón)? | Buscar `#16A34A`, `#22C55E`, `emerald-` en CSS/componentes | Identidad visual incorrecta |
| U2 | ¿Glassmorphism tiene `backdrop-filter` + gradiente overlay? | Revisar `.surface-glass` en CSS | Efecto translúcido roto o inconsistente |
| U3 | ¿Error boundaries mantienen tema dark? | Revisar `error.tsx`, `global-error.tsx` | Flash de light mode en errores |
| U4 | ¿Focus rings son consistentes en TODOS los inputs? | Revisar `input.tsx`, `textarea.tsx`, y componentes nativos | UX fragmentada, accesibilidad rota |
| U5 | ¿Toaster usa tokens CSS o colores hardcodeados? | Revisar `components/ui/Toaster.tsx` | Toasts inconsistentes con tema |
| U6 | ¿`tailwind.config.ts` está vacío sin documentación? | `cat tailwind.config.ts` | Confusión, plugins imposibles de añadir |
| U7 | ¿Scrollbar funciona en Firefox? | Buscar `scrollbar-width` en CSS | Scroll nativo feo en Firefox |
| U8 | ¿Badges críticos usan tokens o colores hardcodeados? | Revisar `badge.tsx` | Mantenibilidad rota |
| U9 | ¿Portal usa componentes `Table` de UI o tablas nativas? | Revisar `app/portal/**/*.tsx` | Inconsistencia visual grave |
| U10 | ¿`cn()` local duplica la de `lib/utils`? | Buscar `function cn(` en componentes | tailwind-merge ausente, bugs CSS |

---

## 3. FLUJO DE CORRECCIÓN AUTOMÁTICA

Para cada hallazgo detectado, sigue este orden:

1. **Documentar:** Anota el archivo, línea, severidad y explicación técnica.
2. **Proponer:** Genera el código corregido completo (no solo diff).
3. **Validar:** Verifica que la corrección no rompe dependencias (imports, tipos, relaciones).
4. **Priorizar:** Aplica primero 🔴 CRÍTICO, luego 🟠 ALTO, luego el resto.
5. **Testear:** Corre `npm run typecheck` y `npm run lint` después de cada batch de cambios.

---

## 4. COMANDOS DE VALIDACIÓN RÁPIDA

```bash
# 1. TypeScript
cd Maestranza-Control-Pro && npm run typecheck

# 2. Lint
cd Maestranza-Control-Pro && npm run lint

# 3. Prisma schema validation
cd Maestranza-Control-Pro && npx prisma validate

# 4. Prisma format
cd Maestranza-Control-Pro && npx prisma format

# 5. Build local (simula Vercel)
cd Maestranza-Control-Pro && npm run build

# 6. Tests
cd Maestranza-Control-Pro && npm run test
```

---

## 5. DECISION TREE — ¿QUÉ HACER CUANDO...?

```
¿No existe middleware.ts?
  └── CREAR inmediatamente. Copiar lógica de proxy.ts si existe, o crear desde cero.

¿signIn usa redirect: false?
  └── CAMBIAR a redirect: true O usar window.location.assign en vez de router.push().

¿Rate limit usa LRUCache in-memory?
  └── DOCUMENTAR que es best-effort en serverless. Planificar migración a Vercel KV/Redis.

¿trustHost: true está hardcodeado?
  └── CAMBIAR a: trustHost: process.env.NODE_ENV === "development"

¿authSecret sin validación en prod?
  └── AGREGAR throw new Error() si falta en producción.

¿Prisma en Server Component (no action)?
  └── EXTRAER a Server Action nueva en lib/actions/*.ts.

¿companyId viene de findFirst?
  └── CAMBIAR a session.user.companyId.

¿Operación muta + auditLog sin transacción?
  └── ENVOLVER en prisma.$transaction(async (tx) => { ... }).

¿Float para dinero?
  └── MIGRAR a Decimal @db.Decimal(19,4). Actualizar código TypeScript.

¿rejectUnauthorized: !isProduction?
  └── INVERTIR: rejectUnauthorized: isProduction.

¿globals.css usa verde (#16A34A)?
  └── REEMPLAZAR tokens fire/fire-bright por cyan/cyan-bright (#00B8D4 / #00E5FF).

¿error.tsx usa gray-50 / gray-100?
  └── REEMPLAZAR por navy-dark / navy-light / tokens del tema dark.
```

---

## 6. PLANTILLA DE REPORTE

Copia esta plantilla para cada hallazgo encontrado:

```markdown
### [ID] — [TÍTULO]
**Severidad:** 🔴 CRÍTICO / 🟠 ALTO / 🟡 MEDIO / 🟢 BAJO
**Archivo(s):** `ruta/al/archivo.ts` (LXX-YY)
**Impacto:** [1-2 oraciones del problema de negocio/UX/seguridad]

#### Explicación técnica
[Parrafo explicando la causa raíz del bug]

#### Código corregido
```ts
// Código completo listo para copiar y pegar
```

#### Acción recomendada
- [ ] Aplicar corrección
- [ ] Correr `npm run typecheck`
- [ ] Correr tests relacionados
- [ ] Desplegar a staging y validar
```

---

## 7. REFERENCIAS

- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Auth.js v5 Deployment](https://authjs.dev/getting-started/deployment)
- [Prisma Serverless Best Practices](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#serverless-environments-faas)
- [Neon Serverless Driver](https://neon.tech/docs/serverless/serverless-driver)
- [TailwindCSS v4 @theme inline](https://tailwindcss.com/docs/theme)
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

---

*Prompt generado: 2025-07-03*  
*Base de conocimiento: 4 auditorías paralelas (BD/Prisma, Auth/Login, Despliegue, UI/Diseño)*  
*Total de hallazgos documentados: 78+*
