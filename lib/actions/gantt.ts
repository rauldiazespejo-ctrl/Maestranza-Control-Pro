"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ganttTaskSchema, type GanttTaskFormData } from "@/lib/validations/gantt";
import { requireAuth, READ_ROLES, OPERATIONS_ROLES, MANAGEABLE_ROLES } from "@/lib/auth";
import {
  fabricationProcessDefinitions,
  totalFabricationProcessDays,
} from "@/lib/fabrication-processes";

function toDate(value: string) {
  return new Date(value);
}

function addCalendarDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function daysBetween(start: Date, end: Date) {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(1, Math.round((endUtc - startUtc) / 86_400_000) + 1);
}

function scaleProcessDuration(defaultDays: number, plannedDays: number) {
  const ratio = plannedDays / totalFabricationProcessDays;
  return Math.max(1, Math.round(defaultDays * ratio));
}

export async function getGanttTasks(filters?: { projectId?: string; status?: string }) {
  const session = await requireAuth(READ_ROLES);

  const where: import('@prisma/client').Prisma.GanttTaskWhereInput = {};
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

export async function createFabricationGanttFromWorkOrder(workOrderId: string) {
  const session = await requireAuth(OPERATIONS_ROLES);

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: {
      client: true,
      project: true,
      responsible: true,
    },
  });

  if (!workOrder) throw new Error("Orden de trabajo no encontrada");

  let projectId = workOrder.projectId;

  if (!projectId) {
    const companyId =
      workOrder.client?.companyId ??
      session.user.companyId ??
      (await prisma.company.findFirst({ select: { id: true } }))?.id;

    if (!companyId) {
      throw new Error("No existe empresa base para crear el proyecto asociado a la OT");
    }

    const project = await prisma.project.create({
      data: {
        companyId,
        clientId: workOrder.clientId,
        code: workOrder.code,
        name: `OT ${workOrder.code} · ${workOrder.title}`,
        description: "Proyecto creado automaticamente desde carta Gantt de fabricacion.",
        startDate: workOrder.startDate,
        endDate: workOrder.dueDate,
        status: "activo",
      },
    });

    await prisma.workOrder.update({
      where: { id: workOrder.id },
      data: { projectId: project.id },
    });

    projectId = project.id;
  }

  const existingTasks = await prisma.ganttTask.findMany({
    where: { workOrderId: workOrder.id },
    orderBy: { startDate: "asc" },
  });

  const existingNames = new Set(existingTasks.map((task) => task.name));
  const plannedStart = workOrder.startDate ?? new Date();
  const plannedEnd = workOrder.dueDate ?? addCalendarDays(plannedStart, totalFabricationProcessDays - 1);
  const plannedDays = daysBetween(plannedStart, plannedEnd);
  let cursor = new Date(plannedStart);
  let previousTaskId = existingTasks.at(-1)?.id ?? null;
  let created = 0;
  let skipped = 0;

  for (const process of fabricationProcessDefinitions) {
    const taskName = `${process.code} · ${process.group} · ${process.name}`;
    const duration = scaleProcessDuration(process.defaultDays, plannedDays);
    const startDate = new Date(cursor);
    const endDate = addCalendarDays(startDate, duration - 1);

    if (existingNames.has(taskName)) {
      skipped += 1;
      cursor = addCalendarDays(endDate, 1);
      continue;
    }

    const task = await prisma.ganttTask.create({
      data: {
        projectId,
        workOrderId: workOrder.id,
        name: taskName,
        startDate,
        endDate,
        progress: 0,
        status: "pendiente",
        responsible: workOrder.responsible?.name ?? process.responsibleRole,
        dependencies: previousTaskId ? previousTaskId : undefined,
      },
    });

    previousTaskId = task.id;
    created += 1;
    cursor = addCalendarDays(endDate, 1);
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      workOrderId: workOrder.id,
      action: "GENERATE_FABRICATION_GANTT",
      entity: "WorkOrder",
      entityId: workOrder.id,
      metadata: JSON.stringify({ created, skipped, projectId }),
    },
  });

  revalidatePath("/gantt");
  revalidatePath("/ordenes");
  revalidatePath(`/ordenes/${workOrder.id}`);

  return { created, skipped, projectId, workOrderCode: workOrder.code };
}
