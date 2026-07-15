"use server";

import { prisma } from "@/lib/db";
import { requireAuth, INTERNAL_READ_ROLES } from "@/lib/auth";

/**
 * Resultado de busqueda global agrupado por entidad.
 */
export interface GlobalSearchResult {
  workOrders: Array<{
    id: string;
    code: string;
    title: string;
    status: string;
    priority: string;
  }>;
  workers: Array<{
    id: string;
    name: string;
    rut: string;
    position: string;
    specialty: string | null;
  }>;
  clients: Array<{
    id: string;
    name: string;
    rut: string | null;
    industry: string | null;
  }>;
}

/**
 * Busqueda global en WorkOrder, Worker y Client.
 * @param query - Termino de busqueda (minimo 2 caracteres).
 * @returns Resultados agrupados por entidad.
 * @throws {Error} Si el usuario no esta autenticado o el query es muy corto.
 */
export async function globalSearch(query: string): Promise<GlobalSearchResult> {
  await requireAuth(INTERNAL_READ_ROLES);

  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { workOrders: [], workers: [], clients: [] };
  }

  const searchTerm = trimmed;

  const [workOrders, workers, clients] = await Promise.all([
    prisma.workOrder.findMany({
      where: {
        OR: [
          { code: { contains: searchTerm, mode: "insensitive" } },
          { title: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        priority: true,
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.worker.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { rut: { contains: searchTerm, mode: "insensitive" } },
          { specialty: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        rut: true,
        position: true,
        specialty: true,
      },
      orderBy: { name: "asc" },
      take: 8,
    }),
    prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { rut: { contains: searchTerm, mode: "insensitive" } },
          { industry: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        rut: true,
        industry: true,
      },
      orderBy: { name: "asc" },
      take: 8,
    }),
  ]);

  return { workOrders, workers, clients };
}
