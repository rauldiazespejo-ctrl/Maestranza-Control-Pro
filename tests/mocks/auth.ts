import { vi } from 'vitest';
import type { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';

/**
 * Cast tipado: auth es NextMiddleware pero en server components
 * se invoca como () => Promise<Session | null>.
 */
const authGetter = vi.mocked(auth as unknown as () => Promise<unknown>);

// ── Session Mock Factory ──────────────────────────────────────────

/**
 * Crea una sesión mock para NextAuth con el rol especificado.
 *
 * @param role - Rol del usuario (ADMIN, HSEQ_MANAGER, OPERATIONS, CLIENT, VIEWER)
 * @param overrides - Propiedades adicionales para sobrescribir
 * @returns Objeto session compatible con next-auth
 */
export function createMockSession(
  role: UserRole = 'ADMIN',
  overrides?: Partial<Record<string, unknown>>
) {
  return {
    user: {
      id: 'usr-test-001',
      email: 'test@boilercomp.cl',
      name: 'Usuario de Prueba',
      role,
      clientId: null,
      companyId: 'comp-test-001',
      image: null,
      ...overrides,
    },
    expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Sesión de usuario ADMIN (acceso total)
 */
export const adminSession = createMockSession('ADMIN');

/**
 * Sesión de usuario HSEQ_MANAGER
 */
export const hseqSession = createMockSession('HSEQ_MANAGER');

/**
 * Sesión de usuario OPERATIONS
 */
export const operationsSession = createMockSession('OPERATIONS');

/**
 * Sesión de usuario CLIENT
 */
export const clientSession = createMockSession('CLIENT');

/**
 * Sesión de usuario VIEWER (solo lectura)
 */
export const viewerSession = createMockSession('VIEWER');

// ── Mock Functions ────────────────────────────────────────────────

/**
 * Configura el mock de auth para simular un usuario logueado.
 * Uso: antes del test, llama `mockAuthLoggedIn('ADMIN')`
 */
export function mockAuthLoggedIn(role: UserRole = 'ADMIN') {
  const session = createMockSession(role);
  authGetter.mockResolvedValue(session);
  return session;
}

/**
 * Configura el mock de auth para simular usuario no logueado.
 */
export function mockAuthLoggedOut() {
  authGetter.mockResolvedValue(null);
}

/**
 * Resetea los mocks de auth al estado inicial.
 */
export function resetAuthMocks() {
  vi.clearAllMocks();
}

// ── Permission Matrix ─────────────────────────────────────────────

/**
 * Matriz de permisos por rol para testing de RBAC.
 * Cada entrada indica si el rol tiene acceso a la funcionalidad.
 */
export const PERMISSION_MATRIX: Record<UserRole, Record<string, boolean>> = {
  ADMIN: {
    readDashboard: true,
    writeWorkOrders: true,
    deleteWorkOrders: true,
    readHseq: true,
    writeHseq: true,
    manageUsers: true,
    manageClients: true,
    readGantt: true,
    writeGantt: true,
    readDocuments: true,
    writeDocuments: true,
    manageSettings: true,
    readReports: true,
    writeWorkers: true,
    deleteWorkers: true,
  },
  HSEQ_MANAGER: {
    readDashboard: true,
    writeWorkOrders: true,
    deleteWorkOrders: false,
    readHseq: true,
    writeHseq: true,
    manageUsers: false,
    manageClients: false,
    readGantt: true,
    writeGantt: true,
    readDocuments: true,
    writeDocuments: true,
    manageSettings: false,
    readReports: true,
    writeWorkers: true,
    deleteWorkers: false,
  },
  OPERATIONS: {
    readDashboard: true,
    writeWorkOrders: true,
    deleteWorkOrders: false,
    readHseq: true,
    writeHseq: false,
    manageUsers: false,
    manageClients: false,
    readGantt: true,
    writeGantt: true,
    readDocuments: true,
    writeDocuments: true,
    manageSettings: false,
    readReports: true,
    writeWorkers: true,
    deleteWorkers: false,
  },
  CLIENT: {
    readDashboard: true,
    writeWorkOrders: false,
    deleteWorkOrders: false,
    readHseq: false,
    writeHseq: false,
    manageUsers: false,
    manageClients: false,
    readGantt: true,
    writeGantt: false,
    readDocuments: true,
    writeDocuments: false,
    manageSettings: false,
    readReports: true,
    writeWorkers: false,
    deleteWorkers: false,
  },
  VIEWER: {
    readDashboard: true,
    writeWorkOrders: false,
    deleteWorkOrders: false,
    readHseq: false,
    writeHseq: false,
    manageUsers: false,
    manageClients: false,
    readGantt: true,
    writeGantt: false,
    readDocuments: true,
    writeDocuments: false,
    manageSettings: false,
    readReports: true,
    writeWorkers: false,
    deleteWorkers: false,
  },
};
