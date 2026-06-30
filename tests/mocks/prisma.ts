import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended';
import { type PrismaClient } from '@prisma/client';
import { vi, beforeEach } from 'vitest';

// ── Prisma Mock ───────────────────────────────────────────────────

/**
 * Mock profundo del PrismaClient con soporte para todas las operaciones
 * CRUD en cada modelo. Se resetea automáticamente antes de cada test.
 */
export const prismaMock: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>();

/**
 * Mock del módulo @/lib/db que exporta el prisma client.
 * Todos los server actions y funciones que importen `prisma` desde
 * `@/lib/db` usarán este mock automáticamente.
 */
vi.mock('@/lib/db', () => ({
  prisma: prismaMock,
}));

beforeEach(() => {
  mockReset(prismaMock);
});

// ── Helpers para crear datos mock ─────────────────────────────────

/**
 * Crea un usuario mock completo.
 */
export function createMockUser(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: 'usr-test-001',
    email: 'admin@boilercomp.cl',
    rut: '12.345.678-9',
    name: 'Usuario Admin',
    password: '$2a$10$hashedpassword',
    role: 'ADMIN',
    active: true,
    companyId: 'comp-test-001',
    clientId: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-06-01'),
    ...overrides,
  };
}

/**
 * Crea una orden de trabajo mock.
 */
export function createMockWorkOrder(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: 'wo-test-001',
    code: 'OT-2024-001',
    title: 'Orden de prueba',
    description: 'Descripcion de prueba',
    status: 'nueva',
    priority: 'media',
    startDate: null,
    dueDate: null,
    completedAt: null,
    progress: 0,
    responsibleId: null,
    clientId: null,
    projectId: null,
    estimatedCost: null,
    actualCost: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Crea un trabajador mock.
 */
export function createMockWorker(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: 'wrk-test-001',
    companyId: 'comp-test-001',
    name: 'Juan Pérez',
    rut: '9.876.543-2',
    position: 'Soldador',
    specialty: 'TIG',
    status: 'activo',
    certifications: null,
    criticalExpires: null,
    phone: '+56912345678',
    email: 'juan@boilercomp.cl',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Crea un cliente mock.
 */
export function createMockClient(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: 'cli-test-001',
    companyId: 'comp-test-001',
    name: 'Cliente Demo S.A.',
    rut: '76.123.456-7',
    industry: 'Mineria',
    address: 'Av. Prueba 123',
    phone: '+56998765432',
    email: 'contacto@cliente.cl',
    paymentTerm: 30,
    notes: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Crea un registro HSEQ mock.
 */
export function createMockHseqRecord(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: 'hseq-test-001',
    companyId: 'comp-test-001',
    type: 'inspeccion',
    norm: 'ISO_45001',
    description: 'Inspección de seguridad mensual',
    responsibleId: null,
    date: new Date('2024-06-01'),
    dueDate: null,
    status: 'abierto',
    evidenceDocumental: null,
    signatureRequired: false,
    signed: false,
    signedAt: null,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01'),
    ...overrides,
  };
}

/**
 * Crea una tarea de Gantt mock.
 */
export function createMockGanttTask(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: 'gantt-test-001',
    projectId: 'proj-test-001',
    workOrderId: null,
    name: 'Tarea de prueba',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-06-15'),
    progress: 50,
    status: 'en_progreso',
    dependencies: null,
    responsible: null,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01'),
    ...overrides,
  };
}

/**
 * Crea un documento mock.
 */
export function createMockDocument(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: 'doc-test-001',
    workOrderId: 'wo-test-001',
    hseqRecordId: null,
    name: 'Documento de prueba',
    url: 'https://storage.example.com/doc1.pdf',
    type: 'pdf',
    public: false,
    createdAt: new Date('2024-06-01'),
    ...overrides,
  };
}
