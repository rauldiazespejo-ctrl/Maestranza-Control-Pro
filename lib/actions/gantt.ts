"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ganttTaskSchema, type GanttTaskFormData } from "@/lib/validations/gantt";
import { auth } from "@/lib/auth";

function toDate(value: string) {
  return new Date(value);
}

export async function getGanttTasks(filters?: { projectId?: string; status?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.projectId) where.projectId = filters.projectId;
  if (filters?.status) where.status = filters.status;
  return prisma.ganttTask.findMany({
    where,
    include: { project: { include: { client: true } }, workOrder: true },
    orderBy: { startDate: "asc" },
  });
}

export async function createGanttTask(data: GanttTaskFormData) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");
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
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");
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
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");
  await prisma.ganttTask.delete({ where: { id } });
  revalidatePath("/gantt");
}
