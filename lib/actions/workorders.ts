"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { workOrderSchema, type WorkOrderFormData } from "@/lib/validations/workorder";
import { requireAuth, READ_ROLES, OPERATIONS_ROLES, MANAGEABLE_ROLES } from "@/lib/auth";

function toDateOptional(value?: string) {
  return value ? new Date(value) : undefined;
}

export async function getWorkOrders(filters?: {
  status?: string;
  priority?: string;
  clientId?: string;
  search?: string;
}) {
  const session = await requireAuth(READ_ROLES);
  const where: import('@prisma/client').Prisma.WorkOrderWhereInput = {};

  if (session.user.role === "CLIENT" && session.user.clientId) {
    where.clientId = session.user.clientId;
  } else if (filters?.clientId) {
    where.clientId = filters.clientId;
  }

  if (filters?.status) where.status = filters.status as WorkOrderFormData["status"];
  if (filters?.priority) where.priority = filters.priority as WorkOrderFormData["priority"];
  if (filters?.search) {
    where.OR = [
      { code: { contains: filters.search, mode: "insensitive" } },
      { title: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.workOrder.findMany({
    where,
    include: { client: true, responsible: true, project: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getWorkOrderById(id: string) {
  const session = await requireAuth(READ_ROLES);
  const where: import('@prisma/client').Prisma.WorkOrderWhereInput = { id };
  
  if (session.user.role === "CLIENT" && session.user.clientId) {
    where.clientId = session.user.clientId;
  }

  const workOrder = await prisma.workOrder.findFirst({
    where,
    include: {
      client: true,
      responsible: true,
      project: true,
      tasks: true,
      assignments: { include: { worker: true } },
      documents: true,
    },
  });

  if (!workOrder) throw new Error("Orden de trabajo no encontrada o sin acceso");
  return workOrder;
}

export async function createWorkOrder(data: WorkOrderFormData) {
  const session = await requireAuth(OPERATIONS_ROLES);

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
  const session = await requireAuth(OPERATIONS_ROLES);

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
  await requireAuth(MANAGEABLE_ROLES);
  await prisma.workOrder.delete({ where: { id } });
  revalidatePath("/ordenes");
}

export async function updateWorkOrderStatus(id: string, status: string) {
  await requireAuth(OPERATIONS_ROLES);
  const order = await prisma.workOrder.update({
    where: { id },
    data: { status: status as WorkOrderFormData["status"] },
  });
  revalidatePath("/ordenes");
  return order;
}

export async function assignSupervisorToWorkOrder(id: string, supervisorId: string) {
  const session = await requireAuth(OPERATIONS_ROLES);
  const responsibleId = supervisorId || null;

  if (responsibleId) {
    const supervisor = await prisma.worker.findUnique({ where: { id: responsibleId } });
    if (!supervisor) throw new Error("Supervisor no encontrado");
    if (supervisor.status !== "activo") throw new Error("El supervisor no esta activo");
    if (supervisor.profile !== "supervisor") {
      throw new Error("Solo un trabajador con perfil supervisor puede quedar como supervisor de OT");
    }
  }

  const order = await prisma.workOrder.update({
    where: { id },
    data: { responsibleId },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "ASSIGN_SUPERVISOR",
      entity: "WorkOrder",
      entityId: order.id,
      metadata: JSON.stringify({ supervisorId: responsibleId }),
    },
  });

  revalidatePath(`/ordenes/${id}`);
  revalidatePath("/ordenes");
  return order;
}
