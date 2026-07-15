"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { workerSchema, type WorkerFormData } from "@/lib/validations/worker";
import { requireAuth, INTERNAL_READ_ROLES, OPERATIONS_ROLES, MANAGEABLE_ROLES } from "@/lib/auth";

function toDateOptional(value?: string) {
  return value ? new Date(value) : null;
}

export async function getWorkers(filters?: {
  status?: string;
  profile?: string;
  engagement?: string;
  search?: string;
}) {
  await requireAuth(INTERNAL_READ_ROLES);
  const where: import('@prisma/client').Prisma.WorkerWhereInput = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.profile) where.profile = filters.profile as WorkerFormData["profile"];
  if (filters?.engagement) where.engagement = filters.engagement as WorkerFormData["engagement"];
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { rut: { contains: filters.search, mode: "insensitive" } },
      { specialty: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  return prisma.worker.findMany({
    where,
    include: { assignments: { include: { workOrder: true } }, ledOrders: true },
    orderBy: { name: "asc" },
  });
}

export async function getWorkerById(id: string) {
  await requireAuth(INTERNAL_READ_ROLES);
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
      canCreateWorkers: parsed.profile === "supervisor" ? true : Boolean(parsed.canCreateWorkers),
      canAssignWorkOrders: parsed.profile === "supervisor" ? true : Boolean(parsed.canAssignWorkOrders),
      spotDescription: parsed.engagement === "spot" ? parsed.spotDescription : null,
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
      canCreateWorkers: parsed.profile === "supervisor" ? true : Boolean(parsed.canCreateWorkers),
      canAssignWorkOrders: parsed.profile === "supervisor" ? true : Boolean(parsed.canAssignWorkOrders),
      spotDescription: parsed.engagement === "spot" ? parsed.spotDescription : null,
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
