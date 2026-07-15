"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { OPERATIONS_ROLES, requireAuth } from "@/lib/auth";
import { fieldProgressSchema, type FieldProgressInput } from "@/lib/validations/labor";

export async function reportFieldProgress(input: FieldProgressInput) {
  const session = await requireAuth(OPERATIONS_ROLES);
  const data = fieldProgressSchema.parse(input);
  const task = await prisma.workOrderTask.findUnique({
    where: { id: data.taskId },
    include: { asts: true, permits: true, ganttTask: { select: { id: true } } },
  });
  if (!task) throw new Error("Tarea no encontrada");
  if (task.critical && data.progress > task.progress) {
    if (!task.asts.some((ast) => ast.status === "aprobado")) {
      throw new Error("Bloqueo HSEQ: la tarea crítica no tiene AST aprobado");
    }
    if (task.requiresPermit) {
      const now = new Date();
      const validPermit = task.permits.some((permit) =>
        (permit.status === "activo" || permit.status === "aprobado") && permit.startAt <= now && permit.endAt >= now
      );
      if (!validPermit) throw new Error("Bloqueo HSEQ: la tarea crítica no tiene PTW vigente");
    }
  }

  const update = await prisma.$transaction(async (tx) => {
    const created = await tx.taskProgressUpdate.create({
      data: { taskId: task.id, workerId: data.workerId || null, progress: data.progress, actualHours: data.actualHours, comment: data.comment, blocked: data.blocked, blocker: data.blocker || null, evidenceUrl: data.evidenceUrl || null, reportedBy: session.user.name || session.user.email || session.user.id },
    });
    await tx.workOrderTask.update({ where: { id: task.id }, data: { progress: data.progress, completed: data.progress === 100 } });
    if (task.ganttTask) {
      await tx.ganttTask.update({
        where: { id: task.ganttTask.id },
        data: {
          progress: data.progress,
          status: data.blocked ? "detenida" : data.progress === 100 ? "completada" : data.progress > 0 ? "en_progreso" : "pendiente",
        },
      });
    }
    const tasks = await tx.workOrderTask.findMany({ where: { workOrderId: task.workOrderId }, select: { progress: true } });
    const orderProgress = tasks.length ? tasks.reduce((sum, item) => sum + item.progress, 0) / tasks.length : 0;
    await tx.workOrder.update({ where: { id: task.workOrderId }, data: { progress: orderProgress } });
    await tx.auditLog.create({ data: { userId: session.user.id, action: "FIELD_PROGRESS", entity: "WorkOrderTask", entityId: task.id, metadata: JSON.stringify({ progress: data.progress, actualHours: data.actualHours, blocked: data.blocked }) } });
    return created;
  });
  revalidatePath(`/ordenes/${task.workOrderId}`);
  revalidatePath("/gantt");
  return update;
}
