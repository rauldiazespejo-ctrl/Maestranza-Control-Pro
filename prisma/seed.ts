import "dotenv/config";
import { PrismaClient, UserRole, WorkOrderStatus, Priority, HseqType, Norm, HseqStatus } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import path from "path";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

function createAdapter() {
  if (databaseUrl.startsWith("libsql://")) {
    return new PrismaLibSql({ url: databaseUrl, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  const sqliteFilePath = databaseUrl.startsWith("file:")
    ? path.resolve(databaseUrl.replace("file:", "").replace(/^\.\//, ""))
    : path.resolve(databaseUrl);
  return new PrismaBetterSqlite3({ url: sqliteFilePath });
}

const prisma = new PrismaClient({ adapter: createAdapter() });

const DEMO_PASSWORD = "demo1234";

async function main() {
  console.log("🌱 Iniciando seed de MAESTRANZA Control Pro...\n");

  // ---------------------------------------------------------------------------
  // 1. Limpieza segura respetando foreign keys (orden inverso a dependencias)
  // ---------------------------------------------------------------------------
  console.log("🧹 Limpiando tablas existentes...");

  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.session.deleteMany(),
    prisma.document.deleteMany(),
    prisma.hseqAction.deleteMany(),
    prisma.hseqRecord.deleteMany(),
    prisma.workerAssignment.deleteMany(),
    prisma.workOrderTask.deleteMany(),
    prisma.ganttTask.deleteMany(),
    prisma.workOrder.deleteMany(),
    prisma.project.deleteMany(),
    prisma.contact.deleteMany(),
    prisma.equipment.deleteMany(),
    prisma.material.deleteMany(),
    prisma.client.deleteMany(),
    prisma.worker.deleteMany(),
    prisma.user.deleteMany(),
    prisma.company.deleteMany(),
  ]);

  console.log("✅ Tablas limpiadas.\n");

  // ---------------------------------------------------------------------------
  // 2. Empresas
  // ---------------------------------------------------------------------------
  console.log("🏢 Creando empresas...");

  const boilerComp = await prisma.company.create({
    data: {
      name: "BOILER COMP S.A.",
      rut: "76.238.153-2",
      address: "Av. Presidente Eduardo Frei Montalva 1234, Quilicura, Santiago",
      phone: "+56 2 2345 6789",
      email: "contacto@boilercomp.com",
      logoUrl: "/logos/boilercomp.svg",
    },
  });

  const soldesp = await prisma.company.create({
    data: {
      name: "SOLDESP S.A.",
      rut: "76.841.820-9",
      address: "Camino Lo Boza 4567, Pudahuel, Santiago",
      phone: "+56 2 2456 7890",
      email: "contacto@soldesp.cl",
      logoUrl: "/logos/soldesp.svg",
    },
  });

  console.log(`   • ${boilerComp.name}`);
  console.log(`   • ${soldesp.name}\n`);

  // ---------------------------------------------------------------------------
  // 3. Clientes industriales
  // ---------------------------------------------------------------------------
  console.log("🏭 Creando clientes industriales...");

  const clientsData = [
    {
      name: "Minera Los Bronces",
      rut: "79.123.456-7",
      industry: "Minería del cobre",
      address: "Cordillera de Los Andes, Región Metropolitana",
      phone: "+56 2 2790 1234",
      email: "abastecimiento@losbronces.cl",
      paymentTerm: 30,
      notes: "Cliente Anglo American. Alto estándar HSEQ y trazabilidad de soldaduras.",
    },
    {
      name: "Minera Centinela",
      rut: "79.234.567-8",
      industry: "Minería del cobre",
      address: "Antofagasta, Región de Antofagasta",
      phone: "+56 55 245 6789",
      email: "contratos@centinela.cl",
      paymentTerm: 45,
      notes: "Operaciones en altura y zonas áridas. Requiere certificaciones térmicas.",
    },
    {
      name: "Engie Energía Chile",
      rut: "79.345.678-9",
      industry: "Generación eléctrica",
      address: "Av. El Bosque 1737, Las Condes, Santiago",
      phone: "+56 2 2570 1234",
      email: "mantenimiento@engie.cl",
      paymentTerm: 30,
      notes: "Mantención de calderas industriales y sistemas de vapor.",
    },
    {
      name: "Puerto Valparaíso S.A.",
      rut: "79.456.789-0",
      industry: "Logística portuaria",
      address: "Muelle Prat s/n, Valparaíso",
      phone: "+56 32 2276 5000",
      email: "operaciones@puertovalparaiso.cl",
      paymentTerm: 30,
      notes: "Fabricación de estructuras metálicas para infraestructura portuaria.",
    },
    {
      name: "Codelco División El Teniente",
      rut: "79.567.890-1",
      industry: "Minería del cobre",
      address: "Rancagua, Región de O'Higgins",
      phone: "+56 72 2225 3000",
      email: "servicios.industriales@codelco.cl",
      paymentTerm: 60,
      notes: "Mayor mina subterránea del mundo. Exigente en seguridad y plazos.",
    },
    {
      name: "Colbún S.A.",
      rut: "79.678.901-2",
      industry: "Generación eléctrica",
      address: "Av. Apoquindo 4775, Las Condes, Santiago",
      phone: "+56 2 2637 4000",
      email: "ingenieria@colbun.cl",
      paymentTerm: 30,
      notes: "Reparación de componentes críticos para centrales termoeléctricas.",
    },
  ];

  const clients: Awaited<ReturnType<typeof prisma.client.create>>[] = [];
  for (const data of clientsData) {
    const client = await prisma.client.create({
      data: { companyId: boilerComp.id, ...data },
    });
    clients.push(client);
    console.log(`   • ${client.name} (${client.industry})`);
  }
  console.log("");

  // ---------------------------------------------------------------------------
  // 4. Trabajadores (datos reales de M2.xlsx)
  // ---------------------------------------------------------------------------
  console.log("👷 Creando trabajadores (M2.xlsx)...");

  // BOILER COMP S.A. — workers 0-13
  const workersDataBoilerComp = [
    { rut: "19.048.732-6", name: "Cristian Gilberto Arancibia Estay", position: "Ingeniero de Diseño", specialty: "Diseño de Calderas", certifications: "ASME, Cálculo Estructural", phone: "+56 9 0000 0001", email: "carancibia@boilercomp.com" },
    { rut: "18.018.113-k", name: "Leslye Maria Cabrera Meza", position: "Ingeniero de Proyectos", specialty: "Gestión de Proyectos", certifications: "PMP, ISO 9001", phone: "+56 9 0000 0002", email: "lcabrera@boilercomp.com" },
    { rut: "16.756.472-0", name: "Edgardo Orlando Garcia Olmos", position: "Administrador de Maestranza", specialty: "Administración Industrial", certifications: "Administración, Logística", phone: "+56 9 0000 0003", email: "egarcia@boilercomp.com" },
    { rut: "12.820.370-2", name: "Alexis Lelis Olivares Machuca", position: "Jefe Oficina Técnica", specialty: "Oficina Técnica", certifications: "Ingeniería Mecánica, ASME IX", phone: "+56 9 0000 0004", email: "aolivares@boilercomp.com" },
    { rut: "20.710.238-5", name: "Ivan Felipe Cabrera Pulgar", position: "Especialista 2", specialty: "Soldadura Especializada", certifications: "ASME IX, ISO 9606-1", phone: "+56 9 0000 0005", email: "icabrera@boilercomp.com" },
    { rut: "14.610.322-7", name: "Cristian Fabian Collao Saavedra", position: "Especialista Líder", specialty: "Soldadura Avanzada", certifications: "AWS D1.1, ASME IX, EN 287-1", phone: "+56 9 0000 0006", email: "ccolloa@boilercomp.com" },
    { rut: "19.447.189-0", name: "Ismael Rozas Bravo", position: "Especialista 1", specialty: "Soldadura Industrial", certifications: "ISO 9606-1, AWS D1.1", phone: "+56 9 0000 0007", email: "irozas@boilercomp.com" },
    { rut: "18.421.336-2", name: "Jorge Vilches Vergara", position: "Especialista Líder", specialty: "Soldadura Especializada", certifications: "AWS D1.1, ASME IX, CWI", phone: "+56 9 0000 0008", email: "jvilches@boilercomp.com" },
    { rut: "16.756.357-0", name: "Pablo Gonzalez Bascuñan", position: "Soldador", specialty: "Soldadura MIG/TIG", certifications: "ISO 9606-1", phone: "+56 9 0000 0009", email: "pgonzalez@boilercomp.com" },
    { rut: "18.854.216-6", name: "Brandon Elías Guzman Delgado", position: "Maestro Primera", specialty: "Fabricación Mecánica", certifications: "Soldadura básica, Montaje", phone: "+56 9 0000 0010", email: "bguzman@boilercomp.com" },
    { rut: "15.851.279-3", name: "Marco Guzman Delgado", position: "Maestro Mayor", specialty: "Fabricación de Calderas", certifications: "ASME, Soldadura avanzado", phone: "+56 9 0000 0011", email: "mguzman@boilercomp.com" },
    { rut: "19.447.274-9", name: "Daniel Ramirez Rodriguez", position: "Soldador", specialty: "Soldadura SMAW", certifications: "ISO 9606-1", phone: "+56 9 0000 0012", email: "dramirez@boilercomp.com" },
    { rut: "21.404.149-9", name: "Jonathan Andres Saavedra Guzman", position: "Maestro Primera Estructura", specialty: "Estructuras Metálicas", certifications: "Soldadura estructural, Montaje", phone: "+56 9 0000 0013", email: "jsaavedra@boilercomp.com" },
    { rut: "18.511.549-6", name: "Carlos Veliz Saldivar", position: "Maestro Mayor", specialty: "Fabricación Industrial", certifications: "ASME, Soldadura avanzada", phone: "+56 9 0000 0014", email: "cveliz@boilercomp.com" },
  ];

  // SOLDESP S.A. — workers 15-24
  const workersDataSoldesp = [
    { rut: "19.393.794-2", name: "Dylan Emerson Forton Donoso", position: "Maestro Mayor Control e Instrumentación", specialty: "Control e Instrumentación", certifications: "Instrumentación industrial, Automatización", phone: "+56 9 0000 0015", email: "dforton@soldesp.cl" },
    { rut: "22.923.996-1", name: "Miguel Angel Castro Gonzales", position: "Maestro Mayor Pintor Granallado", specialty: "Pintura Industrial", certifications: "SSPC, ISO 12944, Granallado", phone: "+56 9 0000 0016", email: "mcastro@soldesp.cl" },
    { rut: "26.766.842-6", name: "Diego Jhoan Contreras Aguilar", position: "Ayudante", specialty: "Apoyo Operativo", certifications: "Trabajo en altura, Espacios confinados", phone: "+56 9 0000 0017", email: "dcontreras@soldesp.cl" },
    { rut: "13.652.665-0", name: "Juan Manuel González Contreras", position: "Maestro Mayor", specialty: "Soldadura y Fabricación", certifications: "AWS D1.1, ASME IX", phone: "+56 9 0000 0018", email: "jgonzalez@soldesp.cl" },
    { rut: "17.635.456-9", name: "Pablo Andrés Cristofer Guerra Chacana", position: "Soldador", specialty: "Soldadura Industrial", certifications: "ISO 9606-1, AWS D1.1", phone: "+56 9 0000 0019", email: "pguerra@soldesp.cl" },
    { rut: "20.082.074-6", name: "Brayan Nicolas Olmos Ahumada", position: "Soldador", specialty: "Soldadura MIG/TIG", certifications: "ISO 9606-1", phone: "+56 9 0000 0020", email: "bolmos@soldesp.cl" },
    { rut: "12.140.137-1", name: "Cristian Rodrigo Rojas Segura", position: "Maestro Mayor", specialty: "Fabricación Mecánica", certifications: "ASME, Soldadura avanzado", phone: "+56 9 0000 0021", email: "crojas@soldesp.cl" },
    { rut: "21.659.153-4", name: "Jose Martin Urrutia Contreras", position: "Maestro Primera Mecánico", specialty: "Mecánica Industrial", certifications: "Mecánica industrial, Montaje", phone: "+56 9 0000 0022", email: "jurrutia@soldesp.cl" },
    { rut: "22.199.718-2", name: "Jaime Andrés Vargas Ibáñez", position: "Ayudante", specialty: "Apoyo Operativo", certifications: "Trabajo en altura", phone: "+56 9 0000 0023", email: "jvargas@soldesp.cl" },
    { rut: "22.153.767-k", name: "Miguel Fernando Vergara Cisterna", position: "Maestro Primera", specialty: "Soldadura y Fabricación", certifications: "ISO 9606-1, Soldadura estructural", phone: "+56 9 0000 0024", email: "mvergarac@soldesp.cl" },
  ];

  const workers: Awaited<ReturnType<typeof prisma.worker.create>>[] = [];

  for (const data of workersDataBoilerComp) {
    const worker = await prisma.worker.create({
      data: { companyId: boilerComp.id, ...data, status: "activo" },
    });
    workers.push(worker);
  }

  for (const data of workersDataSoldesp) {
    const worker = await prisma.worker.create({
      data: { companyId: soldesp.id, ...data, status: "activo" },
    });
    workers.push(worker);
  }

  console.log(`   • ${workers.length} trabajadores creados (14 BOILER COMP + 10 SOLDESP)\n`);

  // ---------------------------------------------------------------------------
  // 5. Proyectos
  // ---------------------------------------------------------------------------
  console.log("📁 Creando proyectos...");

  const projectsData = [
    { name: "Mantención Mayor Caldera LP-301", code: "PRJ-2026-001", clientIndex: 0, startOffset: -45, endOffset: 45 },
    { name: "Fabricación Estructuras Muelle Prat", code: "PRJ-2026-002", clientIndex: 3, startOffset: -30, endOffset: 90 },
    { name: "Reparación Intercambiador de Calor IC-205", code: "PRJ-2026-003", clientIndex: 1, startOffset: -15, endOffset: 60 },
    { name: "Soldadura Tuberías Críticas Anglo American", code: "PRJ-2026-004", clientIndex: 0, startOffset: 0, endOffset: 120 },
    { name: "Modernización Sistema de Vapor Colbún", code: "PRJ-2026-005", clientIndex: 5, startOffset: -60, endOffset: 30 },
  ];

  const projects: Awaited<ReturnType<typeof prisma.project.create>>[] = [];
  for (const data of projectsData) {
    const project = await prisma.project.create({
      data: {
        companyId: boilerComp.id,
        clientId: clients[data.clientIndex].id,
        name: data.name,
        code: data.code,
        description: `Proyecto industrial para ${clients[data.clientIndex].name}: ${data.name.toLowerCase()}.`,
        startDate: offsetDate(data.startOffset),
        endDate: offsetDate(data.endOffset),
        status: "activo",
      },
    });
    projects.push(project);
    console.log(`   • ${project.code} - ${project.name}`);
  }
  console.log("");

  // ---------------------------------------------------------------------------
  // 6. Órdenes de trabajo
  // ---------------------------------------------------------------------------
  console.log("📋 Creando órdenes de trabajo...");

  const workOrdersData = [
    { code: "OT-2026-001", title: "Reparación de domos de caldera", description: "Reparación y reemplazo de domos en caldera industrial LP-301.", status: WorkOrderStatus.en_proceso, priority: Priority.alta, clientIndex: 0, projectIndex: 0, responsibleIndex: 0, startOffset: -30, dueOffset: 15, progress: 65, estimatedCost: 18500000, actualCost: 14200000 },
    { code: "OT-2026-002", title: "Soldadura de tubos de sobrecalentador", description: "Soldadura TIG de tubos de sobrecalentador con inspección RT.", status: WorkOrderStatus.planificada, priority: Priority.critica, clientIndex: 0, projectIndex: 0, responsibleIndex: 2, startOffset: 5, dueOffset: 25, progress: 0, estimatedCost: 9200000, actualCost: 0 },
    { code: "OT-2026-003", title: "Fabricación de soporte de quemador", description: "Fabricación y mecanizado de soporte para quemador principal.", status: WorkOrderStatus.nueva, priority: Priority.media, clientIndex: 1, projectIndex: 2, responsibleIndex: 4, startOffset: 10, dueOffset: 40, progress: 0, estimatedCost: 5400000, actualCost: 0 },
    { code: "OT-2026-004", title: "Mantención de válvulas de seguridad", description: "Revisión, calibración y certificación de válvulas de seguridad.", status: WorkOrderStatus.revision, priority: Priority.alta, clientIndex: 4, projectIndex: 2, responsibleIndex: 5, startOffset: -20, dueOffset: -5, progress: 90, estimatedCost: 3100000, actualCost: 2950000 },
    { code: "OT-2026-005", title: "Recambio de revestimiento refractario", description: "Demolición y colocación de refractario en hogar de caldera.", status: WorkOrderStatus.detenida, priority: Priority.alta, clientIndex: 5, projectIndex: 4, responsibleIndex: 3, startOffset: -40, dueOffset: -10, progress: 45, estimatedCost: 12800000, actualCost: 6700000 },
    { code: "OT-2026-006", title: "Fabricación de plataformas de acceso", description: "Fabricación de plataformas y escaleras para acceso a equipos.", status: WorkOrderStatus.en_proceso, priority: Priority.media, clientIndex: 3, projectIndex: 1, responsibleIndex: 0, startOffset: -25, dueOffset: 35, progress: 40, estimatedCost: 15600000, actualCost: 7100000 },
    { code: "OT-2026-007", title: "Reparación de carcasa de intercambiador", description: "Reparación de carcasa y reemplazo de tubos intercambiador IC-205.", status: WorkOrderStatus.completada, priority: Priority.critica, clientIndex: 1, projectIndex: 2, responsibleIndex: 6, startOffset: -50, dueOffset: -10, progress: 100, estimatedCost: 22100000, actualCost: 21800000 },
    { code: "OT-2026-008", title: "Alineación de turbina auxiliar", description: "Alineación laser y balanceo de turbina auxiliar de vapor.", status: WorkOrderStatus.planificada, priority: Priority.media, clientIndex: 5, projectIndex: 4, responsibleIndex: 12, startOffset: 15, dueOffset: 45, progress: 0, estimatedCost: 4800000, actualCost: 0 },
    { code: "OT-2026-009", title: "Soldadura de estructuras portuarias", description: "Soldadura de plataformas y defensas para muelle Prat.", status: WorkOrderStatus.en_proceso, priority: Priority.alta, clientIndex: 3, projectIndex: 1, responsibleIndex: 13, startOffset: -20, dueOffset: 50, progress: 55, estimatedCost: 19800000, actualCost: 11200000 },
    { code: "OT-2026-010", title: "Reparación de bomba de agua de alimentación", description: "Reparación de impulsor y sello mecánico de bomba B-101.", status: WorkOrderStatus.cerrada, priority: Priority.baja, clientIndex: 4, projectIndex: null, responsibleIndex: 16, startOffset: -60, dueOffset: -30, progress: 100, estimatedCost: 2700000, actualCost: 2650000 },
    { code: "OT-2026-011", title: "Inspección y reparación de economizador", description: "Inspección visual y reparación de tubos de economizador.", status: WorkOrderStatus.en_proceso, priority: Priority.alta, clientIndex: 0, projectIndex: 0, responsibleIndex: 1, startOffset: -15, dueOffset: 20, progress: 35, estimatedCost: 7800000, actualCost: 3100000 },
    { code: "OT-2026-012", title: "Pintura y protección anticorrosiva", description: "Aplicación de pintura epóxica en estructuras metálicas.", status: WorkOrderStatus.nueva, priority: Priority.baja, clientIndex: 3, projectIndex: 1, responsibleIndex: 11, startOffset: 30, dueOffset: 75, progress: 0, estimatedCost: 4200000, actualCost: 0 },
    { code: "OT-2026-013", title: "Reemplazo de quemadores de gas natural", description: "Reemplazo de quemadores y ajuste de sistema de control.", status: WorkOrderStatus.planificada, priority: Priority.alta, clientIndex: 5, projectIndex: 4, responsibleIndex: 9, startOffset: 0, dueOffset: 30, progress: 0, estimatedCost: 8500000, actualCost: 0 },
    { code: "OT-2026-014", title: "Reparación de cilindro de prensa", description: "Reparación de cilindro hidráulico de prensa de chapas.", status: WorkOrderStatus.revision, priority: Priority.media, clientIndex: 2, projectIndex: null, responsibleIndex: 7, startOffset: -10, dueOffset: 5, progress: 85, estimatedCost: 3600000, actualCost: 3100000 },
    { code: "OT-2026-015", title: "Montaje de tuberías de vapor", description: "Montaje y soldadura de tuberías de vapor de alta presión.", status: WorkOrderStatus.en_proceso, priority: Priority.critica, clientIndex: 1, projectIndex: 2, responsibleIndex: 14, startOffset: -5, dueOffset: 25, progress: 25, estimatedCost: 11500000, actualCost: 3200000 },
  ];

  const workOrders: Awaited<ReturnType<typeof prisma.workOrder.create>>[] = [];
  for (const data of workOrdersData) {
    const completedAt = data.status === WorkOrderStatus.completada || data.status === WorkOrderStatus.cerrada
      ? offsetDate(data.dueOffset)
      : undefined;

    const workOrder = await prisma.workOrder.create({
      data: {
        code: data.code,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        startDate: offsetDate(data.startOffset),
        dueDate: offsetDate(data.dueOffset),
        completedAt,
        progress: data.progress,
        estimatedCost: data.estimatedCost,
        actualCost: data.actualCost,
        clientId: clients[data.clientIndex].id,
        projectId: data.projectIndex !== null ? projects[data.projectIndex].id : null,
        responsibleId: workers[data.responsibleIndex].id,
      },
    });
    workOrders.push(workOrder);
  }
  console.log(`   • ${workOrders.length} órdenes de trabajo creadas\n`);

  // ---------------------------------------------------------------------------
  // 7. Tareas de orden de trabajo (WorkOrderTask)
  // ---------------------------------------------------------------------------
  console.log("🔧 Creando tareas de órdenes de trabajo...");

  const taskTitles = [
    "Preparación de superficies",
    "Corte y ajuste de piezas",
    "Soldadura de ensamblajes",
    "Inspección visual dimensional",
    "Pruebas no destructivas",
    "Mecanizado de acabado",
    "Montaje en campo",
    "Pruebas hidrostáticas",
    "Pintura y protección",
    "Limpieza final y entrega",
  ];

  let workOrderTaskCount = 0;
  for (const workOrder of workOrders) {
    const taskCount = 3 + (workOrder.id.charCodeAt(0) % 3); // 3 a 5 tareas por OT
    for (let i = 0; i < taskCount; i++) {
      const progress = Math.min(100, Math.max(0, workOrder.progress + (Math.random() * 30 - 15)));
      await prisma.workOrderTask.create({
        data: {
          workOrderId: workOrder.id,
          title: `${taskTitles[i % taskTitles.length]} - ${workOrder.code}`,
          description: `Tarea ${i + 1} asociada a la orden ${workOrder.code}.`,
          progress: Math.round(progress),
          completed: progress >= 100,
          dueDate: offsetDate(i * 3),
        },
      });
      workOrderTaskCount++;
    }
  }
  console.log(`   • ${workOrderTaskCount} tareas de órdenes creadas\n`);

  // ---------------------------------------------------------------------------
  // 8. Asignación de trabajadores a órdenes
  // ---------------------------------------------------------------------------
  console.log("👥 Asignando trabajadores a órdenes...");

  let assignmentCount = 0;
  for (const workOrder of workOrders) {
    const assignedWorkerIndices = new Set<number>();
    const count = 2 + (workOrder.id.charCodeAt(1) % 3);
    while (assignedWorkerIndices.size < count) {
      assignedWorkerIndices.add(Math.floor(Math.random() * workers.length));
    }
    for (const idx of assignedWorkerIndices) {
      await prisma.workerAssignment.create({
        data: {
          workerId: workers[idx].id,
          workOrderId: workOrder.id,
          startDate: workOrder.startDate,
          endDate: workOrder.dueDate,
          hours: 40 + Math.floor(Math.random() * 80),
        },
      });
      assignmentCount++;
    }
  }
  console.log(`   • ${assignmentCount} asignaciones creadas\n`);

  // ---------------------------------------------------------------------------
  // 9. Tareas Gantt
  // ---------------------------------------------------------------------------
  console.log("📊 Creando tareas Gantt...");

  const ganttTaskTemplates = [
    { name: "Ingeniería y planificación", duration: 10, offset: 0 },
    { name: "Adquisición de materiales", duration: 14, offset: 5 },
    { name: "Corte y preparación", duration: 8, offset: 15 },
    { name: "Fabricación de estructuras", duration: 20, offset: 20 },
    { name: "Soldadura de componentes", duration: 18, offset: 25 },
    { name: "Inspección de calidad", duration: 7, offset: 40 },
    { name: "Pruebas no destructivas", duration: 5, offset: 45 },
    { name: "Mecanizado de precisión", duration: 10, offset: 48 },
    { name: "Tratamiento superficial", duration: 6, offset: 55 },
    { name: "Montaje en taller", duration: 12, offset: 58 },
    { name: "Transporte a faena", duration: 4, offset: 68 },
    { name: "Instalación en campo", duration: 15, offset: 70 },
    { name: "Pruebas de puesta en marcha", duration: 8, offset: 82 },
    { name: "Capacitación operacional", duration: 3, offset: 88 },
    { name: "Entrega y cierre documental", duration: 5, offset: 90 },
  ];

  const ganttStatuses = ["pendiente", "en_proceso", "completada", "detenida"];
  let ganttCount = 0;

  for (const project of projects) {
    for (let i = 0; i < 8; i++) {
      const tpl = ganttTaskTemplates[i % ganttTaskTemplates.length];
      const start = offsetDate(tpl.offset - 30 + projects.indexOf(project) * 5);
      const end = new Date(start);
      end.setDate(end.getDate() + tpl.duration);
      const progress = Math.round(Math.random() * 100);
      const status = ganttStatuses[Math.floor(Math.random() * ganttStatuses.length)];
      const relatedWorkOrder = workOrders.find(wo => wo.projectId === project.id && (wo.code.charCodeAt(wo.code.length - 1) + i) % 3 === 0);

      await prisma.ganttTask.create({
        data: {
          projectId: project.id,
          workOrderId: relatedWorkOrder?.id ?? null,
          name: `${tpl.name} - ${project.code}`,
          startDate: start,
          endDate: end,
          progress,
          status,
          dependencies: i > 0 ? `${project.code}-TASK-${i}` : null,
          responsible: workers[Math.floor(Math.random() * workers.length)].name,
        },
      });
      ganttCount++;
    }
  }
  console.log(`   • ${ganttCount} tareas Gantt creadas\n`);

  // ---------------------------------------------------------------------------
  // 10. Equipos y materiales (datos de soporte)
  // ---------------------------------------------------------------------------
  console.log("🛠️ Creando equipos y materiales...");

  const equipmentData = [
    { name: "Máquina de soldadura TIG Miller 350", code: "EQ-SOLD-001", type: "Soldadura", status: "disponible" },
    { name: "Máquina de soldadura MIG Lincoln 500", code: "EQ-SOLD-002", type: "Soldadura", status: "en_uso" },
    { name: "Prensa hidráulica 200 ton", code: "EQ-PRENSA-001", type: "Mecanizado", status: "disponible" },
    { name: "Torno CNC Takisawa", code: "EQ-TORNO-001", type: "Mecanizado", status: "mantencion" },
    { name: "Grúa puente 10 ton", code: "EQ-GRUA-001", type: "Izaje", status: "disponible" },
  ];

  for (const data of equipmentData) {
    await prisma.equipment.create({
      data: {
        companyId: boilerComp.id,
        ...data,
        lastService: offsetDate(-30),
        nextService: offsetDate(90),
      },
    });
  }

  const materialsData = [
    { name: "Plancha de acero ASTM A516 Gr.70", code: "MAT-001", unit: "m2", stock: 120, minStock: 20, cost: 85000 },
    { name: "Electrodo E7018 3/32", code: "MAT-002", unit: "kg", stock: 350, minStock: 50, cost: 4200 },
    { name: "Tubo sin costura SCH40 2\"", code: "MAT-003", unit: "m", stock: 80, minStock: 15, cost: 18000 },
    { name: "Refractario plástico", code: "MAT-004", unit: "saco", stock: 45, minStock: 10, cost: 32000 },
    { name: "Pintura epóxica industrial", code: "MAT-005", unit: "litro", stock: 200, minStock: 40, cost: 9500 },
    { name: "Válvula de seguridad 2\" x 150 psi", code: "MAT-006", unit: "unidad", stock: 12, minStock: 3, cost: 145000 },
  ];

  for (const data of materialsData) {
    await prisma.material.create({
      data: {
        companyId: boilerComp.id,
        ...data,
      },
    });
  }
  console.log(`   • ${equipmentData.length} equipos creados`);
  console.log(`   • ${materialsData.length} materiales creados\n`);

  // ---------------------------------------------------------------------------
  // 11. Registros HSEQ
  // ---------------------------------------------------------------------------
  console.log("🛡️ Creando registros HSEQ...");

  const hseqData = [
    { type: HseqType.inspeccion, norm: Norm.ISO_45001, description: "Inspección mensual de arnés y líneas de vida del taller principal.", responsibleIndex: 17, dueOffset: 10, status: HseqStatus.abierto, signatureRequired: true },
    { type: HseqType.incidente, norm: Norm.DS_44, description: "Corte leve en mano izquierda durante preparación de chapa. Se derivó a centro asistencial.", responsibleIndex: 5, dueOffset: -2, status: HseqStatus.cerrado, signatureRequired: true },
    { type: HseqType.accion_correctiva, norm: Norm.ISO_9001, description: "Corregir desviación dimensional en soporte de quemador detectado en inspección final.", responsibleIndex: 0, dueOffset: 5, status: HseqStatus.en_revision, signatureRequired: false },
    { type: HseqType.capacitacion, norm: Norm.ISO_45001, description: "Capacitación en trabajo en altura para brigada de soldadores.", responsibleIndex: 17, dueOffset: 20, status: HseqStatus.abierto, signatureRequired: false },
    { type: HseqType.permiso_trabajo, norm: Norm.DS_44, description: "Permiso de trabajo en caliente para reparación de domos de caldera LP-301.", responsibleIndex: 5, dueOffset: 2, status: HseqStatus.cerrado, signatureRequired: true },
    { type: HseqType.matriz_riesgo, norm: Norm.ISO_14001, description: "Actualización de matriz de riesgos proyecto Muelle Prat.", responsibleIndex: 17, dueOffset: 15, status: HseqStatus.abierto, signatureRequired: false },
    { type: HseqType.inspeccion, norm: Norm.ISO_9001, description: "Inspección de soldaduras en tuberías críticas con líquidos penetrantes.", responsibleIndex: 6, dueOffset: 8, status: HseqStatus.en_revision, signatureRequired: true },
    { type: HseqType.incidente, norm: Norm.ISO_45001, description: "Derrame controlado de aceite hidráulico en área de mecanizado.", responsibleIndex: 5, dueOffset: -5, status: HseqStatus.cerrado, signatureRequired: false },
    { type: HseqType.accion_correctiva, norm: Norm.ISO_14001, description: "Implementar contención secundaria para tanques de aceite usado.", responsibleIndex: 17, dueOffset: 12, status: HseqStatus.abierto, signatureRequired: true },
    { type: HseqType.capacitacion, norm: Norm.ISO_9001, description: "Inducción en control documental y trazabilidad de materiales.", responsibleIndex: 0, dueOffset: 18, status: HseqStatus.abierto, signatureRequired: false },
    { type: HseqType.permiso_trabajo, norm: Norm.DS_44, description: "Permiso de ingreso a espacio confinado para economizador.", responsibleIndex: 5, dueOffset: 1, status: HseqStatus.cerrado, signatureRequired: true },
    { type: HseqType.matriz_riesgo, norm: Norm.ISO_45001, description: "Matriz de riesgos para mantención mayor caldera LP-301.", responsibleIndex: 17, dueOffset: -10, status: HseqStatus.vencido, signatureRequired: true },
  ];

  const hseqRecords: Awaited<ReturnType<typeof prisma.hseqRecord.create>>[] = [];
  for (const data of hseqData) {
    const hseqRecord = await prisma.hseqRecord.create({
      data: {
        companyId: boilerComp.id,
        type: data.type,
        norm: data.norm,
        description: data.description,
        responsibleId: workers[data.responsibleIndex].id,
        date: new Date(),
        dueDate: offsetDate(data.dueOffset),
        status: data.status,
        evidenceDocumental: `Evidencia registrada en sistema - ${data.type}`,
        signatureRequired: data.signatureRequired,
        signed: data.status === HseqStatus.cerrado && data.signatureRequired,
        signedAt: data.status === HseqStatus.cerrado && data.signatureRequired ? offsetDate(data.dueOffset) : null,
      },
    });
    hseqRecords.push(hseqRecord);

    // Acciones correctivas asociadas para registros abiertos o en revisión
    if (hseqRecord.status === HseqStatus.abierto || hseqRecord.status === HseqStatus.en_revision) {
      await prisma.hseqAction.create({
        data: {
          hseqRecordId: hseqRecord.id,
          description: `Acción derivada: ${hseqRecord.description.substring(0, 60)}...`,
          responsible: workers[data.responsibleIndex].name,
          dueDate: offsetDate(data.dueOffset + 5),
          completed: false,
        },
      });
    }
  }
  console.log(`   • ${hseqRecords.length} registros HSEQ creados\n`);

  // ---------------------------------------------------------------------------
  // 12. Usuarios demo
  // ---------------------------------------------------------------------------
  console.log("👤 Creando usuarios demo...");

  const usersData = [
    { email: "gerencia@boilercomp.com", name: "Gerencia BOILER COMP", role: UserRole.ADMIN, companyIndex: 0 },
    { email: "admin@boilercomp.com", name: "Administrador Sistema", role: UserRole.ADMIN, companyIndex: 0 },
    { email: "hseq@boilercomp.com", name: "Gerente HSEQ", role: UserRole.HSEQ_MANAGER, companyIndex: 0 },
    { email: "ops@boilercomp.com", name: "Jefe Operaciones", role: UserRole.OPERATIONS, companyIndex: 0 },
    { email: "cliente1@ejemplo.com", name: "Usuario Cliente Demo", role: UserRole.CLIENT, clientIndex: 0 },
    { email: "viewer@boilercomp.com", name: "Visualizador", role: UserRole.VIEWER, companyIndex: 0 },
  ];

  const companies = [boilerComp, soldesp];

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  const createdUsers: { name: string; email: string; role: UserRole }[] = [];

  for (const data of usersData) {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role,
        active: true,
        companyId: data.role === UserRole.CLIENT || data.companyIndex === undefined ? undefined : companies[data.companyIndex].id,
        clientId: data.clientIndex !== undefined ? clients[data.clientIndex].id : undefined,
      },
    });
    createdUsers.push({ name: user.name, email: user.email, role: user.role });
    console.log(`   • ${user.email} → ${user.role}`);
  }
  console.log("");

  // ---------------------------------------------------------------------------
  // 13. Resumen final
  // ---------------------------------------------------------------------------
  console.log("=".repeat(60));
  console.log("✅ SEED COMPLETADO EXITOSAMENTE");
  console.log("=".repeat(60));
  console.log("");
  console.log("Resumen de datos creados:");
  console.log(`  • Empresas:          2`);
  console.log(`  • Clientes:          ${clients.length}`);
  console.log(`  • Trabajadores:      ${workers.length}`);
  console.log(`  • Proyectos:         ${projects.length}`);
  console.log(`  • Órdenes de trabajo: ${workOrders.length}`);
  console.log(`  • Tareas de OT:      ${workOrderTaskCount}`);
  console.log(`  • Asignaciones:      ${assignmentCount}`);
  console.log(`  • Tareas Gantt:      ${ganttCount}`);
  console.log(`  • Equipos:           ${equipmentData.length}`);
  console.log(`  • Materiales:        ${materialsData.length}`);
  console.log(`  • Registros HSEQ:    ${hseqRecords.length}`);
  console.log(`  • Usuarios demo:     ${createdUsers.length}`);
  console.log("");
  console.log("Credenciales de acceso demo:");
  console.log("  Contraseña para todos los usuarios: demo1234");
  console.log("");
  for (const user of createdUsers) {
    console.log(`  ${user.role.padEnd(18)} | ${user.email.padEnd(28)} | ${user.name}`);
  }
  console.log("");
  console.log("⚠️  Recuerda cambiar las contraseñas antes de usar en producción.");
  console.log("=".repeat(60));
}

function offsetDate(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(0, 0, 0, 0);
  return date;
}

main()
  .catch((error) => {
    console.error("❌ Error durante el seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
