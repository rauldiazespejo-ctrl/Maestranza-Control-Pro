"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { workerSchema, type WorkerFormData } from "@/lib/validations/worker";
import { requireAuth, READ_ROLES, OPERATIONS_ROLES, MANAGEABLE_ROLES } from "@/lib/auth";

function toDateOptional(value?: string) {
  return value ? new Date(value) : null;
}

export async function getWorkers(filters?: { status?: string; search?: string }) {
  await requireAuth(READ_ROLES);
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { rut: { contains: filters.search } },
      { specialty: { contains: filters.search } },
    ];
  }
  return prisma.worker.findMany({
    where,
    include: { assignments: { include: { workOrder: true } }, ledOrders: true },
    orderBy: { name: "asc" },
  });
}

export async function getWorkerById(id: string) {
  await requireAuth(READ_ROLES);
  return prisma.worker.findUnique({
    where: { id },
    include: { assignments: { include: { workOrder: true } }, ledOrders: true },
  });
}

export async function createWorker(data: WorkerFormData) {
  const session = await requireAuth(OPERATIONS_ROLES);

  const parsed = workerSchema.parse(data);
  const worker = await prisma.worker.create({
    data: {
      ...parsed,
      criticalExpires: toDateOptional(parsed.criticalExpires),
      companyId: (await prisma.company.findFirst({ orderBy: { createdAt: "asc" } }))?.id ?? "",
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "CREATE", entity: "Worker", entityId: worker.id },
  });

  revalidatePath("/trabajadores");
  return worker;
}

export async function updateWorker(id: string, data: WorkerFormData) {
  const session = await requireAuth(OPERATIONS_ROLES);

  const parsed = workerSchema.parse(data);
  const worker = await prisma.worker.update({
    where: { id },
    data: {
      ...parsed,
      criticalExpires: toDateOptional(parsed.criticalExpires),
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "UPDATE", entity: "Worker", entityId: worker.id },
  });

  revalidatePath("/trabajadores");
  return worker;
}

export async function deleteWorker(id: string) {
  await requireAuth(MANAGEABLE_ROLES);
  await prisma.worker.delete({ where: { id } });
  revalidatePath("/trabajadores");
}
