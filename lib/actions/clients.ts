"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { clientSchema, type ClientFormData } from "@/lib/validations/client";
import { auth, OPERATIONS_ROLES, MANAGEABLE_ROLES } from "@/lib/auth";

export async function getClients(search?: string) {
  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { rut: { contains: search } },
      { industry: { contains: search } },
    ];
  }
  return prisma.client.findMany({ where, include: { _count: { select: { workOrders: true } } }, orderBy: { name: "asc" } });
}

export async function getClientById(id: string) {
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
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  if (!OPERATIONS_ROLES.includes(session.user.role as typeof OPERATIONS_ROLES[number])) {
    throw new Error("No tienes permisos para crear clientes");
  }

  const parsed = clientSchema.parse(data);
  const company = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });
  const client = await prisma.client.create({
    data: {
      ...parsed,
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
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  if (!OPERATIONS_ROLES.includes(session.user.role as typeof OPERATIONS_ROLES[number])) {
    throw new Error("No tienes permisos para actualizar clientes");
  }

  const parsed = clientSchema.parse(data);
  const client = await prisma.client.update({
    where: { id },
    data: { ...parsed, paymentTerm: parsed.paymentTerm ? Number(parsed.paymentTerm) : null },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "UPDATE", entity: "Client", entityId: client.id },
  });

  revalidatePath("/clientes");
  return client;
}

export async function deleteClient(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  if (!MANAGEABLE_ROLES.includes(session.user.role as typeof MANAGEABLE_ROLES[number])) {
    throw new Error("No tienes permisos para eliminar clientes");
  }
  await prisma.client.delete({ where: { id } });
  revalidatePath("/clientes");
}
