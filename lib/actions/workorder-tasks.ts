"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  workOrderTaskSchema,
  type WorkOrderTaskFormData,
} from "@/lib/validations/workorder-task";
import { requireAuth, OPERATIONS_ROLES, MANAGEABLE_ROLES } from "@/lib/auth";

function toDateOptional(value?: string) {
  return value ? new Date(value) : undefined;
}

async function recalcWorkOrderProgress(workOrderId: string) {
  const tasks = await prisma.workOrderTask.findMany({
    where: { workOrderId },
  });

  const progress =
    tasks.length > 0
      ? tasks.reduce(
          (sum, task) => sum + (task.completed ? 100 : Number(task.progress)),
          0
        ) / tasks.length
      : 0;

  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { progress },
  });
}

export async function createWorkOrderTask(
  workOrderId: string,
  data: WorkOrderTaskFormData
) {
  const session = await requireAuth(OPERATIONS_ROLES);

  const parsed = workOrderTaskSchema.parse(data);

  const task = await prisma.workOrderTask.create({
    data: {
      workOrderId,
      title: parsed.title,
      description: parsed.description,
      progress: parsed.completed ? 100 : Number(parsed.progress),
      completed: parsed.completed,
      dueDate: toDateOptional(parsed.dueDate),
    },
  });

  await recalcWorkOrderProgress(workOrderId);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entity: "WorkOrderTask",
      entityId: task.id,
      metadata: JSON.stringify({ workOrderId }),
    },
  });

  revalidatePath(`/ordenes/${workOrderId}`);
  return task;
}

export async function updateWorkOrderTask(
  id: string,
  data: WorkOrderTaskFormData
) {
  const session = await requireAuth(OPERATIONS_ROLES);

  const parsed = workOrderTaskSchema.parse(data);

  const existing = await prisma.workOrderTask.findUnique({ where: { id } });
  if (!existing) throw new Error("Tarea no encontrada");

  const task = await prisma.workOrderTask.update({
    where: { id },
    data: {
      title: parsed.title,
      description: parsed.description,
      progress: parsed.completed ? 100 : Number(parsed.progress),
      completed: parsed.completed,
      dueDate: toDateOptional(parsed.dueDate),
    },
  });

  await recalcWorkOrderProgress(existing.workOrderId);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE",
      entity: "WorkOrderTask",
      entityId: task.id,
      metadata: JSON.stringify({ workOrderId: existing.workOrderId }),
    },
  });

  revalidatePath(`/ordenes/${existing.workOrderId}`);
  return task;
}

export async function deleteWorkOrderTask(id: string) {
  const session = await requireAuth(MANAGEABLE_ROLES);

  const task = await prisma.workOrderTask.findUnique({ where: { id } });
  if (!task) throw new Error("Tarea no encontrada");

  await prisma.workOrderTask.delete({ where: { id } });
  await recalcWorkOrderProgress(task.workOrderId);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE",
      entity: "WorkOrderTask",
      entityId: id,
      metadata: JSON.stringify({ workOrderId: task.workOrderId }),
    },
  });

  revalidatePath(`/ordenes/${task.workOrderId}`);
}

export async function toggleWorkOrderTask(id: string) {
  const session = await requireAuth(OPERATIONS_ROLES);

  const task = await prisma.workOrderTask.findUnique({ where: { id } });
  if (!task) throw new Error("Tarea no encontrada");

  const completed = !task.completed;
  const updated = await prisma.workOrderTask.update({
    where: { id },
    data: { completed, progress: completed ? 100 : 0 },
  });

  await recalcWorkOrderProgress(task.workOrderId);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "TOGGLE",
      entity: "WorkOrderTask",
      entityId: id,
      metadata: JSON.stringify({
        workOrderId: task.workOrderId,
        completed,
      }),
    },
  });

  revalidatePath(`/ordenes/${task.workOrderId}`);
  return updated;
}
