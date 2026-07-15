"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { OPERATIONS_ROLES, READ_ROLES, requireAuth } from "@/lib/auth";
import { laborEntrySchema, type LaborEntryInput } from "@/lib/validations/labor";

function monthBounds(month: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) throw new Error("Mes inválido");
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  return {
    from: new Date(Date.UTC(year, monthIndex, 1)),
    to: new Date(Date.UTC(year, monthIndex + 1, 1)),
  };
}

export async function getLaborCalendar(month: string) {
  await requireAuth(READ_ROLES);
  const { from, to } = monthBounds(month);
  const [assignments, entries] = await Promise.all([
    prisma.workerAssignment.findMany({
      where: { worker: { status: "activo" } },
      include: {
        worker: { select: { id: true, name: true, position: true } },
        workOrder: { select: { id: true, code: true, title: true, tasks: { select: { id: true, title: true } } } },
      },
      orderBy: [{ worker: { name: "asc" } }, { workOrder: { code: "asc" } }],
    }),
    prisma.laborEntry.findMany({
      where: { workDate: { gte: from, lt: to } },
      include: {
        worker: { select: { id: true, name: true, position: true } },
        workOrder: { select: { id: true, code: true, title: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: [{ workDate: "asc" }, { worker: { name: "asc" } }],
    }),
  ]);
  return { assignments, entries };
}

export async function upsertLaborEntry(input: LaborEntryInput) {
  const session = await requireAuth(OPERATIONS_ROLES);
  const data = laborEntrySchema.parse(input);
  const assignment = await prisma.workerAssignment.findUnique({
    where: { id: data.assignmentId },
    include: { workOrder: { select: { tasks: { select: { id: true } } } } },
  });
  if (!assignment) throw new Error("Asignación no encontrada");
  if (data.taskId && !assignment.workOrder.tasks.some((task) => task.id === data.taskId)) {
    throw new Error("La tarea no pertenece a la OT seleccionada");
  }
  const workDate = new Date(`${data.workDate}T00:00:00.000Z`);
  const existing = data.id
    ? await prisma.laborEntry.findUnique({ where: { id: data.id } })
    : await prisma.laborEntry.findFirst({
        where: { assignmentId: assignment.id, workDate, shift: data.shift, taskId: data.taskId || null },
      });
  const entry = existing
    ? await prisma.laborEntry.update({ where: { id: existing.id }, data: { assignmentId: assignment.id, workerId: assignment.workerId, workOrderId: assignment.workOrderId, taskId: data.taskId || null, workDate, shift: data.shift, plannedHours: data.plannedHours, actualHours: data.actualHours, notes: data.notes || null } })
    : await prisma.laborEntry.create({ data: { assignmentId: assignment.id, workerId: assignment.workerId, workOrderId: assignment.workOrderId, taskId: data.taskId || null, workDate, plannedHours: data.plannedHours, actualHours: data.actualHours, shift: data.shift, notes: data.notes || null } });
  await prisma.auditLog.create({ data: { userId: session.user.id, action: existing ? "UPDATE" : "CREATE", entity: "LaborEntry", entityId: entry.id, metadata: JSON.stringify({ workDate: data.workDate, plannedHours: data.plannedHours, workOrderId: assignment.workOrderId }) } });
  revalidatePath("/planificacion");
  revalidatePath(`/ordenes/${assignment.workOrderId}`);
  return entry;
}

export async function deleteLaborEntry(id: string) {
  const session = await requireAuth(OPERATIONS_ROLES);
  const entry = await prisma.laborEntry.findUnique({ where: { id } });
  if (!entry) throw new Error("Registro HH no encontrado");
  await prisma.$transaction([
    prisma.laborEntry.delete({ where: { id } }),
    prisma.auditLog.create({ data: { userId: session.user.id, action: "DELETE", entity: "LaborEntry", entityId: id } }),
  ]);
  revalidatePath("/planificacion");
}
