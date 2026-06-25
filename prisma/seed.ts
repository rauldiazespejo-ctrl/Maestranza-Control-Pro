import "dotenv/config";
import { PrismaClient, UserRole, WorkOrderStatus, Priority, HseqType, Norm, HseqStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as pg from "pg";
import bcryptjs from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL ?? "";

function createPrisma() {
  if (databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://")) {
    const pool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 30000,
    });
    return new PrismaClient({ adapter: new PrismaPg(pool) });
  }
  return new PrismaClient();
}

const prisma = createPrisma();

const DEMO_PASSWORD = "demo1234";

function offsetDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(0, 0, 0, 0);
  return date;
}

async function main() {
  console.log("Iniciando seed MAESTRANZA Control Pro...\n");

  console.log("Limpiando...");
  try {
    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.session.deleteMany();
    await prisma.document.deleteMany();
    await prisma.hseqAction.deleteMany();
    await prisma.hseqRecord.deleteMany();
    await prisma.workerAssignment.deleteMany();
    await prisma.workOrderTask.deleteMany();
    await prisma.ganttTask.deleteMany();
    await prisma.workOrder.deleteMany();
    await prisma.project.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.equipment.deleteMany();
    await prisma.material.deleteMany();
    await prisma.client.deleteMany();
    await prisma.worker.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
  } catch (e: unknown) { console.log("Cleanup:", (e as Error).message.split('\n')[0]); }
  console.log("Tablas limpias\n");

  // Empresas
  console.log("Creando empresas...");
  const boilerComp = await prisma.company.create({
    data: { name: "BOILER COMP S.A.", rut: "76.238.153-2", address: "Av. Presidente Eduardo Frei Montalva 1234, Quilicura, Santiago", phone: "+56 2 2345 6789", email: "contacto@boilercomp.com", logoUrl: "/logos/boilercomp.svg" }
  });
  const soldesp = await prisma.company.create({
    data: { name: "SOLDESP S.A.", rut: "76.841.820-9", address: "Camino Lo Boza 4567, Pudahuel, Santiago", phone: "+56 2 2456 7890", email: "contacto@soldesp.cl", logoUrl: "/logos/soldesp.svg" }
  });
  console.log(` ${boilerComp.name}`);
  console.log(` ${soldesp.name}\n`);

  // Clientes
  console.log("Creando clientes...");
  const clientsData = [
    { name: "Minera Los Bronces", rut: "79.123.456-7", industry: "Mineria del cobre", address: "Cordillera de Los Andes, RM", phone: "+56 2 2790 1234", email: "abastecimiento@losbronces.cl", paymentTerm: 30, notes: "Cliente Anglo American. Alto estandar HSEQ." },
    { name: "Minera Centinela", rut: "79.234.567-8", industry: "Mineria del cobre", address: "Antofagasta", phone: "+56 55 245 6789", email: "contratos@centinela.cl", paymentTerm: 45, notes: "Operaciones en altura." },
    { name: "Engie Energia Chile", rut: "79.345.678-9", industry: "Generacion electrica", address: "Av. El Bosque 1737, Las Condes", phone: "+56 2 2570 1234", email: "mantenimiento@engie.cl", paymentTerm: 30, notes: "Mantencio de calderas." },
    { name: "Puerto Valparaiso S.A.", rut: "79.456.789-0", industry: "Logistica portuaria", address: "Muelle Prat s/n, Valparaiso", phone: "+56 32 2276 5000", email: "operaciones@puertovalparaiso.cl", paymentTerm: 30, notes: "Estructuras metalicas." },
    { name: "Codelco Division El Teniente", rut: "79.567.890-1", industry: "Mineria del cobre", address: "Rancagua", phone: "+56 72 2225 3000", email: "servicios.industriales@codelco.cl", paymentTerm: 60, notes: "Mayor mina subterranea del mundo." },
    { name: "Colbun S.A.", rut: "79.678.901-2", industry: "Generacion electrica", address: "Av. Apoquindo 4775, Las Condes", phone: "+56 2 2637 4000", email: "ingenieria@colbun.cl", paymentTerm: 30, notes: "Componentes criticos." },
  ];
  const clients = [];
  for (const d of clientsData) {
    const c = await prisma.client.create({ data: { companyId: boilerComp.id, ...d } });
    clients.push(c);
    console.log(` ${c.name}`);
  }
  console.log("");

  // Trabajadores
  console.log("Creando trabajadores...");
  const workersAll = [];
  const workersBC = [
    { rut: "19.048.732-6", name: "Cristian Gilberto Arancibia Estay", position: "Ingeniero de Diseno", specialty: "Diseno de Calderas", certifications: "ASME, Calculo Estructural", phone: "+56 9 0000 0001", email: "carancibia@boilercomp.com" },
    { rut: "18.018.113-k", name: "Leslye Maria Cabrera Meza", position: "Ingeniero de Proyectos", specialty: "Gestion de Proyectos", certifications: "PMP, ISO 9001", phone: "+56 9 0000 0002", email: "lcabrera@boilercomp.com" },
    { rut: "16.756.472-0", name: "Edgardo Orlando Garcia Olmos", position: "Administrador de Maestranza", specialty: "Administracion Industrial", certifications: "Administracion, Logistica", phone: "+56 9 0000 0003", email: "egarcia@boilercomp.com" },
    { rut: "12.820.370-2", name: "Alexis Lelis Olivares Machuca", position: "Jefe Oficina Tecnica", specialty: "Oficina Tecnica", certifications: "Ingenieria Mecanica, ASME IX", phone: "+56 9 0000 0004", email: "aolivares@boilercomp.com" },
    { rut: "20.710.238-5", name: "Ivan Felipe Cabrera Pulgar", position: "Especialista 2", specialty: "Soldadura Especializada", certifications: "ASME IX, ISO 9606-1", phone: "+56 9 0000 0005", email: "icabrera@boilercomp.com" },
    { rut: "14.610.322-7", name: "Cristian Fabian Collao Saavedra", position: "Especialista Lider", specialty: "Soldadura Avanzada", certifications: "AWS D1.1, ASME IX, EN 287-1", phone: "+56 9 0000 0006", email: "ccolloa@boilercomp.com" },
    { rut: "19.447.189-0", name: "Ismael Rozas Bravo", position: "Especialista 1", specialty: "Soldadura Industrial", certifications: "ISO 9606-1, AWS D1.1", phone: "+56 9 0000 0007", email: "irozas@boilercomp.com" },
    { rut: "18.421.336-2", name: "Jorge Vilches Vergara", position: "Especialista Lider", specialty: "Soldadura Especializada", certifications: "AWS D1.1, ASME IX, CWI", phone: "+56 9 0000 0008", email: "jvilches@boilercomp.com" },
    { rut: "16.756.357-0", name: "Pablo Gonzalez Bascunan", position: "Soldador", specialty: "Soldadura MIG/TIG", certifications: "ISO 9606-1", phone: "+56 9 0000 0009", email: "pgonzalez@boilercomp.com" },
    { rut: "18.854.216-6", name: "Brandon Elias Guzman Delgado", position: "Maestro Primera", specialty: "Fabricacion Mecanica", certifications: "Soldadura basica, Montaje", phone: "+56 9 0000 0010", email: "bguzman@boilercomp.com" },
    { rut: "15.851.279-3", name: "Marco Guzman Delgado", position: "Maestro Mayor", specialty: "Fabricacion de Calderas", certifications: "ASME, Soldadura avanzado", phone: "+56 9 0000 0011", email: "mguzman@boilercomp.com" },
    { rut: "19.447.274-9", name: "Daniel Ramirez Rodriguez", position: "Soldador", specialty: "Soldadura SMAW", certifications: "ISO 9606-1", phone: "+56 9 0000 0012", email: "dramirez@boilercomp.com" },
    { rut: "21.404.149-9", name: "Jonathan Andres Saavedra Guzman", position: "Maestro Primera Estructura", specialty: "Estructuras Metalicas", certifications: "Soldadura estructural, Montaje", phone: "+56 9 0000 0013", email: "jsaavedra@boilercomp.com" },
    { rut: "18.511.549-6", name: "Carlos Veliz Saldivar", position: "Maestro Mayor", specialty: "Fabricacion Industrial", certifications: "ASME, Soldadura avanzada", phone: "+56 9 0000 0014", email: "cveliz@boilercomp.com" },
  ];
  const workersSD = [
    { rut: "19.393.794-2", name: "Dylan Emerson Forton Donoso", position: "Maestro Mayor Control e Instrumentacion", specialty: "Control e Instrumentacion", certifications: "Instrumentacion industrial, Automatizacion", phone: "+56 9 0000 0015", email: "dforton@soldesp.cl" },
    { rut: "22.923.996-1", name: "Miguel Angel Castro Gonzales", position: "Maestro Mayor Pintor Granallado", specialty: "Pintura Industrial", certifications: "SSPC, ISO 12944, Granallado", phone: "+56 9 0000 0016", email: "mcastro@soldesp.cl" },
    { rut: "26.766.842-6", name: "Diego Jhoan Contreras Aguilar", position: "Ayudante", specialty: "Apoyo Operativo", certifications: "Trabajo en altura, Espacios confinados", phone: "+56 9 0000 0017", email: "dcontreras@soldesp.cl" },
    { rut: "13.652.665-0", name: "Juan Manuel Gonzalez Contreras", position: "Maestro Mayor", specialty: "Soldadura y Fabricacion", certifications: "AWS D1.1, ASME IX", phone: "+56 9 0000 0018", email: "jgonzalez@soldesp.cl" },
    { rut: "17.635.456-9", name: "Pablo Andres Cristofer Guerra Chacana", position: "Soldador", specialty: "Soldadura Industrial", certifications: "ISO 9606-1, AWS D1.1", phone: "+56 9 0000 0019", email: "pguerra@soldesp.cl" },
    { rut: "20.082.074-6", name: "Brayan Nicolas Olmos Ahumada", position: "Soldador", specialty: "Soldadura MIG/TIG", certifications: "ISO 9606-1", phone: "+56 9 0000 0020", email: "bolmos@soldesp.cl" },
    { rut: "12.140.137-1", name: "Cristian Rodrigo Rojas Segura", position: "Maestro Mayor", specialty: "Fabricacion Mecanica", certifications: "ASME, Soldadura avanzado", phone: "+56 9 0000 0021", email: "crojas@soldesp.cl" },
    { rut: "21.659.153-4", name: "Jose Martin Urrutia Contreras", position: "Maestro Primera Mecanico", specialty: "Mecanica Industrial", certifications: "Mecanica industrial, Montaje", phone: "+56 9 0000 0022", email: "jurrutia@soldesp.cl" },
    { rut: "22.199.718-2", name: "Jaime Andres Vargas Ibanez", position: "Ayudante", specialty: "Apoyo Operativo", certifications: "Trabajo en altura", phone: "+56 9 0000 0023", email: "jvargas@soldesp.cl" },
    { rut: "22.153.767-k", name: "Miguel Fernando Vergara Cisterna", position: "Maestro Primera", specialty: "Soldadura y Fabricacion", certifications: "ISO 9606-1, Soldadura estructural", phone: "+56 9 0000 0024", email: "mvergarac@soldesp.cl" },
  ];
  for (const d of workersBC) { const w = await prisma.worker.create({ data: { companyId: boilerComp.id, ...d, status: "activo" } }); workersAll.push(w); }
  for (const d of workersSD) { const w = await prisma.worker.create({ data: { companyId: soldesp.id, ...d, status: "activo" } }); workersAll.push(w); }
  console.log(` ${workersAll.length} trabajadores (14 BC + 10 SD)\n`);

  // Proyectos
  console.log("Creando proyectos...");
  const projectsData = [
    { name: "Mantencio Mayor Caldera LP-301", code: "PRJ-2026-001", clientIdx: 0, startOff: -45, endOff: 45 },
    { name: "Fabricacion Estructuras Muelle Prat", code: "PRJ-2026-002", clientIdx: 3, startOff: -30, endOff: 90 },
    { name: "Reparacion Intercambiador de Calor IC-205", code: "PRJ-2026-003", clientIdx: 1, startOff: -15, endOff: 60 },
    { name: "Soldadura Tuberias Criticas Anglo American", code: "PRJ-2026-004", clientIdx: 0, startOff: 0, endOff: 120 },
    { name: "Modernizacion Sistema de Vapor Colbun", code: "PRJ-2026-005", clientIdx: 5, startOff: -60, endOff: 30 },
  ];
  const projects = [];
  for (const d of projectsData) {
    const p = await prisma.project.create({
      data: { companyId: boilerComp.id, clientId: clients[d.clientIdx].id, name: d.name, code: d.code, description: `Proyecto para ${clients[d.clientIdx].name}`, startDate: offsetDate(d.startOff), endDate: offsetDate(d.endOff), status: "activo" }
    });
    projects.push(p);
    console.log(` ${p.code} - ${p.name}`);
  }
  console.log("");

  // Ordenes de trabajo
  console.log("Creando ordenes de trabajo...");
  const woData = [
    { code: "OT-2026-001", title: "Reparacion de domos de caldera", description: "Reparacion y reemplazo de domos en caldera industrial LP-301.", status: WorkOrderStatus.en_proceso, priority: Priority.alta, clientIdx: 0, projIdx: 0, respIdx: 0, startOff: -30, dueOff: 15, progress: 65, estCost: 18500000, actCost: 14200000 },
    { code: "OT-2026-002", title: "Soldadura de tubos de sobrecalentador", description: "Soldadura TIG con inspeccion RT.", status: WorkOrderStatus.planificada, priority: Priority.critica, clientIdx: 0, projIdx: 0, respIdx: 2, startOff: 5, dueOff: 25, progress: 0, estCost: 9200000, actCost: 0 },
    { code: "OT-2026-003", title: "Fabricacion de soporte de quemador", description: "Fabricacion y mecanizado de soporte para quemador principal.", status: WorkOrderStatus.nueva, priority: Priority.media, clientIdx: 1, projIdx: 2, respIdx: 4, startOff: 10, dueOff: 40, progress: 0, estCost: 5400000, actCost: 0 },
    { code: "OT-2026-004", title: "Mantencio de valvulas de seguridad", description: "Revision, calibracion y certificacion de valvulas.", status: WorkOrderStatus.revision, priority: Priority.alta, clientIdx: 4, projIdx: 2, respIdx: 5, startOff: -20, dueOff: -5, progress: 90, estCost: 3100000, actCost: 2950000 },
    { code: "OT-2026-005", title: "Recambio de revestimiento refractario", description: "Demolicion y colocacion de refractario.", status: WorkOrderStatus.detenida, priority: Priority.alta, clientIdx: 5, projIdx: 4, respIdx: 3, startOff: -40, dueOff: -10, progress: 45, estCost: 12800000, actCost: 6700000 },
    { code: "OT-2026-006", title: "Fabricacion de plataformas de acceso", description: "Plataformas y escaleras para acceso a equipos.", status: WorkOrderStatus.en_proceso, priority: Priority.media, clientIdx: 3, projIdx: 1, respIdx: 0, startOff: -25, dueOff: 35, progress: 40, estCost: 15600000, actCost: 7100000 },
    { code: "OT-2026-007", title: "Reparacion de carcasa de intercambiador", description: "Reparacion de carcasa y reemplazo de tubos.", status: WorkOrderStatus.completada, priority: Priority.critica, clientIdx: 1, projIdx: 2, respIdx: 6, startOff: -50, dueOff: -10, progress: 100, estCost: 22100000, actCost: 21800000 },
    { code: "OT-2026-008", title: "Alineacion de turbina auxiliar", description: "Alineacion laser y balanceo de turbina.", status: WorkOrderStatus.planificada, priority: Priority.media, clientIdx: 5, projIdx: 4, respIdx: 12, startOff: 15, dueOff: 45, progress: 0, estCost: 4800000, actCost: 0 },
    { code: "OT-2026-009", title: "Soldadura de estructuras portuarias", description: "Soldadura de plataformas y defensas para muelle Prat.", status: WorkOrderStatus.en_proceso, priority: Priority.alta, clientIdx: 3, projIdx: 1, respIdx: 13, startOff: -20, dueOff: 50, progress: 55, estCost: 19800000, actCost: 11200000 },
    { code: "OT-2026-010", title: "Reparacion de bomba de alimentacion", description: "Reparacion de impulsor y sello mecanico.", status: WorkOrderStatus.cerrada, priority: Priority.baja, clientIdx: 4, projIdx: null, respIdx: 16, startOff: -60, dueOff: -30, progress: 100, estCost: 2700000, actCost: 2650000 },
    { code: "OT-2026-011", title: "Inspeccion y reparacion de economizador", description: "Inspeccion visual y reparacion de tubos.", status: WorkOrderStatus.en_proceso, priority: Priority.alta, clientIdx: 0, projIdx: 0, respIdx: 1, startOff: -15, dueOff: 20, progress: 35, estCost: 7800000, actCost: 3100000 },
    { code: "OT-2026-012", title: "Pintura y proteccion anticorrosiva", description: "Aplicacion de pintura epoxica en estructuras.", status: WorkOrderStatus.nueva, priority: Priority.baja, clientIdx: 3, projIdx: 1, respIdx: 11, startOff: 30, dueOff: 75, progress: 0, estCost: 4200000, actCost: 0 },
    { code: "OT-2026-013", title: "Reemplazo de quemadores de gas natural", description: "Reemplazo de quemadores y ajuste de control.", status: WorkOrderStatus.planificada, priority: Priority.alta, clientIdx: 5, projIdx: 4, respIdx: 9, startOff: 0, dueOff: 30, progress: 0, estCost: 8500000, actCost: 0 },
    { code: "OT-2026-014", title: "Reparacion de cilindro de prensa", description: "Reparacion de cilindro hidraulico.", status: WorkOrderStatus.revision, priority: Priority.media, clientIdx: 2, projIdx: null, respIdx: 7, startOff: -10, dueOff: 5, progress: 85, estCost: 3600000, actCost: 3100000 },
    { code: "OT-2026-015", title: "Montaje de tuberias de vapor", description: "Montaje y soldadura de tuberias de alta presion.", status: WorkOrderStatus.en_proceso, priority: Priority.critica, clientIdx: 1, projIdx: 2, respIdx: 14, startOff: -5, dueOff: 25, progress: 25, estCost: 11500000, actCost: 3200000 },
  ];

  const workOrders = [];
  for (const d of woData) {
    const wo = await prisma.workOrder.create({
      data: {
        code: d.code, title: d.title, description: d.description,
        status: d.status, priority: d.priority,
        startDate: offsetDate(d.startOff), dueDate: offsetDate(d.dueOff),
        completedAt: (d.status === WorkOrderStatus.completada || d.status === WorkOrderStatus.cerrada) ? offsetDate(d.dueOff) : null,
        progress: d.progress, estimatedCost: d.estCost, actualCost: d.actCost,
        clientId: clients[d.clientIdx].id,
        projectId: d.projIdx !== null ? projects[d.projIdx].id : null,
        responsibleId: workersAll[d.respIdx].id,
      }
    });
    workOrders.push(wo);
  }
  console.log(` ${workOrders.length} ordenes de trabajo\n`);

  // Tareas
  console.log("Creando tareas...");
  const taskTitles = ["Preparacion de superficies", "Corte y ajuste de piezas", "Soldadura de ensamblajes", "Inspeccion visual dimensional", "Pruebas no destructivas", "Mecanizado de acabado", "Montaje en campo", "Pruebas hidrostáticas"];
  let taskCount = 0;
  for (const wo of workOrders) {
    const n = 3 + (wo.id.charCodeAt(0) % 3);
    for (let i = 0; i < n; i++) {
      const p = Math.min(100, Math.max(0, wo.progress + (Math.random() * 30 - 15)));
      await prisma.workOrderTask.create({
        data: { workOrderId: wo.id, title: `${taskTitles[i % taskTitles.length]} - ${wo.code}`, description: `Tarea ${i+1}`, progress: Math.round(p), completed: p >= 100, dueDate: offsetDate(i * 3) }
      });
      taskCount++;
    }
  }
  console.log(` ${taskCount} tareas creadas\n`);

  // Asignaciones
  console.log("Asignando trabajadores...");
  let asnCount = 0;
  for (const wo of workOrders) {
    const used = new Set();
    const n = 2 + (wo.id.charCodeAt(1) % 3);
    while (used.size < n) used.add(Math.floor(Math.random() * workersAll.length));
    for (const idx of used) {
      await prisma.workerAssignment.create({ data: { workerId: workersAll[idx].id, workOrderId: wo.id, startDate: wo.startDate, endDate: wo.dueDate, hours: 40 + Math.floor(Math.random() * 80) } });
      asnCount++;
    }
  }
  console.log(` ${asnCount} asignaciones\n`);

  // Gantt
  console.log("Creando tareas Gantt...");
  const ganttTemplates = [
    { name: "Ingenieria y planificacion", dur: 10, off: 0 },
    { name: "Adquisicion de materiales", dur: 14, off: 5 },
    { name: "Corte y preparacion", dur: 8, off: 15 },
    { name: "Fabricacion de estructuras", dur: 20, off: 20 },
    { name: "Soldadura de componentes", dur: 18, off: 25 },
    { name: "Inspeccion de calidad", dur: 7, off: 40 },
    { name: "Pruebas no destructivas", dur: 5, off: 45 },
    { name: "Montaje en taller", dur: 12, off: 58 },
  ];
  const ganttStatuses = ["pendiente", "en_proceso", "completada", "detenida"];
  let ganttCount = 0;
  for (const p of projects) {
    for (let i = 0; i < 8; i++) {
      const tpl = ganttTemplates[i];
      const start = offsetDate(tpl.off - 30);
      const end = new Date(start); end.setDate(end.getDate() + tpl.dur);
      const prog = Math.round(Math.random() * 100);
      await prisma.ganttTask.create({
        data: { projectId: p.id, name: `${tpl.name} - ${p.code}`, startDate: start, endDate: end, progress: prog, status: ganttStatuses[Math.floor(Math.random() * 4)], responsible: workersAll[Math.floor(Math.random() * workersAll.length)].name }
      });
      ganttCount++;
    }
  }
  console.log(` ${ganttCount} tareas Gantt\n`);

  // Equipos y materiales
  console.log("Equipos y materiales...");
  const equip = [
    { name: "Maquina de soldadura TIG Miller 350", code: "EQ-SOLD-001", type: "Soldadura", status: "disponible" },
    { name: "Maquina de soldadura MIG Lincoln 500", code: "EQ-SOLD-002", type: "Soldadura", status: "en_uso" },
    { name: "Prensa hidraulica 200 ton", code: "EQ-PRENSA-001", type: "Mecanizado", status: "disponible" },
    { name: "Torno CNC Takisawa", code: "EQ-TORNO-001", type: "Mecanizado", status: "mantencion" },
    { name: "Grua puente 10 ton", code: "EQ-GRUA-001", type: "Izaje", status: "disponible" },
  ];
  for (const e of equip) { await prisma.equipment.create({ data: { companyId: boilerComp.id, ...e, lastService: offsetDate(-30), nextService: offsetDate(90) } }); }
  const mats = [
    { name: "Plancha de acero ASTM A516 Gr.70", code: "MAT-001", unit: "m2", stock: 120, minStock: 20, cost: 85000 },
    { name: "Electrodo E7018 3/32", code: "MAT-002", unit: "kg", stock: 350, minStock: 50, cost: 4200 },
    { name: "Tubo sin costura SCH40 2in", code: "MAT-003", unit: "m", stock: 80, minStock: 15, cost: 18000 },
    { name: "Refractario plastico", code: "MAT-004", unit: "saco", stock: 45, minStock: 10, cost: 32000 },
    { name: "Pintura epoxica industrial", code: "MAT-005", unit: "litro", stock: 200, minStock: 40, cost: 9500 },
    { name: "Valvula de seguridad 2in x 150 psi", code: "MAT-006", unit: "unidad", stock: 12, minStock: 3, cost: 145000 },
  ];
  for (const m of mats) { await prisma.material.create({ data: { companyId: boilerComp.id, ...m } }); }
  console.log(` ${equip.length} equipos, ${mats.length} materiales\n`);

  // HSEQ
  console.log("Registros HSEQ...");
  const hseqData = [
    { type: HseqType.inspeccion, norm: Norm.ISO_45001, description: "Inspeccion mensual de arnes y lineas de vida.", respIdx: 17, dueOff: 10, status: HseqStatus.abierto, sig: true },
    { type: HseqType.incidente, norm: Norm.DS_44, description: "Corte leve en mano durante preparacion de chapa.", respIdx: 5, dueOff: -2, status: HseqStatus.cerrado, sig: true },
    { type: HseqType.accion_correctiva, norm: Norm.ISO_9001, description: "Corregir desviacion dimensional en soporte.", respIdx: 0, dueOff: 5, status: HseqStatus.en_revision, sig: false },
    { type: HseqType.capacitacion, norm: Norm.ISO_45001, description: "Capacitacion en trabajo en altura.", respIdx: 17, dueOff: 20, status: HseqStatus.abierto, sig: false },
    { type: HseqType.permiso_trabajo, norm: Norm.DS_44, description: "Permiso de trabajo en caliente.", respIdx: 5, dueOff: 2, status: HseqStatus.cerrado, sig: true },
    { type: HseqType.matriz_riesgo, norm: Norm.ISO_14001, description: "Actualizacion matriz de riesgos proyecto Muelle Prat.", respIdx: 17, dueOff: 15, status: HseqStatus.abierto, sig: false },
    { type: HseqType.inspeccion, norm: Norm.ISO_9001, description: "Inspeccion de soldaduras con liquidos penetrantes.", respIdx: 6, dueOff: 8, status: HseqStatus.en_revision, sig: true },
    { type: HseqType.incidente, norm: Norm.ISO_45001, description: "Derrame controlado de aceite hidraulico.", respIdx: 5, dueOff: -5, status: HseqStatus.cerrado, sig: false },
    { type: HseqType.accion_correctiva, norm: Norm.ISO_14001, description: "Implementar contencion secundaria para tanques de aceite.", respIdx: 17, dueOff: 12, status: HseqStatus.abierto, sig: true },
    { type: HseqType.capacitacion, norm: Norm.ISO_9001, description: "Induccion en control documental.", respIdx: 0, dueOff: 18, status: HseqStatus.abierto, sig: false },
    { type: HseqType.permiso_trabajo, norm: Norm.DS_44, description: "Permiso de ingreso a espacio confinado.", respIdx: 5, dueOff: 1, status: HseqStatus.cerrado, sig: true },
    { type: HseqType.matriz_riesgo, norm: Norm.ISO_45001, description: "Matriz de riesgos para mantencion mayor LP-301.", respIdx: 17, dueOff: -10, status: HseqStatus.vencido, sig: true },
  ];
  for (const d of hseqData) {
    const rec = await prisma.hseqRecord.create({
      data: { companyId: boilerComp.id, type: d.type, norm: d.norm, description: d.description, responsibleId: workersAll[d.respIdx].id, date: new Date(), dueDate: offsetDate(d.dueOff), status: d.status, evidenceDocumental: "Evidencia registrada", signatureRequired: d.sig, signed: d.status === HseqStatus.cerrado && d.sig, signedAt: d.status === HseqStatus.cerrado && d.sig ? offsetDate(d.dueOff) : null }
    });
    if (d.status === HseqStatus.abierto || d.status === HseqStatus.en_revision) {
      await prisma.hseqAction.create({ data: { hseqRecordId: rec.id, description: `Accion derivada`, responsible: workersAll[d.respIdx].name, dueDate: offsetDate(d.dueOff + 5), completed: false } });
    }
  }
  console.log(` ${hseqData.length} registros HSEQ\n`);

  // Usuarios demo
  console.log("Creando usuarios demo...");
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = [
    { email: "gerencia@boilercomp.com", name: "Gerencia BOILER COMP", role: UserRole.ADMIN, companyId: boilerComp.id },
    { email: "admin@boilercomp.com", name: "Administrador Sistema", role: UserRole.ADMIN, companyId: boilerComp.id },
    { email: "hseq@boilercomp.com", name: "Gerente HSEQ", role: UserRole.HSEQ_MANAGER, companyId: boilerComp.id },
    { email: "ops@boilercomp.com", name: "Jefe Operaciones", role: UserRole.OPERATIONS, companyId: boilerComp.id },
    { email: "cliente1@ejemplo.com", name: "Usuario Cliente Demo", role: UserRole.CLIENT, clientId: clients[0].id },
    { email: "viewer@boilercomp.com", name: "Visualizador", role: UserRole.VIEWER, companyId: boilerComp.id },
  ];
  for (const u of users) {
    await prisma.user.create({ data: { email: u.email, name: u.name, password: hashedPassword, role: u.role, active: true, companyId: u.companyId || undefined, clientId: u.clientId || undefined } });
    console.log(` ${u.role.padEnd(18)} | ${u.email}`);
  }
  console.log("");

  // Resumen
  const woCount = await prisma.workOrder.count();
  const wCount = await prisma.worker.count();
  console.log("=".repeat(50));
  console.log("SEED COMPLETADO");
  console.log("=".repeat(50));
  console.log(`Empresas: 2 | Clientes: ${clients.length} | Trabajadores: ${wCount}`);
  console.log(`Proyectos: ${projects.length} | Ordenes: ${woCount} | HSEQ: ${hseqData.length}`);
  console.log(`Password para todos: demo1234`);
  console.log("=".repeat(50));
}

main().catch(e => { console.error("Error:", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
