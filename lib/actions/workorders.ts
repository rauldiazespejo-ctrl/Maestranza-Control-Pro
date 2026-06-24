"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { workOrderSchema, type WorkOrderFormData } from "@/lib/validations/workorder";
import { auth } from "@/lib/auth";

function toDateOptional(value?: string) {
  return value ? new Date(value) : undefined;
}

export async function getWorkOrders(filters?: {
  status?: string;
  priority?: string;
  clientId?: string;
  search?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.priority) where.priority = filters.priority;
  if (filters?.clientId) where.clientId = filters.clientId;
  if (filters?.search) {
    where.OR = [
      { code: { contains: filters.search } },
      { title: { contains: filters.search } },
    ];
  }

  return prisma.workOrder.findMany({
    where,
    include: { client: true, responsible: true, project: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getWorkOrderById(id: string) {
  return prisma.workOrder.findUnique({
    where: { id },
    include: {
      client: true,
      responsible: true,
      project: true,
      tasks: true,
      assignments: { include: { worker: true } },
      documents: true,
    },
  });
}

export async function createWorkOrder(data: WorkOrderFormData) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const parsed = workOrderSchema.parse(data);
  const order = await prisma.workOrder.create({
    data: {
      ...parsed,
      startDate: toDateOptional(parsed.startDate),
      dueDate: toDateOptional(parsed.dueDate),
      responsibleId: parsed.responsibleId || null,
      clientId: parsed.clientId || null,
      projectId: parsed.projectId || null,
      progress: Number(parsed.progress),
      estimatedCost: parsed.estimatedCost ? Number(parsed.estimatedCost) : null,
      actualCost: parsed.actualCost ? Number(parsed.actualCost) : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entity: "WorkOrder",
      entityId: order.id,
    },
  });

  revalidatePath("/ordenes");
  return order;
}

export async function updateWorkOrder(id: string, data: WorkOrderFormData) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const parsed = workOrderSchema.parse(data);
  const order = await prisma.workOrder.update({
    where: { id },
    data: {
      ...parsed,
      startDate: toDateOptional(parsed.startDate),
      dueDate: toDateOptional(parsed.dueDate),
      responsibleId: parsed.responsibleId || null,
      clientId: parsed.clientId || null,
      projectId: parsed.projectId || null,
      progress: Number(parsed.progress),
      estimatedCost: parsed.estimatedCost ? Number(parsed.estimatedCost) : null,
      actualCost: parsed.actualCost ? Number(parsed.actualCost) : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE",
      entity: "WorkOrder",
      entityId: order.id,
    },
  });

  revalidatePath("/ordenes");
  return order;
}

export async function deleteWorkOrder(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  await prisma.workOrder.delete({ where: { id } });
  revalidatePath("/ordenes");
}

export async function updateWorkOrderStatus(id: string, status: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const order = await prisma.workOrder.update({
    where: { id },
    data: { status: status as WorkOrderFormData["status"] },
  });
  revalidatePath("/ordenes");
  return order;
}
