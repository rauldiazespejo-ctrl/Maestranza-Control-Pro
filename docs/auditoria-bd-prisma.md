# Auditoría BD/Prisma — Maestranza Control Pro (ForgeOps)

**Fecha de auditoría:** 2025-07-03  
**Área:** Base de Datos + Prisma ORM + PostgreSQL  
**Proyecto:** Maestranza Control Pro (ForgeOps)  
**Stack:** Next.js 16 + React 19 + TailwindCSS 4 + Prisma 7 + PostgreSQL + Next Auth v5 beta  
**Entorno de despliegue:** Vercel (serverless)  
**Ruta raíz:** `/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro`  
**Archivos revisados:** `prisma/schema.prisma`, `prisma/migrations/*`, `lib/db.ts`, `lib/auth.ts`, `lib/actions/*.ts`, `app/(dashboard)/*/page.tsx`, `prisma/seed.ts`, `prisma.config.ts`, `tests/mocks/prisma.ts`, `lib/validations/*.ts`

---

## 1. Errores y Riesgos Identificados

### 1.1 CRÍTICO — Sin transacciones en operaciones compuestas (Cascada de integridad)

**Archivos afectados:**
- `lib/actions/workorders.ts` (L72-96, L102-128)
- `lib/actions/hseq.ts` (L39-56, L66-82)
- `lib/actions/worker-assignments.ts` (L70-94, L99-113, L120-142)
- `lib/actions/workorder-tasks.ts` (L42-67, L80-104, L107-127, L136-157)
- `lib/actions/workers.ts` (L42-56, L62-76)
- `lib/actions/clients.ts` (L48-63, L69-84)
- `lib/actions/gantt.ts` (L34-52, L58-77)
- `lib/actions/documents.ts` (L71-99)
- `lib/actions/users.ts` (L26-39)

**Explicación técnica:**
Todas las operaciones de creación/actualización/eliminación realizan **al menos dos queries independientes**: (1) mutación de la entidad principal, y (2) inserción de `AuditLog`. Si la segunda falla (timeout de DB, conexión interrumpida, error de constraint), la entidad queda modificada **sin registro de auditoría**, violando el principio de trazabilidad HSEQ. En un contexto industrial regulado, la auditoría debe ser atómica con la operación.

Además, `recalcWorkOrderProgress` en `workorder-tasks.ts` ejecuta `findMany` + `update` sin transacción. Si hay concurrencia (dos usuarios modifican tareas simultáneamente), el cálculo de progreso puede quedar inconsistente.

**Código corregido (patrón para todas las actions):**

```ts
// lib/actions/workorders.ts — Ejemplo de createWorkOrder con transacción
export async function createWorkOrder(data: WorkOrderFormData) {
  const session = await requireAuth(OPERATIONS_ROLES);
  const parsed = workOrderSchema.parse(data);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.workOrder.create({
      data: {
        ...parsed,
        startDate: toDateOptional(parsed.startDate),
        dueDate: toDateOptional(parsed.dueDate),
        responsibleId: parsed.responsibleId || null,
        clientId: parsed.clientId || null,
        projectId: parsed.projectId || null,
        progress: Number(parsed.progress),
        estimatedCost: parsed.estimatedCost ? Number(parsed.estimatedCost) : null,
        actualCost: parsed.actualCost ? Number(parsed.actualCost) : null,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "WorkOrder",
        entityId: created.id,
      },
    });

    return created;
  }, {
    maxWait: 5000,
    timeout: 10000,
  });

  revalidatePath("/ordenes");
  return order;
}
```

```ts
// lib/actions/workorder-tasks.ts — recalcWorkOrderProgress seguro
async function recalcWorkOrderProgress(workOrderId: string, tx?: Prisma.TransactionClient) {
  const client = tx || prisma;
  const tasks = await client.workOrderTask.findMany({
    where: { workOrderId },
  });

  const progress =
    tasks.length > 0
      ? tasks.reduce(
          (sum, task) => sum + (task.completed ? 100 : Number(task.progress)),
          0
        ) / tasks.length
      : 0;

  await client.workOrder.update({
    where: { id: workOrderId },
    data: { progress: Math.round(progress * 100) / 100 },
  });
}

// Uso dentro de transacción:
export async function createWorkOrderTask(workOrderId: string, data: WorkOrderTaskFormData) {
  const session = await requireAuth(OPERATIONS_ROLES);
  const parsed = workOrderTaskSchema.parse(data);

  const result = await prisma.$transaction(async (tx) => {
    const task = await tx.workOrderTask.create({
      data: {
        workOrderId,
        title: parsed.title,
        description: parsed.description,
        progress: parsed.completed ? 100 : Number(parsed.progress),
        completed: parsed.completed,
        dueDate: toDateOptional(parsed.dueDate),
      },
    });

    await recalcWorkOrderProgress(workOrderId, tx);

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "WorkOrderTask",
        entityId: task.id,
        metadata: JSON.stringify({ workOrderId }),
      },
    });

    return task;
  });

  revalidatePath(`/ordenes/${workOrderId}`);
  return result;
}
```

---

### 1.2 CRÍTICO — Aislamiento de datos roto: `companyId` hardcodeado vía "primera empresa"

**Archivos afectados:**
- `lib/actions/workers.ts` L46
- `lib/actions/clients.ts` L47, L52
- `lib/actions/users.ts` L25-34
- `lib/actions/hseq.ts` L39, L46
- `app/(dashboard)/configuracion/page.tsx` L18

**Explicación técnica:**
El patrón `prisma.company.findFirst({ orderBy: { createdAt: "asc" } })` asigna **todas** las entidades creadas a la primera empresa de la tabla. Esto rompe completamente el modelo multi-tenant: si el sistema alguna vez da soporte a múltiples empresas (BOILER COMP, SOLDESP, etc.), los trabajadores, clientes, usuarios y registros HSEQ de una empresa aparecerán en la otra. Es un error de diseño arquitectónico.

La solución correcta es que `companyId` venga del contexto de sesión del usuario autenticado (ya existe `session.user.companyId` en el JWT), nunca de una heurística de BD.

**Código corregido:**

```ts
// lib/actions/workers.ts
export async function createWorker(data: WorkerFormData) {
  const session = await requireAuth(OPERATIONS_ROLES);
  if (!session.user.companyId) {
    throw new Error("El usuario no tiene una empresa asociada");
  }

  const parsed = workerSchema.parse(data);
  const worker = await prisma.$transaction(async (tx) => {
    const created = await tx.worker.create({
      data: {
        ...parsed,
        criticalExpires: toDateOptional(parsed.criticalExpires),
        companyId: session.user.companyId!,
      },
    });

    await tx.auditLog.create({
      data: { userId: session.user.id, action: "CREATE", entity: "Worker", entityId: created.id },
    });

    return created;
  });

  revalidatePath("/trabajadores");
  return worker;
}
```

```ts
// lib/actions/clients.ts
export async function createClient(data: ClientFormData) {
  const session = await requireAuth(OPERATIONS_ROLES);
  if (!session.user.companyId) {
    throw new Error("El usuario no tiene una empresa asociada");
  }

  const parsed = clientSchema.parse(data);
  const client = await prisma.$transaction(async (tx) => {
    const created = await tx.client.create({
      data: {
        ...parsed,
        rut: parsed.rut ? normalizeRut(parsed.rut) : null,
        companyId: session.user.companyId!,
        paymentTerm: parsed.paymentTerm ? Number(parsed.paymentTerm) : null,
      },
    });

    await tx.auditLog.create({
      data: { userId: session.user.id, action: "CREATE", entity: "Client", entityId: created.id },
    });

    return created;
  });

  revalidatePath("/clientes");
  return client;
}
```

```ts
// lib/actions/hseq.ts
export async function createHseqRecord(data: HseqRecordFormData) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  if (!HSEQ_ROLES.includes(session.user.role as typeof HSEQ_ROLES[number])) {
    throw new Error("No tienes permisos para crear registros HSEQ");
  }
  if (!session.user.companyId) {
    throw new Error("El usuario no tiene una empresa asociada");
  }

  const parsed = hseqRecordSchema.parse(data);
  const record = await prisma.$transaction(async (tx) => {
    const created = await tx.hseqRecord.create({
      data: {
        ...parsed,
        date: new Date(parsed.date),
        dueDate: toDateOptional(parsed.dueDate),
        responsibleId: parsed.responsibleId || null,
        companyId: session.user.companyId!,
      },
    });

    await tx.auditLog.create({
      data: { userId: session.user.id, action: "CREATE", entity: "HseqRecord", entityId: created.id },
    });

    return created;
  });

  revalidatePath("/hseq");
  return record;
}
```

```ts
// lib/actions/users.ts
export async function createUser(data: { email: string; name: string; password: string; role: string; clientId?: string }) {
  await requireAuth(ADMIN_ROLES);
  const session = await auth();
  if (!session?.user?.companyId) {
    throw new Error("El usuario no tiene una empresa asociada");
  }

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: await bcrypt.hash(data.password, 10),
        role: data.role as import("@prisma/client").UserRole,
        clientId: data.clientId || null,
        companyId: session.user.companyId!,
      },
    });

    await tx.auditLog.create({
      data: { userId: session.user.id, action: "CREATE", entity: "User", entityId: created.id },
    });

    return created;
  });

  revalidatePath("/configuracion");
  return user;
}
```

---

### 1.3 CRÍTICO — Uso directo de PrismaClient en Server Components (violación de arquitectura)

**Archivo afectado:** `app/(dashboard)/configuracion/page.tsx` L5, L16-20

**Explicación técnica:**
El archivo importa `prisma` directamente desde `@/lib/db` y ejecuta `prisma.company.findFirst()` dentro de un Server Component. Esto viola el patrón de "actions" que el resto del proyecto usa. Más grave: en Vercel serverless, cada render puede crear una nueva conexión a PostgreSQL si no se maneja correctamente el singleton. Además, mezclar queries directos con server actions dificulta el testing, el mocking y el rate-limiting.

**Código corregido:**

```ts
// lib/actions/company.ts (nuevo archivo)
"use server";

import { prisma } from "@/lib/db";
import { requireAuth, MANAGEABLE_ROLES } from "@/lib/auth";

export async function getCurrentCompany() {
  const session = await requireAuth(MANAGEABLE_ROLES);
  if (!session.user.companyId) return null;

  return prisma.company.findUnique({
    where: { id: session.user.companyId },
  });
}
```

```tsx
// app/(dashboard)/configuracion/page.tsx
import { Suspense } from "react";
import { ConfiguracionClient } from "@/components/configuracion/ConfiguracionClient";
import { getUsers } from "@/lib/actions/users";
import { getClients } from "@/lib/actions/clients";
import { getCurrentCompany } from "@/lib/actions/company";
import { requireAuth, MANAGEABLE_ROLES } from "@/lib/auth";
import { LoadingState } from "@/components/ui/LoadingState";

export const metadata = {
  title: "Configuración · ForgeOps",
};

export default async function ConfiguracionPage() {
  await requireAuth(MANAGEABLE_ROLES);

  const [users, company, clients] = await Promise.all([
    getUsers(),
    getCurrentCompany(),
    getClients(),
  ]);

  return (
    <Suspense fallback={<LoadingState />}>
      <ConfiguracionClient users={users} company={company} clients={clients} />
    </Suspense>
  );
}
```

---

### 1.4 CRÍTICO — Configuración de conexión PostgreSQL no optimizada para Vercel Serverless

**Archivo afectado:** `lib/db.ts` L19-30

**Explicación técnica:**
El pool se configura con `max: 10`, `connectionTimeoutMillis: 30000`, `idleTimeoutMillis: 30000`. En Vercel (entorno serverless con funciones efímeras), un pool de 10 conexiones por instancia puede agotar rápidamente el límite de conexiones de PostgreSQL (especialmente en planes Neon/Supabase gratuitos o de bajo costo). Además, el adapter `PrismaPg` + `pg.Pool` en serverless no garantiza que las conexiones se cierren cuando la función lambda termina.

La configuración SSL usa `rejectUnauthorized: !isProduction`, lo que en desarrollo acepta cualquier certificado. Esto es aceptable para dev, pero el seed.ts usa incondicionalmente `rejectUnauthorized: false`.

**Código corregido:**

```ts
// lib/db.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const isProduction = process.env.NODE_ENV === "production";
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL ?? "";

  if (!databaseUrl) {
    throw new Error("DATABASE_URL no está configurado");
  }

  if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
    throw new Error("DATABASE_URL debe usar PostgreSQL");
  }

  // Parsear DATABASE_URL para extraer parámetros de conexión si existen
  const url = new URL(databaseUrl);
  const sslMode = url.searchParams.get("sslmode") || url.searchParams.get("ssl");

  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl:
      isProduction || sslMode === "require"
        ? { rejectUnauthorized: true }
        : { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    max: isProduction ? 5 : 10,
    // Importante para serverless: cerrar conexiones inactivas rápidamente
    allowExitOnIdle: true,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: isProduction ? ["error"] : ["query", "error", "warn"],
  });
}

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

// Handler para limpieza en entornos serverless
if (isProduction && typeof process !== "undefined") {
  process.on("beforeExit", async () => {
    if (globalForPrisma.prisma) {
      await globalForPrisma.prisma.$disconnect();
    }
  });
}
```

---

### 1.5 CRÍTICO — Modelo `AuditLog` con FK incorrecta que limita auditoría a WorkOrders

**Archivo afectado:** `prisma/schema.prisma` L393-410

**Explicación técnica:**
El campo `entityId` de `AuditLog` tiene una relación foránea a `WorkOrder.id`:

```prisma
workOrder WorkOrder? @relation(fields: [entityId], references: [id], onDelete: SetNull)
```

Esto significa que `entityId` está tipado como FK a `WorkOrder`, por lo que no puede referenciar un `Client`, `Worker`, `HseqRecord`, etc. Cuando se intenta auditar otra entidad, Prisma puede fallar o requerir hacks. El `onDelete: SetNull` también hace que al eliminar una WorkOrder, todos sus audit logs pierdan la referencia (`entityId` → `null`), destruyendo la trazabilidad.

La auditoría HSEQ requiere **inmutabilidad de registros**: los logs no deben perder referencias ni ser eliminados.

**Código corregido (schema.prisma):**

```prisma
model AuditLog {
  id         String   @id @default(uuid())
  userId     String?
  action     String
  entity     String
  entityId   String?  // Campo genérico, sin FK a ninguna tabla específica
  metadata   String?
  createdAt  DateTime @default(now())

  user   User?  @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([entity])
  @@index([entityId])
  @@index([action])
  @@index([createdAt])
  @@index([entity, entityId]) // Índice compuesto para queries de auditoría por entidad
}
```

**Nota:** Requiere una migración que elimine la FK `AuditLog_entityId_fkey`.

---

### 1.6 ALTO — Ausencia de `companyId` en WorkOrder complica aislamiento de datos

**Archivo afectado:** `prisma/schema.prisma` L172-208

**Explicación técnica:**
`WorkOrder` no tiene campo `companyId` propio. Depende de `clientId` → `Client.companyId` o `projectId` → `Project.companyId` para determinar a qué empresa pertenece. Esto fuerza joins innecesarios en queries de dashboard y filtrado, y rompe el aislamiento si un cliente cambia de empresa (cambio de contrato).

**Código corregido (schema.prisma):**

```prisma
model WorkOrder {
  id                String          @id @default(uuid())
  code              String          @unique
  title             String
  description       String?
  status            WorkOrderStatus @default(nueva)
  priority          Priority        @default(media)
  startDate         DateTime?
  dueDate           DateTime?
  completedAt       DateTime?
  progress          Float           @default(0)
  responsibleId     String?
  clientId          String?
  projectId         String?
  companyId         String          // ← NUEVO: aislamiento directo
  estimatedCost     Float?
  actualCost        Float?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  client       Client?          @relation(fields: [clientId], references: [id], onDelete: SetNull)
  project      Project?         @relation(fields: [projectId], references: [id], onDelete: SetNull)
  responsible  Worker?          @relation(fields: [responsibleId], references: [id], onDelete: SetNull)
  company      Company          @relation(fields: [companyId], references: [id], onDelete: Cascade)
  tasks        WorkOrderTask[]
  assignments  WorkerAssignment[]
  documents    Document[]
  auditLogs    AuditLog[]
  ganttTasks   GanttTask[]

  @@index([status])
  @@index([clientId])
  @@index([projectId])
  @@index([responsibleId])
  @@index([dueDate])
  @@index([createdAt])
  @@index([status, dueDate])
  @@index([companyId])           // ← NUEVO
  @@index([companyId, status])   // ← NUEVO: query principal de dashboard
  @@index([companyId, createdAt])// ← NUEVO
}
```

Y agregar la relación inversa en `Company`:

```prisma
model Company {
  // ... campos existentes ...
  workOrders WorkOrder[] // ← NUEVO
}
```

---

### 1.7 ALTO — `User.rut` y `User.email` con `@unique` global impiden multi-tenancy

**Archivo afectado:** `prisma/schema.prisma` L78-79

**Explicación técnica:**
`email String? @unique` y `rut String? @unique` aseguran unicidad **global** en toda la base de datos. Si BOILER COMP y SOLDESP quieren tener usuarios con el mismo RUT de trabajador (un operario que trabaja para ambas empresas), o si un administrador gestiona ambas empresas con el mismo email, la base de datos lo rechazará.

**Código corregido (schema.prisma):**

```prisma
model User {
  id            String    @id @default(uuid())
  email         String?
  rut           String?
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
  @@index([email])              // ← Reemplaza @unique por índice
  @@index([rut])                // ← Reemplaza @unique por índice
  @@unique([email, companyId])  // ← NUEVO: email único por empresa
  @@unique([rut, companyId])    // ← NUEVO: RUT único por empresa
}
```

**Nota:** Esto requiere actualizar el login (`lib/auth.ts`) para buscar por `rut` **dentro del contexto de la empresa**, o al menos manejar el caso de múltiples resultados.

---

### 1.8 ALTO — Uso de `Float` para campos monetarios (pérdida de precisión)

**Archivos afectados:** `prisma/schema.prisma` L186-187, L312-318

**Explicación técnica:**
`estimatedCost`, `actualCost` en `WorkOrder`, y `stock`, `minStock`, `cost` en `Material` usan el tipo Prisma `Float`, que se mapea a `DOUBLE PRECISION` en PostgreSQL. Los tipos de punto flotante IEEE 754 introducen errores de redondeo en cálculos financieros (ej: 0.1 + 0.2 ≠ 0.3). En una plataforma industrial con órdenes de millones de pesos, estos errores pueden generar discrepancias contables.

**Código corregido (schema.prisma):**

```prisma
model WorkOrder {
  // ... campos existentes ...
  estimatedCost Decimal? @db.Decimal(19, 4)
  actualCost    Decimal? @db.Decimal(19, 4)
  // ...
}

model Material {
  // ... campos existentes ...
  stock    Decimal @default(0) @db.Decimal(19, 4)
  minStock Decimal? @db.Decimal(19, 4)
  cost     Decimal? @db.Decimal(19, 4)
  // ...
}
```

**Impacto en código TypeScript:** Prisma Client con `Decimal` devuelve objetos `Prisma.Decimal` (de la librería `decimal.js`). Las actions deben manejar esto:

```ts
// lib/actions/workorders.ts
import { Prisma } from "@prisma/client";

// En createWorkOrder:
estimatedCost: parsed.estimatedCost
  ? new Prisma.Decimal(parsed.estimatedCost)
  : null,
```

O usar strings en el form y convertir:
```ts
// Validación Zod para Decimal seguro
const decimalString = z.string().refine(
  (val) => !isNaN(Number(val)) && Number(val) >= 0,
  { message: "Debe ser un número válido" }
);
```

---

### 1.9 ALTO — `progress` en WorkOrder/WorkOrderTask/GanttTask sin constraint de rango

**Archivo afectado:** `prisma/schema.prisma` L182, L215, L275

**Explicación técnica:**
El campo `progress` es `Float` con `@default(0)` pero no tiene validación de rango a nivel de base de datos. Un bug en frontend o una API maliciosa podría insertar `progress: 999` o `progress: -50`, corrompiendo los cálculos de KPI y el dashboard.

**Código corregido (schema.prisma):**

```prisma
model WorkOrder {
  // ...
  progress Float @default(0)
  // ...
  @@index([status, dueDate])
  @@check(progress >= 0 && progress <= 100, name: "progress_range_check")
}

model WorkOrderTask {
  // ...
  progress Float @default(0)
  // ...
  @@check(progress >= 0 && progress <= 100, name: "task_progress_range_check")
}

model GanttTask {
  // ...
  progress Float @default(0)
  // ...
  @@check(progress >= 0 && progress <= 100, name: "gantt_progress_range_check")
}
```

---

### 1.10 ALTO — Filtros de búsqueda sin `mode: "insensitive"` (case-sensitive en PostgreSQL)

**Archivos afectados:**
- `lib/actions/workorders.ts` L29-34
- `lib/actions/workers.ts` L16-22
- `lib/actions/clients.ts` L17-23
- `lib/actions/documents.ts` L24-29

**Explicación técnica:**
PostgreSQL es case-sensitive por defecto en operaciones `LIKE`. Los filtros de búsqueda usan `contains` sin `mode: "insensitive"`, por lo que buscar "BOILER" no encontrará "boiler". Solo `lib/actions/search.ts` implementa correctamente el modo insensitive.

**Código corregido:**

```ts
// lib/actions/workorders.ts
if (filters?.search) {
  where.OR = [
    { code: { contains: filters.search, mode: "insensitive" } },
    { title: { contains: filters.search, mode: "insensitive" } },
  ];
}
```

---

### 1.11 MEDIO — Faltan `updatedAt` en modelos que deberían tenerlo

**Archivos afectados:** `prisma/schema.prisma`

| Modelo | Tiene updatedAt |
|--------|-----------------|
| Company | ✅ Sí |
| User | ✅ Sí |
| Session | ❌ No |
| Client | ✅ Sí |
| Contact | ❌ No |
| Project | ✅ Sí |
| WorkOrder | ✅ Sí |
| WorkOrderTask | ✅ Sí |
| Worker | ✅ Sí |
| WorkerAssignment | ❌ No |
| GanttTask | ✅ Sí |
| Equipment | ✅ Sí |
| Material | ✅ Sí |
| Document | ❌ No |
| HseqRecord | ✅ Sí |
| HseqAction | ✅ Sí |
| AuditLog | ❌ No (quizás apropósito) |
| Notification | ❌ No (quizás apropósito) |

**Código corregido (schema.prisma):**

```prisma
model Session {
  // ... campos existentes ...
  updatedAt DateTime @updatedAt // ← NUEVO
}

model Contact {
  // ... campos existentes ...
  createdAt DateTime @default(now()) // ← NUEVO
  updatedAt DateTime @updatedAt      // ← NUEVO
}

model WorkerAssignment {
  // ... campos existentes ...
  updatedAt DateTime @updatedAt // ← NUEVO
}

model Document {
  // ... campos existentes ...
  updatedAt DateTime @updatedAt // ← NUEVO
}
```

---

### 1.12 MEDIO — Seed.ts no usa transacciones y hace cleanup masivo sin rollback

**Archivo afectado:** `prisma/seed.ts` L42-63

**Explicación técnica:**
El seed ejecuta `deleteMany()` en cadena para limpiar tablas, pero si falla a mitad de camino, las tablas quedan en estado parcialmente limpio. Luego crea datos en secuencia sin transacción. En un entorno de desarrollo compartido o CI/CD, esto puede dejar la base de datos en estado inconsistente.

**Código corregido (extracto):**

```ts
// prisma/seed.ts
async function main() {
  console.log("Iniciando seed MAESTRANZA Control Pro...\n");

  await prisma.$transaction(async (tx) => {
    console.log("Limpiando...");
    await tx.notification.deleteMany();
    await tx.auditLog.deleteMany();
    await tx.session.deleteMany();
    await tx.document.deleteMany();
    await tx.hseqAction.deleteMany();
    await tx.hseqRecord.deleteMany();
    await tx.workerAssignment.deleteMany();
    await tx.workOrderTask.deleteMany();
    await tx.ganttTask.deleteMany();
    await tx.workOrder.deleteMany();
    await tx.project.deleteMany();
    await tx.contact.deleteMany();
    await tx.equipment.deleteMany();
    await tx.material.deleteMany();
    await tx.client.deleteMany();
    await tx.worker.deleteMany();
    await tx.user.deleteMany();
    await tx.company.deleteMany();
    console.log("Tablas limpias\n");

    // ... resto de creaciones dentro de la misma transacción ...
  }, {
    maxWait: 30000,
    timeout: 120000,
  });
}
```

---

### 1.13 MEDIO — `Record<string, unknown>` en filtros debilita type-safety

**Archivos afectados:** Múltiples actions (`workorders.ts`, `clients.ts`, `workers.ts`, `documents.ts`, etc.)

**Explicación técnica:**
El patrón `const where: Record<string, unknown> = {}` anula el sistema de tipos de Prisma. Aunque no es vulnerable a SQL injection (Prisma usa prepared statements), permite que errores de typos en nombres de campo pasen desapercibidos en tiempo de compilación.

**Código corregido (ejemplo workorders.ts):**

```ts
import type { Prisma } from "@prisma/client";

export async function getWorkOrders(filters?: {
  status?: string;
  priority?: string;
  clientId?: string;
  search?: string;
}) {
  const session = await requireAuth(READ_ROLES);
  const where: Prisma.WorkOrderWhereInput = {};

  if (session.user.role === "CLIENT" && session.user.clientId) {
    where.clientId = session.user.clientId;
  } else if (filters?.clientId) {
    where.clientId = filters.clientId;
  }

  if (filters?.status) where.status = filters.status as Prisma.WorkOrderStatus;
  if (filters?.priority) where.priority = filters.priority as Prisma.Priority;
  if (filters?.search) {
    where.OR = [
      { code: { contains: filters.search, mode: "insensitive" } },
      { title: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.workOrder.findMany({
    where,
    include: { client: true, responsible: true, project: true },
    orderBy: { createdAt: "desc" },
  });
}
```

---

### 1.14 MEDIO — Faltan índices críticos para queries de dashboard y reportes

**Archivo afectado:** `prisma/schema.prisma`

**Explicación técnica:**
El dashboard ejecuta queries como:
- `workOrder.count({ where: { status: { in: ACTIVE_STATUSES }, dueDate: { lt: now } } })`
- `hseqRecord.findMany({ where: { OR: [{ status: { in: ["abierto", "vencido"] } }, { dueDate: { lt: now } }] } })`

Sin índices compuestos adecuados, PostgreSQL debe hacer secuencial scans en tablas que crecerán rápidamente.

**Código corregido (schema.prisma):**

```prisma
model WorkOrder {
  // ... campos existentes ...
  @@index([status, dueDate, priority])   // ← Optimiza dashboard KPIs
  @@index([companyId, status, dueDate])  // ← Optimiza dashboard con company filter
  @@index([clientId, status])            // ← Portal cliente
  @@index([responsibleId, status])       // ← Vista por trabajador responsable
  @@index([priority, status])            // ← Ordenamiento por prioridad
}

model HseqRecord {
  // ... campos existentes ...
  @@index([companyId, status, dueDate])  // ← Dashboard HSEQ alerts
  @@index([type, status, dueDate])       // ← Filtrado por tipo + status
  @@index([norm, status])                // ← Reportes por norma
}

model Worker {
  // ... campos existentes ...
  @@index([companyId, status, name])     // ← Listado de trabajadores activos
  @@index([criticalExpires])             // ← Alertas de certificaciones por vencer
}
```

---

### 1.15 BAJO — UUIDs sin tipo nativo PostgreSQL

**Archivo afectado:** `prisma/schema.prisma` (todos los modelos con `@id`)

**Explicación técnica:**
Todos los IDs usan `String @id @default(uuid())`. Prisma genera `TEXT` en PostgreSQL para esto. Usar `@db.Uuid` con `@default(dbgenerated("gen_random_uuid()"))` o `@default(uuid())` permite que PostgreSQL almacene los UUIDs de forma nativa (16 bytes vs ~36 bytes de TEXT), ahorrando espacio en índices y mejorando performance en joins.

**Código corregido (ejemplo):**

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"] // Opcional para Prisma 7
}

model Company {
  id        String   @id @default(uuid()) @db.Uuid
  // ... resto igual ...
}

model User {
  id        String   @id @default(uuid()) @db.Uuid
  // ... resto igual ...
}
```

**Nota:** Esto es un cambio disruptivo que requiere recreación de la base de datos o migración cuidadosa de datos. Evaluar si el beneficio justifica el esfuerzo.

---

### 1.16 BAJO — Inconsistencia de naming en enums (español vs inglés)

**Archivo afectado:** `prisma/schema.prisma`

**Explicación técnica:**
- `UserRole` usa valores en INGLÉS: `ADMIN`, `HSEQ_MANAGER`, `OPERATIONS`
- `WorkOrderStatus` usa valores en ESPAÑOL: `nueva`, `planificada`, `en_proceso`
- `Priority` usa ESPAÑOL: `baja`, `media`, `alta`, `critica`
- `HseqType` usa ESPAÑOL: `inspeccion`, `incidente`

Esto genera confusión y dificulta la internacionalización futura. Los enums de Prisma deben preferir inglés (convención de la industria), con traducción en capa de UI.

**Recomendación (no cambiar ahora, planificar para v2):**

```prisma
enum WorkOrderStatus {
  NEW
  PLANNED
  IN_PROGRESS
  STOPPED
  REVIEW
  COMPLETED
  CLOSED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

---

### 1.17 BAJO — `scripts/seed-admin.ts` no verifica `NODE_ENV`

**Archivo afectado:** `scripts/seed-admin.ts`

**Explicación técnica:**
A diferencia de `prisma/seed.ts` que tiene protección `if (process.env.NODE_ENV === "production")`, `scripts/seed-admin.ts` puede ejecutarse accidentalmente en producción y crear/sobrescribir un superadmin.

**Código corregido:**

```ts
// scripts/seed-admin.ts
import { prisma } from "../lib/db";
import bcrypt from "bcryptjs";

if (process.env.NODE_ENV === "production") {
  console.error("ERROR: Este script no puede ejecutarse en producción.");
  process.exit(1);
}

async function main() {
  // ... resto igual ...
}
```

---

### 1.18 BAJO — Faltan `@@map` y `@map` para convención snake_case en PostgreSQL

**Archivo afectado:** `prisma/schema.prisma`

**Explicación técnica:**
Prisma usa camelCase para nombres de modelo y campo, pero PostgreSQL tradicionalmente usa snake_case. Aunque Prisma maneja el mapeo transparentemente, tener nombres de tabla en PascalCase puede causar problemas con herramientas externas de BI/reporting que esperan snake_case.

**Recomendación (opcional):**

```prisma
model WorkOrder {
  id        String   @id @default(uuid())
  // ...

  @@map("work_orders")
}

model WorkOrderTask {
  // ...
  @@map("work_order_tasks")
}
```

---

## 2. Recomendaciones Adicionales

### 2.1 Implementar Soft Deletes

En un sistema HSEQ industrial, **nunca** se debe eliminar físicamente un registro. Implementar `deletedAt` en todos los modelos principales:

```prisma
model WorkOrder {
  // ... campos existentes ...
  deletedAt DateTime?
  @@index([deletedAt])
}
```

Y modificar todas las queries para filtrar `where: { deletedAt: null }`.

### 2.2 Implementar Row Level Security (RLS) a nivel de aplicación

Aunque el código tiene verificaciones de `session.user.companyId` y `session.user.clientId`, no hay una capa centralizada de filtrado. Considerar crear un helper:

```ts
// lib/db/filters.ts
export function withCompanyFilter<T extends { companyId?: string | null }>(
  where: Prisma.Enumerable<T>,
  companyId: string | null | undefined
): T {
  if (!companyId) return where;
  return { ...where, companyId } as T;
}
```

### 2.3 Agregar `db:deploy` al pipeline de build de Vercel

En `package.json`:

```json
{
  "scripts": {
    "vercel-build": "prisma migrate deploy && next build"
  }
}
```

Esto asegura que las migraciones se apliquen antes de desplegar en producción.

### 2.4 Considerar connection pooling con PgBouncer/Neon

Si se usa Neon PostgreSQL (sugerido por la variable `neon.tech` en CSP), usar su connection pooling:

```env
DATABASE_URL="postgresql://user:pass@pooler.neon.tech/db?pgbouncer=true"
```

Y configurar Prisma con `directUrl` para migraciones:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}
```

### 2.5 Agregar health-check de base de datos

```ts
// app/api/health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "connected" });
  } catch {
    return NextResponse.json({ status: "error", db: "disconnected" }, { status: 503 });
  }
}
```

### 2.6 Migración inicial debe ser revisada

La migración `20260626103000_init_postgres` tiene fecha futura (2026-06-26). Prisma usa timestamps para ordenar migraciones; una fecha futura puede causar problemas si se crean migraciones con fecha anterior. Considerar renombrarla a la fecha real de creación.

---

## 3. Resumen por Severidad

| Severidad | Cantidad | Issues |
|-----------|----------|--------|
| CRÍTICO | 5 | Sin transacciones, companyId hardcodeado, Prisma en Server Components, Config conexión serverless, AuditLog FK incorrecta |
| ALTO | 5 | Falta companyId en WorkOrder, User.unique global, Float para dinero, progress sin rango, Búsqueda case-sensitive |
| MEDIO | 4 | Faltan updatedAt, Seed sin transacción, Record<string, unknown> sin tipos, Faltan índices críticos |
| BAJO | 4 | UUIDs sin tipo nativo, Inconsistencia naming enums, seed-admin sin protección, Falta @@map |

---

*Reporte generado por especialista BD/Prisma — Maestranza Control Pro (ForgeOps)*
