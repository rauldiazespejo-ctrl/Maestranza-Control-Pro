"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ganttTaskSchema, type GanttTaskFormData } from "@/lib/validations/gantt";
import { requireAuth, READ_ROLES, OPERATIONS_ROLES, MANAGEABLE_ROLES } from "@/lib/auth";
import { Prisma } from "@prisma/client";
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

const legacyFabricationProcessCodes: Record<string, string> = {
  "01": "DET-01",
  "02": "DET-02",
  "03": "MAT-01",
  "04": "MAT-01",
  "05": "MAT-02",
  "06": "MAT-02",
  "07": "ENS-01",
  "08": "ENS-02",
  "09": "SOL-02",
  "10": "DES-01",
  "11": "DES-02",
  "12": "DES-02",
  "13": "QA-01",
  "14": "QA-02",
  "15": "QA-03",
  "16": "ING-03",
};

function fabricationProcessCode(task: { name: string; processCode?: string | null }) {
  if (task.processCode) return task.processCode.toUpperCase();
  const currentCode = task.name.match(/^([A-Z]{2,3}-\d{2})\s*[·-]/i)?.[1];
  if (currentCode) return currentCode.toUpperCase();
  const legacyCode = task.name.match(/^(\d{2})\s*[·-]/)?.[1];
  return legacyCode ? legacyFabricationProcessCodes[legacyCode] ?? null : null;
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

  try {
    const result = await prisma.$transaction(async (tx) => {
      const workOrder = await tx.workOrder.findUnique({
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
        // Reutilizar proyecto existente por codigo para evitar violacion de @unique(Project.code)
        const existingProjectByCode = workOrder.code
          ? await tx.project.findFirst({ where: { code: workOrder.code }, select: { id: true } })
          : null;

        if (existingProjectByCode?.id) {
          projectId = existingProjectByCode.id;
        } else {
          const companyId =
            workOrder.client?.companyId ??
            session.user.companyId ??
            (await tx.company.findFirst({ select: { id: true } }))?.id;

          if (!companyId) {
            throw new Error("No existe empresa base para crear el proyecto asociado a la OT");
          }

          const project = await tx.project.create({
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

          projectId = project.id;
        }

        await tx.workOrder.update({
          where: { id: workOrder.id },
          data: { projectId },
        });
      }

      // Include legacy tasks without workOrderId: older generators only linked the project.
      const existingTasks = await tx.ganttTask.findMany({
        where: { OR: [{ workOrderId: workOrder.id }, { projectId }] },
        orderBy: { startDate: "asc" },
      });

      const existingByProcess = new Map<string, typeof existingTasks>();
      for (const task of existingTasks) {
        const code = fabricationProcessCode(task);
        if (!code) continue;
        existingByProcess.set(code, [...(existingByProcess.get(code) ?? []), task]);
      }
      const plannedStart = workOrder.startDate ?? new Date();
      const plannedEnd = workOrder.dueDate ?? addCalendarDays(plannedStart, totalFabricationProcessDays - 1);
      const plannedDays = daysBetween(plannedStart, plannedEnd);
      let previousTaskId: string | null = null;
      let created = 0;
      let updated = 0;
      let removed = 0;
      let cumulativeDefaultDays = 0;

      for (const process of fabricationProcessDefinitions) {
        const taskName = `${process.code} · ${process.group} · ${process.name}`;
        const startOffset = Math.round((cumulativeDefaultDays / totalFabricationProcessDays) * plannedDays);
        cumulativeDefaultDays += process.defaultDays;
        const nextOffset = Math.round((cumulativeDefaultDays / totalFabricationProcessDays) * plannedDays);
        const startDate = addCalendarDays(plannedStart, Math.min(startOffset, plannedDays - 1));
        const endDate = addCalendarDays(plannedStart, Math.max(startOffset, nextOffset - 1));
        const candidates = existingByProcess.get(process.code) ?? [];
        const existing = candidates.find((task) => task.workOrderId === workOrder.id) ?? candidates[0];

        if (existing) {
          const duplicateIds = candidates.filter((task) => task.id !== existing.id).map((task) => task.id);
          if (duplicateIds.length > 0) {
            const deletion = await tx.ganttTask.deleteMany({ where: { id: { in: duplicateIds } } });
            removed += deletion.count;
          }
          const updatedTask = await tx.ganttTask.update({
            where: { id: existing.id },
            data: {
              projectId,
              workOrderId: workOrder.id,
              processCode: process.code,
              name: taskName,
              startDate,
              endDate,
              responsible: workOrder.responsible?.name ?? process.responsibleRole,
              dependencies: previousTaskId && previousTaskId !== existing.id ? previousTaskId : null,
            },
          });
          let operationalTaskId = updatedTask.workOrderTaskId;
          if (!operationalTaskId) {
            const operationalTask = await tx.workOrderTask.findFirst({
              where: { workOrderId: workOrder.id, processArea: process.code },
              select: { id: true },
            }) ?? await tx.workOrderTask.create({
              data: {
                workOrderId: workOrder.id,
                title: process.name,
                description: `Proceso de fabricación ${process.group}`,
                processArea: process.code,
                dueDate: endDate,
              },
              select: { id: true },
            });
            operationalTaskId = operationalTask.id;
            await tx.ganttTask.update({ where: { id: updatedTask.id }, data: { workOrderTaskId: operationalTaskId } });
          } else {
            await tx.workOrderTask.update({ where: { id: operationalTaskId }, data: { title: process.name, processArea: process.code, dueDate: endDate } });
          }
          previousTaskId = existing.id;
          updated += 1;
          continue;
        }

        const createdTask: { id: string } = await tx.ganttTask.create({
          data: {
            projectId,
            workOrderId: workOrder.id,
            processCode: process.code,
            name: taskName,
            startDate,
            endDate,
            progress: 0,
            status: "pendiente",
            responsible: workOrder.responsible?.name ?? process.responsibleRole,
            dependencies: previousTaskId ? previousTaskId : undefined,
          },
        });

        const operationalTask = await tx.workOrderTask.create({
          data: {
            workOrderId: workOrder.id,
            title: process.name,
            description: `Proceso de fabricación ${process.group}`,
            processArea: process.code,
            dueDate: endDate,
          },
          select: { id: true },
        });
        await tx.ganttTask.update({ where: { id: createdTask.id }, data: { workOrderTaskId: operationalTask.id } });

        previousTaskId = createdTask.id;
        created += 1;
      }

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          workOrderId: workOrder.id,
          action: "GENERATE_FABRICATION_GANTT",
          entity: "WorkOrder",
          entityId: workOrder.id,
          metadata: JSON.stringify({ created, updated, removed, projectId }),
        },
      });

      return { created, updated, removed, projectId, workOrderCode: workOrder.code, workOrderId: workOrder.id };
    }, { maxWait: 10_000, timeout: 30_000 });

    revalidatePath("/gantt");
    revalidatePath("/ordenes");
    revalidatePath(`/ordenes/${result.workOrderId}`);

    return {
      created: result.created,
      updated: result.updated,
      removed: result.removed,
      projectId: result.projectId,
      workOrderCode: result.workOrderCode,
    };
  } catch (error) {
    const errorCode =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: string }).code
        : undefined;

    if (
      errorCode === "P2002" ||
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
    ) {
      throw new Error("Conflicto de datos al crear proyecto/tareas para la OT. Intenta nuevamente.");
    }

    throw error;
  }
}
