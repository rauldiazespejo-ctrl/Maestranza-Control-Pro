# Plan: Análisis de Errores + Corrección + Rediseño — Maestranza Control Pro

## Contexto del Proyecto
- **Nombre**: Maestranza Control Pro (ForgeOps)
- **Stack**: Next.js 16.2.9, React 19.2.4, TailwindCSS 4, Prisma 7.8, PostgreSQL, Next Auth v5 beta, Vercel
- **Ruta base**: `/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro`
- **Tono de marca**: Dark cybersecurity, navy profundo, acentos cian neón (estilo pulsoai/nexusguard)

## Problemas conocidos pre-exploración
1. **No existe `middleware.ts`** — rutas del dashboard sin protección
2. **`rejectUnauthorized: !isProduction` está invertido** en `lib/db.ts` — inseguro en prod
3. **Next Auth v5 beta.31** — versión experimental, posibles bugs con React 19
4. **Tabla `Session` en Prisma** pero auth usa `strategy: "jwt"` — tablas huérfanas
5. **Falta protección serverless** para Prisma en Vercel (sin `$disconnect`)
6. **Diseño actual usa verde (fire/emerald)** — usuario quiere cian neón + glassmorphism avanzado
7. **No hay manejo de errores 500** en API routes

## Etapas

### Etapa 1 — Investigación Paralela (4 subagentes)
Cada subagente investiga su área y produce un reporte con hallazgos + código corregido.

| Subagente | Área | Archivos clave |
|---|---|---|
| Analista_BD | Base de datos, Prisma, conexión, migraciones | `prisma/schema.prisma`, `lib/db.ts`, `prisma/migrations/`, `.env.example` |
| Analista_Auth | Login, autenticación, sesiones, seguridad | `lib/auth.ts`, `app/login/page.tsx`, `components/auth/LoginForm.tsx`, `components/auth/AuthProvider.tsx`, `app/api/auth/[...nextauth]/route.ts` |
| Analista_Despliegue | Configuración Next.js, Vercel, build, performance | `next.config.ts`, `vercel.json`, `package.json`, `app/layout.tsx` |
| Diseñador_UI | Glassmorphism, efectos translúcidos, neón cian, tendencias 2025/2026 | `app/globals.css`, `tailwind.config.ts` (vacío), `app/login/page.tsx`, `app/layout.tsx` |

### Etapa 2 — Integración + Prompt Maestro
- Consolidar hallazgos de los 4 subagentes
- Crear `PROMPT_ANALISIS_ERRORES.md` — prompt reusable para análisis automático de errores
- Aplicar correcciones críticas (BD, Auth, Middleware)
- Generar CSS de glassmorphism avanzado

### Entregables
1. `PROMPT_ANALISIS_ERRORES.md` — prompt maestro para análisis automático
2. Correcciones aplicadas a BD, Auth, Despliegue
3. Nuevo sistema de diseño con glassmorphism + neón cian
4. `middleware.ts` con protección de rutas
