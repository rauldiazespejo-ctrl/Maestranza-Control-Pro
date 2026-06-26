# MAESTRANZA Control Pro

Aplicación fullstack para gestión operacional, HSEQ, documental y comercial de maestranza industrial para **BOILER COMP S.A.** y **SOLDESP S.A.**.

## Stack

- Next.js 16 App Router
- React 19 + TypeScript
- Tailwind CSS v4
- Prisma 7 + PostgreSQL/Neon
- Auth.js v5 con credentials, JWT y roles
- React Hook Form + Zod
- Recharts + lucide-react
- Vercel en producción, región `gru1`

## Variables de Entorno

Configurar en `.env` local y en Vercel/GitHub Secrets según corresponda:

```env
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
NEXTAUTH_SECRET="reemplazar-por-secreto-seguro"
NEXTAUTH_URL="https://maestranza-control-pro.vercel.app"
```

En GitHub Actions para deploy:

```env
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

No versionar `.env`, tokens ni URLs con credenciales embebidas.

## Scripts

```bash
npm run dev          # Desarrollo local
npm run build        # Build producción
npm run typecheck    # TypeScript --noEmit
npm run lint         # ESLint sin warnings
npm run db:migrate   # Crear/aplicar migraciones en desarrollo
npm run db:deploy    # Aplicar migraciones en producción
npm run db:seed      # Cargar datos demo/controlados
npm run db:studio    # Prisma Studio
```

## Instalación Local

```bash
npm install
cp .env.example .env
npm run db:deploy
npm run db:seed
npm run dev
```

Abrir `http://localhost:3000`.

## Autenticación

El acceso usa **RUT + contraseña**. La contraseña es obligatoria para todos los roles.

Roles soportados:

| Rol | Uso |
|---|---|
| `ADMIN` | Administración completa |
| `HSEQ_MANAGER` | Gestión HSEQ |
| `OPERATIONS` | Gestión operacional |
| `CLIENT` | Portal cliente |
| `VIEWER` | Solo lectura |

## Estructura Principal

```text
app/
  (dashboard)/        Panel interno protegido
  portal/             Portal cliente
  api/auth/           Endpoints Auth.js
components/
  ui/                 Componentes base
  dashboard/
  ordenes/
  hseq/
lib/
  auth.ts             Auth.js, RBAC y helpers de sesión
  db.ts               Prisma Client PostgreSQL
  actions/            Server actions por módulo
  validations/        Schemas Zod
prisma/
  schema.prisma
  migrations/
  seed.ts
```

## Migraciones

La base de producción es PostgreSQL. Las migraciones se versionan en `prisma/migrations`.

Flujo recomendado:

```bash
npx prisma migrate dev --name nombre_cambio
npm run typecheck
npm run lint
npm run build
git add prisma/migrations prisma/schema.prisma
```

En producción:

```bash
npm run db:deploy
```

## Despliegue

Vercel usa:

```json
{
  "buildCommand": "npx prisma generate && next build",
  "framework": "nextjs",
  "regions": ["gru1"]
}
```

El deploy automático está en `.github/workflows/deploy.yml` y ejecuta:

1. `npm ci`
2. `npm run typecheck`
3. `npm run lint --max-warnings 0`
4. `npm run build`
5. Deploy a Vercel con secrets

## Seguridad Operacional

- Rotar de inmediato cualquier token que haya sido expuesto en un remoto, log o configuración local.
- Rotar de inmediato cualquier `DATABASE_URL` o credencial Neon que haya sido incluida en scripts o commits históricos.
- No usar URLs remotas con tokens embebidos.
- Mantener `.env` fuera de Git.
- Revisar `npm audit` antes de cada release.
- Aplicar migraciones con Prisma, no con scripts SQL manuales sueltos.

## Verificación Antes de Producción

```bash
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev --audit-level=moderate
git status --short --branch
curl -I https://maestranza-control-pro.vercel.app
```

## Estado Actual Esperado

| Área | Resultado esperado |
|---|---|
| TypeScript | Sin errores |
| ESLint | Sin warnings/errors |
| Build | Exitoso |
| Auth.js | `/api/auth/[...nextauth]` presente |
| Base de datos | PostgreSQL vía `DATABASE_URL` |
| Deploy | Vercel producción |
