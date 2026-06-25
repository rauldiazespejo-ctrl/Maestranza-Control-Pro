import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_Uw18kNsfFSMV@ep-gentle-river-atrldetf.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Connected to Neon!');

  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log(`Found ${tables.rows.length} tables`);

  if (tables.rows.length === 0) {
    console.log('Creating schema...');

    // Enums
    for (const e of [
      "CREATE TYPE \"UserRole\" AS ENUM ('ADMIN', 'HSEQ_MANAGER', 'OPERATIONS', 'CLIENT', 'VIEWER')",
      "CREATE TYPE \"WorkOrderStatus\" AS ENUM ('nueva', 'planificada', 'en_proceso', 'detenidas', 'revision', 'completada', 'cerrada')",
      "CREATE TYPE \"Priority\" AS ENUM ('baja', 'media', 'alta', 'critica')",
      "CREATE TYPE \"HseqType\" AS ENUM ('inspeccion', 'incidente', 'accion_correctiva', 'capacitacion', 'permiso_trabajo', 'matriz_riesgo')",
      "CREATE TYPE \"Norm\" AS ENUM ('ISO_45001', 'ISO_9001', 'ISO_14001', 'DS_44')",
      "CREATE TYPE \"HseqStatus\" AS ENUM ('abierto', 'en_revision', 'cerrado', 'vencido')",
    ]) {
      try { await client.query(`DO $$ BEGIN ${e}; EXCEPTION WHEN duplicate_object THEN null; END $$`); } catch {}
    }

    // Tables
    const creates = [
      `CREATE TABLE "Company" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "name" VARCHAR(255) NOT NULL, "rut" VARCHAR(50) UNIQUE NOT NULL, "address" TEXT, "phone" VARCHAR(100), "email" VARCHAR(255), "logoUrl" TEXT, "createdAt" TIMESTAMPTZ DEFAULT NOW(), "updatedAt" TIMESTAMPTZ DEFAULT NOW())`,
      `CREATE TABLE "User" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "email" VARCHAR(255) UNIQUE NOT NULL, "name" VARCHAR(255) NOT NULL, "password" TEXT NOT NULL, "role" "UserRole" NOT NULL, "active" BOOLEAN DEFAULT true, "companyId" UUID, "clientId" UUID, "createdAt" TIMESTAMPTZ DEFAULT NOW(), "updatedAt" TIMESTAMPTZ DEFAULT NOW())`,
      `CREATE TABLE "Session" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "sessionToken" VARCHAR(255) UNIQUE NOT NULL, "userId" UUID NOT NULL, "expires" TIMESTAMPTZ NOT NULL, "createdAt" TIMESTAMPTZ DEFAULT NOW())`,
      `CREATE TABLE "Client" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "companyId" UUID NOT NULL, "name" VARCHAR(255) NOT NULL, "rut" VARCHAR(50), "industry" VARCHAR(100), "address" TEXT, "phone" VARCHAR(100), "email" VARCHAR(255), "paymentTerm" INT, "notes" TEXT, "createdAt" TIMESTAMPTZ DEFAULT NOW(), "updatedAt" TIMESTAMPTZ DEFAULT NOW())`,
      `CREATE TABLE "Contact" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "clientId" UUID NOT NULL, "name" VARCHAR(255) NOT NULL, "role" VARCHAR(100), "email" VARCHAR(255), "phone" VARCHAR(100), "isMain" BOOLEAN DEFAULT false)`,
      `CREATE TABLE "Project" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "companyId" UUID NOT NULL, "clientId" UUID, "name" VARCHAR(255) NOT NULL, "code" VARCHAR(50), "description" TEXT, "startDate" TIMESTAMPTZ, "endDate" TIMESTAMPTZ, "status" VARCHAR(50) DEFAULT 'activo', "createdAt" TIMESTAMPTZ DEFAULT NOW(), "updatedAt" TIMESTAMPTZ DEFAULT NOW())`,
      `CREATE TABLE "WorkOrder" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "code" VARCHAR(50) UNIQUE NOT NULL, "title" VARCHAR(255) NOT NULL, "description" TEXT, "status" "WorkOrderStatus" DEFAULT 'nueva', "priority" "Priority" DEFAULT 'media', "startDate" TIMESTAMPTZ, "dueDate" TIMESTAMPTZ, "completedAt" TIMESTAMPTZ, "progress" FLOAT DEFAULT 0, "responsibleId" UUID, "clientId" UUID, "projectId" UUID, "estimatedCost" FLOAT, "actualCost" FLOAT, "createdAt" TIMESTAMPTZ DEFAULT NOW(), "updatedAt" TIMESTAMPTZ DEFAULT NOW())`,
      `CREATE TABLE "WorkOrderTask" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "workOrderId" UUID NOT NULL, "title" VARCHAR(255) NOT NULL, "description" TEXT, "progress" FLOAT DEFAULT 0, "completed" BOOLEAN DEFAULT false, "dueDate" TIMESTAMPTZ, "createdAt" TIMESTAMPTZ DEFAULT NOW(), "updatedAt" TIMESTAMPTZ DEFAULT NOW())`,
      `CREATE TABLE "Worker" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "companyId" UUID NOT NULL, "name" VARCHAR(255) NOT NULL, "rut" VARCHAR(50) UNIQUE NOT NULL, "position" VARCHAR(255) NOT NULL, "specialty" VARCHAR(255), "status" VARCHAR(50) DEFAULT 'activo', "certifications" TEXT, "criticalExpires" TIMESTAMPTZ, "phone" VARCHAR(100), "email" VARCHAR(255), "createdAt" TIMESTAMPTZ DEFAULT NOW(), "updatedAt" TIMESTAMPTZ DEFAULT NOW())`,
      `CREATE TABLE "WorkerAssignment" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "workerId" UUID NOT NULL, "workOrderId" UUID NOT NULL, "startDate" TIMESTAMPTZ, "endDate" TIMESTAMPTZ, "hours" FLOAT, "createdAt" TIMESTAMPTZ DEFAULT NOW(), UNIQUE("workerId", "workOrderId"))`,
      `CREATE TABLE "GanttTask" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "projectId" UUID NOT NULL, "workOrderId" UUID, "name" VARCHAR(255) NOT NULL, "startDate" TIMESTAMPTZ NOT NULL, "endDate" TIMESTAMPTZ NOT NULL, "progress" FLOAT DEFAULT 0, "status" VARCHAR(50) DEFAULT 'pendiente', "dependencies" TEXT, "responsible" VARCHAR(255), "createdAt" TIMESTAMPTZ DEFAULT NOW(), "updatedAt" TIMESTAMPTZ DEFAULT NOW())`,
      `CREATE TABLE "Equipment" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "companyId" UUID NOT NULL, "name" VARCHAR(255) NOT NULL, "code" VARCHAR(50) UNIQUE, "type" VARCHAR(100), "status" VARCHAR(50) DEFAULT 'disponible', "lastService" TIMESTAMPTZ, "nextService" TIMESTAMPTZ, "createdAt" TIMESTAMPTZ DEFAULT NOW(), "updatedAt" TIMESTAMPTZ DEFAULT NOW())`,
      `CREATE TABLE "Material" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "companyId" UUID NOT NULL, "name" VARCHAR(255) NOT NULL, "code" VARCHAR(50) UNIQUE, "unit" VARCHAR(50), "stock" FLOAT DEFAULT 0, "minStock" FLOAT, "cost" FLOAT, "createdAt" TIMESTAMPTZ DEFAULT NOW(), "updatedAt" TIMESTAMPTZ DEFAULT NOW())`,
      `CREATE TABLE "HseqRecord" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "companyId" UUID NOT NULL, "type" "HseqType" NOT NULL, "norm" "Norm" NOT NULL, "description" TEXT NOT NULL, "responsibleId" UUID, "date" TIMESTAMPTZ DEFAULT NOW(), "dueDate" TIMESTAMPTZ, "status" "HseqStatus" DEFAULT 'abierto', "evidenceDocumental" TEXT, "signatureRequired" BOOLEAN DEFAULT false, "signed" BOOLEAN DEFAULT false, "signedAt" TIMESTAMPTZ, "createdAt" TIMESTAMPTZ DEFAULT NOW(), "updatedAt" TIMESTAMPTZ DEFAULT NOW())`,
      `CREATE TABLE "HseqAction" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "hseqRecordId" UUID NOT NULL, "description" TEXT NOT NULL, "responsible" VARCHAR(255), "dueDate" TIMESTAMPTZ, "completed" BOOLEAN DEFAULT false, "completedAt" TIMESTAMPTZ, "createdAt" TIMESTAMPTZ DEFAULT NOW(), "updatedAt" TIMESTAMPTZ DEFAULT NOW())`,
      `CREATE TABLE "Document" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "workOrderId" UUID, "hseqRecordId" UUID, "name" VARCHAR(255) NOT NULL, "url" TEXT NOT NULL, "type" VARCHAR(100), "public" BOOLEAN DEFAULT false, "createdAt" TIMESTAMPTZ DEFAULT NOW())`,
      `CREATE TABLE "AuditLog" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "userId" UUID, "action" VARCHAR(100) NOT NULL, "entity" VARCHAR(100) NOT NULL, "entityId" UUID, "metadata" TEXT, "createdAt" TIMESTAMPTZ DEFAULT NOW())`,
      `CREATE TABLE "Notification" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "userId" UUID NOT NULL, "title" VARCHAR(255) NOT NULL, "message" TEXT NOT NULL, "read" BOOLEAN DEFAULT false, "createdAt" TIMESTAMPTZ DEFAULT NOW())`,
    ];

    for (const c of creates) {
      try { await client.query(c); } catch (e) { console.log('Table create err:', e.message.split('\n')[0]); }
    }
    console.log('Tables created!');

    // FKs
    const fks = [
      'ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL',
      'ALTER TABLE "User" ADD CONSTRAINT "User_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL',
      'ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE',
      'ALTER TABLE "Client" ADD CONSTRAINT "Client_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE',
      'ALTER TABLE "Contact" ADD CONSTRAINT "Contact_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE',
      'ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE',
      'ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL',
      'ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "Worker"("id") ON DELETE SET NULL',
      'ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL',
      'ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL',
      'ALTER TABLE "WorkOrderTask" ADD CONSTRAINT "WorkOrderTask_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE',
      'ALTER TABLE "Worker" ADD CONSTRAINT "Worker_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE',
      'ALTER TABLE "WorkerAssignment" ADD CONSTRAINT "WorkerAssignment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE',
      'ALTER TABLE "WorkerAssignment" ADD CONSTRAINT "WorkerAssignment_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE',
      'ALTER TABLE "GanttTask" ADD CONSTRAINT "GanttTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE',
      'ALTER TABLE "GanttTask" ADD CONSTRAINT "GanttTask_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL',
      'ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE',
      'ALTER TABLE "Material" ADD CONSTRAINT "Material_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE',
      'ALTER TABLE "HseqRecord" ADD CONSTRAINT "HseqRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE',
      'ALTER TABLE "HseqRecord" ADD CONSTRAINT "HseqRecord_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "Worker"("id") ON DELETE SET NULL',
      'ALTER TABLE "HseqAction" ADD CONSTRAINT "HseqAction_hseqRecordId_fkey" FOREIGN KEY ("hseqRecordId") REFERENCES "HseqRecord"("id") ON DELETE CASCADE',
      'ALTER TABLE "Document" ADD CONSTRAINT "Document_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE',
      'ALTER TABLE "Document" ADD CONSTRAINT "Document_hseqRecordId_fkey" FOREIGN KEY ("hseqRecordId") REFERENCES "HseqRecord"("id") ON DELETE CASCADE',
      'ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL',
      'ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE',
    ];
    for (const fk of fks) {
      try { await client.query(fk); } catch {}
    }
    console.log('FKs applied!');

    // Seed
    console.log('Seeding...');
    const companyId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const hash = '$2b$10$YQfZK1zK1Jf0D5b8qJQ4OqJQ4OqJQ4OqJQ4OqJQ4OqJQ4OqJQ4OqJQ';

    await client.query({
      text: `INSERT INTO "Company" (id, name, rut, address, phone, email) VALUES ($1, 'Soldesp S.A.', '76.841.820-9', 'Av.Principal 123, Santiago', '+56 2 2345 6789', 'contacto@soldesp.cl') ON CONFLICT (rut) DO NOTHING`,
      values: [companyId]
    });

    await client.query({
      text: `INSERT INTO "User" (id, email, name, password, role, companyId, active) VALUES ($1, 'admin@soldesp.cl', 'Raul Diaz', $2, 'ADMIN', $3, true) ON CONFLICT (email) DO NOTHING`,
      values: ['b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', hash, companyId]
    });

    const workers = [
      ['Carlos Mendez', '12.345.678-9', 'Soldador', 'Soldadura Industrial'],
      ['Juan Perez', '13.456.789-0', 'Tornero', 'Torneria CNC'],
      ['Pedro Lopez', '14.567.890-1', 'Montador', 'Montaje Estructural'],
      ['Luis Garcia', '15.678.901-2', 'Electricista', 'Instalaciones Electricas'],
    ];
    for (const [name, rut, pos, spec] of workers) {
      await client.query({
        text: `INSERT INTO "Worker" (companyId, name, rut, position, specialty, status) VALUES ($1, $2, $3, $4, $5, 'activo') ON CONFLICT (rut) DO NOTHING`,
        values: [companyId, name, rut, pos, spec]
      });
    }

    const clients = [
      ['Minera El Teniente', '88.888.888-8', 'Mineria'],
      ['SQM Salar', '77.777.777-7', 'Quimica'],
      ['Codelco Radomiro Tomic', '66.666.666-6', 'Mineria'],
    ];
    for (const [name, rut, industry] of clients) {
      await client.query({
        text: `INSERT INTO "Client" (companyId, name, rut, industry, paymentTerm) VALUES ($1, $2, $3, $4, 30) ON CONFLICT (rut) DO NOTHING`,
        values: [companyId, name, rut, industry]
      });
    }
    console.log('Seed done!');
  }

  const final = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log(`\nNeon ahora tiene ${final.rows.length} tablas:`);
  final.rows.forEach(t => console.log(' -', t.table_name));

  await client.end();
  console.log('\nListo!');
}

main().catch(e => { console.error(e.message); process.exit(1); });
