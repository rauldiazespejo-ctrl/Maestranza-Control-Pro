"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { workerSchema, type WorkerFormData } from "@/lib/validations/worker";
import { auth } from "@/lib/auth";

function toDateOptional(value?: string) {
  return value ? new Date(value) : null;
}

export async function getWorkers(filters?: { status?: string; search?: string }) {
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
  return prisma.worker.findUnique({
    where: { id },
    include: { assignments: { include: { workOrder: true } }, ledOrders: true },
  });
}

export async function createWorker(data: WorkerFormData) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

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
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

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
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");
  await prisma.worker.delete({ where: { id } });
  revalidatePath("/trabajadores");
}
