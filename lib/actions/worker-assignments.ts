"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, READ_ROLES, OPERATIONS_ROLES } from "@/lib/auth";
import {
  workerAssignmentSchema,
  workerAssignmentHoursSchema,
  type WorkerAssignmentFormData,
  type WorkerAssignmentHoursFormData,
} from "@/lib/validations/worker-assignment";

function toDateOptional(value?: string) {
  return value ? new Date(value) : null;
}

function toNumberOptional(value?: string) {
  return value && value.trim() !== "" ? Number(value) : null;
}

export async function getWorkerAssignmentsByWorkOrder(workOrderId: string) {
  const session = await requireAuth(READ_ROLES);
  
  if (session.user.role === "CLIENT" && session.user.clientId) {
    const wo = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
    if (wo?.clientId !== session.user.clientId) {
      throw new Error("No tienes permisos para ver las asignaciones de esta orden");
    }
  }

  return prisma.workerAssignment.findMany({
    where: { workOrderId },
    include: { worker: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getActiveWorkersForAssignment() {
  await requireAuth(READ_ROLES);
  return prisma.worker.findMany({
    where: { status: "activo" },
    select: {
      id: true,
      name: true,
      position: true,
      specialty: true,
      profile: true,
      engagement: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function assignWorkerToOrder(data: WorkerAssignmentFormData) {
  const session = await requireAuth(OPERATIONS_ROLES);

  const parsed = workerAssignmentSchema.parse(data);

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: parsed.workOrderId },
    select: { id: true },
  });
  if (!workOrder) throw new Error("Orden de trabajo no encontrada");

  const assignment = await prisma.$transaction(async (tx) => {
    const worker = await tx.worker.findUnique({
      where: { id: parsed.workerId },
    });

    if (!worker) throw new Error("Trabajador no encontrado");
    if (worker.status !== "activo") throw new Error("El trabajador no está activo");

    const existing = await tx.workerAssignment.findUnique({
      where: {
        workerId_workOrderId: {
          workerId: parsed.workerId,
          workOrderId: parsed.workOrderId,
        },
      },
    });

    if (existing) throw new Error("El trabajador ya está asignado a esta orden");

    const created = await tx.workerAssignment.create({
      data: {
        workerId: parsed.workerId,
        workOrderId: parsed.workOrderId,
        startDate: toDateOptional(parsed.startDate),
        endDate: toDateOptional(parsed.endDate),
        hours: toNumberOptional(parsed.hours),
      },
      include: { worker: true },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ASSIGN",
        entity: "WorkerAssignment",
        entityId: created.id,
        metadata: JSON.stringify({ workerId: parsed.workerId, workOrderId: parsed.workOrderId }),
      },
    });

    return created;
  });

  revalidatePath(`/ordenes/${parsed.workOrderId}`);
  revalidatePath("/ordenes");
  return assignment;
}

export async function removeWorkerAssignment(id: string, workOrderId: string) {
  const session = await requireAuth(OPERATIONS_ROLES);

  const existing = await prisma.workerAssignment.findUnique({
    where: { id },
    select: { id: true, workOrderId: true },
  });
  if (!existing) throw new Error("Asignación no encontrada");

  await prisma.$transaction(async (tx) => {
    await tx.workerAssignment.delete({ where: { id } });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UNASSIGN",
        entity: "WorkerAssignment",
        entityId: id,
        metadata: JSON.stringify({ workOrderId }),
      },
    });
  });

  revalidatePath(`/ordenes/${workOrderId}`);
  revalidatePath("/ordenes");
}

export async function updateAssignmentHours(id: string, data: WorkerAssignmentHoursFormData) {
  const session = await requireAuth(OPERATIONS_ROLES);

  const parsed = workerAssignmentHoursSchema.parse(data);

  const assignment = await prisma.$transaction(async (tx) => {
    const existing = await tx.workerAssignment.findUnique({ where: { id } });
    if (!existing) throw new Error("Asignación no encontrada");

    const updated = await tx.workerAssignment.update({
      where: { id },
      data: {
        hours: toNumberOptional(parsed.hours),
        startDate: toDateOptional(parsed.startDate),
        endDate: toDateOptional(parsed.endDate),
      },
      include: { worker: true },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entity: "WorkerAssignment",
        entityId: updated.id,
        metadata: JSON.stringify({ hours: parsed.hours }),
      },
    });

    return updated;
  });

  revalidatePath(`/ordenes/${assignment.workOrderId}`);
  revalidatePath("/ordenes");
  return assignment;
}
