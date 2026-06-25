# MAESTRANZA Control Pro

Aplicación fullstack para la gestión operacional, HSEQ y comercial de maestranza industrial. Desarrollada para **BOILER COMP S.A.** y **SOLDESP S.A.**

## Stack

- Next.js 16 App Router
- React 19 + TypeScript
- Tailwind CSS v4
- Prisma 7 + SQLite (local) / Turso (producción)
- Auth.js v5 (credentials, JWT, roles)
- React Hook Form + Zod
- Recharts + lucide-react

## Estructura del proyecto

```
app/
  (dashboard)/          # Panel interno protegido
    layout.tsx          # Sidebar + header
    page.tsx            # Redirección a dashboard
    dashboard/page.tsx  # KPIs y gráficos reales
    ordenes/page.tsx    # CRUD órdenes de trabajo
    trabajadores/page.tsx
    clientes/page.tsx
    gantt/page.tsx
    hseq/page.tsx
    reportes/page.tsx
    configuracion/page.tsx
  portal/               # Portal de clientes
    layout.tsx
    login/page.tsx
    dashboard/page.tsx
    ordenes/page.tsx
  login/page.tsx        # Login interno
  api/auth/[...nextauth]/route.ts
components/
  ui/                   # Componentes base reutilizables
  ordenes/
  trabajadores/
  clientes/
  gantt/
  hseq/
  reportes/
  configuracion/
  portal/
lib/
  auth.ts               # Configuración Auth.js
  db.ts                 # Singleton PrismaClient
  actions/              # Server actions por módulo
  validations/          # Schemas Zod
prisma/
  schema.prisma
  seed.ts
```

## Variables de entorno

Archivo `.env` para desarrollo local (copiar de `.env.example`):

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="maestranza-control-pro-secret-2026"
```

## Scripts

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run typecheck    # TypeScript --noEmit
npm run lint         # ESLint
npm run db:migrate   # prisma migrate dev
npm run db:seed      # Carga datos demo
npm run db:studio    # Prisma Studio
```

## Instalación rápida

```bash
cd maestranza-control-pro
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Abrir `http://localhost:3000`.

## Usuarios demo

| Rol | Email | Contraseña |
|---|---|---|
| ADMIN | `admin@boilercomp.com` | `demo1234` |
| HSEQ_MANAGER | `hseq@boilercomp.com` | `demo1234` |
| OPERATIONS | `ops@boilercomp.com` | `demo1234` |
| CLIENT | `cliente1@ejemplo.com` | `demo1234` |
| VIEWER | `viewer@boilercomp.com` | `demo1234` |

Portal cliente: `http://localhost:3000/portal/login`

## Datos demo cargados

- 2 empresas
- 6 clientes industriales
- 20 trabajadores
- 5 proyectos
- 15 órdenes de trabajo
- 60 tareas de OT
- 45 asignaciones
- 40 tareas Gantt
- 5 equipos
- 6 materiales
- 12 registros HSEQ

## Módulos implementados

1. **Dashboard** — KPIs operacionales, gráfico de estados, órdenes críticas, alertas HSEQ.
2. **Órdenes de trabajo** — CRUD completo, estados, prioridades, avance, responsable, cliente, proyecto, costos.
3. **Detalle de orden** — `/ordenes/[id]` con información general, dotación asignada, tareas internas y documentos.
4. **Trabajadores** — Dotación, especialidad, cargo, certificaciones, vencimientos, asignaciones activas.
5. **Clientes** — CRUD de clientes y contactos, conteo de órdenes.
6. **Carta Gantt** — Vista timeline por proyecto, filtro, avance, dependencias.
7. **HSEQ** — Registros por tipo y norma (ISO 45001, ISO 9001, ISO 14001, D.S. 44), responsables, vencimientos; detalle con documentos.
8. **Documentos** — `/documentos` con listado general; documentos vinculados a órdenes y registros HSEQ.
9. **Reportes** — Indicadores operacionales, órdenes atrasadas, exportación CSV.
10. **Configuración** — Datos de empresa, usuarios y roles.
11. **Portal cliente** — Login exclusivo para rol CLIENT, dashboard y órdenes filtradas por cliente.

## Verificación final

| Verificación | Resultado |
|---|---|
| `npm run typecheck` | ✅ Sin errores |
| `npm run lint` | ✅ Sin warnings/errors |
| `npm run build` | ✅ Build exitoso sin warnings |
| `npx prisma db seed` | ✅ Seed ejecutado con datos demo |
| Login ADMIN | ✅ Disponible en `/login` |
| Login CLIENT | ✅ Disponible en `/portal/login` |
| Middleware Next.js 16 | ✅ Migrado a `proxy.ts` |
| Base de datos Vercel | ✅ Configurado para Turso (SQLite serverless) |

## Despliegue en Vercel

### 1. Base de datos: Turso (SQLite serverless)

La app está preparada para usar **Turso** en producción, manteniendo SQLite y compatibilidad con el schema actual.

1. Crear cuenta en [Turso](https://turso.tech)
2. Instalar CLI: `brew install tursodatabase/tap/turso`
3. Crear base de datos:
   ```bash
   turso db create maestranza-control-pro
   turso db show maestranza-control-pro --url       # copiar DATABASE_URL
   turso db tokens create maestranza-control-pro    # copiar TURSO_AUTH_TOKEN
   ```

### 2. Configurar proyecto en Vercel

1. Importar el repositorio.
2. Seleccionar el directorio `maestranza-control-pro`.
3. Framework preset: Next.js.

### 3. Variables de entorno en Vercel Dashboard

| Variable | Valor |
|---|---|
| `DATABASE_URL` | URL de Turso, ej: `libsql://maestranza-control-pro-usuario.turso.io` |
| `TURSO_AUTH_TOKEN` | Token generado arriba |
| `NEXTAUTH_URL` | URL de producción, ej: `https://maestranza-control-pro.vercel.app` |
| `NEXTAUTH_SECRET` | Secreto aleatorio seguro (generar con `openssl rand -base64 32`) |

El archivo `vercel.json` configura:

```bash
prisma migrate deploy && next build
```

### 4. Aplicar migraciones y seed (primera vez)

Después del primer deploy exitoso, ejecutar desde local apuntando a Turso:

```bash
export DATABASE_URL="libsql://..."
export TURSO_AUTH_TOKEN="..."
npx prisma migrate deploy
npx prisma db seed
```

O usar Vercel CLI / Turso CLI para comandos one-off.

### 5. Region recomendada

`vercel.json` usa `scl1` (Santiago, Chile) para minimizar latencia.

## 📚 Documentación adicional

- [`docs/AVANCES_LOGRADOS.md`](./docs/AVANCES_LOGRADOS.md) — Funcionalidades implementadas, decisiones técnicas y verificaciones.
- [`docs/PENDIENTES.md`](./docs/PENDIENTES.md) — Plan de trabajo futuro, prioridades y deuda técnica.

## Notas

- Los prototipos originales (`01_maestranza-boiler`, `03_maestranza-gantt`) se preservan en la carpeta padre.
- Se migró de `middleware.ts` a `proxy.ts` siguiendo la convención de Next.js 16.
- La app usa SQLite local para desarrollo y Turso (SQLite serverless) para producción en Vercel.

