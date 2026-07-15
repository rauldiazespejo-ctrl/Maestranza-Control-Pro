"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { clientSchema, type ClientFormData } from "@/lib/validations/client";
import { normalizeRut } from "@/lib/validations/rut";
import { requireAuth, requireClientId, READ_ROLES, OPERATIONS_ROLES, MANAGEABLE_ROLES } from "@/lib/auth";

export async function getClients(search?: string) {
  const session = await requireAuth(READ_ROLES);
  const where: import('@prisma/client').Prisma.ClientWhereInput = {};
  
  const scopedClientId = requireClientId(session.user.role, session.user.clientId);
  if (session.user.role === "CLIENT") {
    where.id = scopedClientId!;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { rut: { contains: search, mode: "insensitive" } },
      { industry: { contains: search, mode: "insensitive" } },
    ];
  }
  return prisma.client.findMany({ where, include: { _count: { select: { workOrders: true } } }, orderBy: { name: "asc" } });
}

export async function getClientById(id: string) {
  const session = await requireAuth(READ_ROLES);
  const scopedClientId = requireClientId(session.user.role, session.user.clientId);
  if (session.user.role === "CLIENT" && scopedClientId !== id) {
    throw new Error("No tienes permisos para ver este cliente");
  }

  return prisma.client.findUnique({
    where: { id },
    include: {
      contacts: true,
      workOrders: { orderBy: { createdAt: "desc" } },
      projects: true,
    },
  });
}

export async function createClient(data: ClientFormData) {
  const session = await requireAuth(OPERATIONS_ROLES);

  const parsed = clientSchema.parse(data);
  const company = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });
  const client = await prisma.client.create({
    data: {
      ...parsed,
      rut: parsed.rut ? normalizeRut(parsed.rut) : null,
      companyId: company?.id ?? "",
      paymentTerm: parsed.paymentTerm ? Number(parsed.paymentTerm) : null,
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "CREATE", entity: "Client", entityId: client.id },
  });

  revalidatePath("/clientes");
  return client;
}

export async function updateClient(id: string, data: ClientFormData) {
  const session = await requireAuth(OPERATIONS_ROLES);

  const parsed = clientSchema.parse(data);
  const client = await prisma.client.update({
    where: { id },
    data: {
      ...parsed,
      rut: parsed.rut ? normalizeRut(parsed.rut) : null,
      paymentTerm: parsed.paymentTerm ? Number(parsed.paymentTerm) : null,
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "UPDATE", entity: "Client", entityId: client.id },
  });

  revalidatePath("/clientes");
  return client;
}

export async function deleteClient(id: string) {
  await requireAuth(MANAGEABLE_ROLES);
  await prisma.client.delete({ where: { id } });
  revalidatePath("/clientes");
}
