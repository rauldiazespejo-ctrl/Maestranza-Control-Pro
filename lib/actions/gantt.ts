"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ganttTaskSchema, type GanttTaskFormData } from "@/lib/validations/gantt";
import { requireAuth, READ_ROLES, OPERATIONS_ROLES, MANAGEABLE_ROLES } from "@/lib/auth";

function toDate(value: string) {
  return new Date(value);
}

export async function getGanttTasks(filters?: { projectId?: string; status?: string }) {
  const session = await requireAuth(READ_ROLES);

  const where: Record<string, unknown> = {};
  if (session.user.role === "CLIENT" && session.user.clientId) {
    where.project = { clientId: session.user.clientId };
  }

  if (filters?.projectId) where.projectId = filters.projectId;
  if (filters?.status) where.status = filters.status;

  return prisma.ganttTask.findMany({
    where,
    include: { project: { include: { client: true } }, workOrder: true },
    orderBy: { startDate: "asc" },
  });
}

export async function createGanttTask(data: GanttTaskFormData) {
  const session = await requireAuth(OPERATIONS_ROLES);
  
  const parsed = ganttTaskSchema.parse(data);
  const task = await prisma.ganttTask.create({
    data: {
      ...parsed,
      startDate: toDate(parsed.startDate),
      endDate: toDate(parsed.endDate),
      progress: Number(parsed.progress),
      workOrderId: parsed.workOrderId || null,
      responsible: parsed.responsible,
      dependencies: parsed.dependencies,
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "CREATE", entity: "GanttTask", entityId: task.id },
  });

  revalidatePath("/gantt");
  return task;
}

export async function updateGanttTask(id: string, data: GanttTaskFormData) {
  const session = await requireAuth(OPERATIONS_ROLES);

  const parsed = ganttTaskSchema.parse(data);
  const task = await prisma.ganttTask.update({
    where: { id },
    data: {
      ...parsed,
      startDate: toDate(parsed.startDate),
      endDate: toDate(parsed.endDate),
      progress: Number(parsed.progress),
      workOrderId: parsed.workOrderId || null,
      responsible: parsed.responsible,
      dependencies: parsed.dependencies,
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "UPDATE", entity: "GanttTask", entityId: task.id },
  });

  revalidatePath("/gantt");
  return task;
}

export async function deleteGanttTask(id: string) {
  await requireAuth(MANAGEABLE_ROLES);
  await prisma.ganttTask.delete({ where: { id } });
  revalidatePath("/gantt");
}
