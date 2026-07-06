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

async function recalcWorkOrderProgress(tx: typeof prisma, workOrderId: string) {
  const tasks = await tx.workOrderTask.findMany({
    where: { workOrderId },
  });

  const progress =
    tasks.length > 0
      ? tasks.reduce((sum, task) => sum + (task.completed ? 100 : Number(task.progress)), 0) /
        tasks.length
      : 0;

  await tx.workOrder.update({
    where: { id: workOrderId },
    data: { progress },
  });
}

async function assertCriticalTaskClearance(tx: typeof prisma, taskId: string) {
  const task = await tx.workOrderTask.findUnique({
    where: { id: taskId },
    include: {
      workOrder: {
        include: {
          assignments: { include: { worker: true } },
        },
      },
      asts: true,
      permits: { include: { equipment: { include: { certifications: true } } } },
    },
  });

  if (!task) throw new Error("Tarea no encontrada");
  if (!task.critical) return;

  const approvedAst = task.asts.find((ast) => ast.status === "aprobado");
  if (!approvedAst) {
    throw new Error("Bloqueo HSEQ: tarea crítica sin AST aprobado");
  }

  if (task.requiresPermit) {
    const now = new Date();
    const validPermit = task.permits.find(
      (permit) =>
        (permit.status === "activo" || permit.status === "aprobado") &&
        permit.startAt <= now &&
        permit.endAt >= now
    );

    if (!validPermit) {
      throw new Error("Bloqueo HSEQ: tarea crítica sin PTW vigente");
    }

    if (validPermit.equipment) {
      if (validPermit.equipment.status !== "disponible") {
        throw new Error("Bloqueo HSEQ: equipo asociado no disponible");
      }

      const certifications = validPermit.equipment.certifications;
      const hasExpiredCertification = certifications.some(
        (cert) => cert.status !== "vigente" || cert.validTo < now
      );
      if (hasExpiredCertification) {
        throw new Error("Bloqueo HSEQ: certificación de equipo vencida");
      }
    }
  }

  const expiredCompetency = task.workOrder.assignments.find((assignment) => {
    const expires = assignment.worker.criticalExpires;
    return expires !== null && expires < new Date();
  });

  if (expiredCompetency) {
    throw new Error(`Bloqueo HSEQ: habilitación vencida de ${expiredCompetency.worker.name}`);
  }
}

export async function createWorkOrderTask(
  workOrderId: string,
  data: WorkOrderTaskFormData
) {
  const session = await requireAuth(OPERATIONS_ROLES);

  const parsed = workOrderTaskSchema.parse(data);

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.workOrderTask.create({
      data: {
        workOrderId,
        title: parsed.title,
        description: parsed.description,
        processArea: parsed.processArea,
        critical: parsed.critical,
        requiresPermit: parsed.requiresPermit,
        progress: parsed.completed ? 100 : Number(parsed.progress),
        completed: parsed.completed,
        dueDate: toDateOptional(parsed.dueDate),
      },
    });

    if (created.completed || created.progress > 0) {
      await assertCriticalTaskClearance(tx as typeof prisma, created.id);
    }

    await recalcWorkOrderProgress(tx as typeof prisma, workOrderId);

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "WorkOrderTask",
        entityId: created.id,
        metadata: JSON.stringify({ workOrderId }),
      },
    });

    return created;
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

  const task = await prisma.$transaction(async (tx) => {
    const updated = await tx.workOrderTask.update({
      where: { id },
      data: {
        title: parsed.title,
        description: parsed.description,
        processArea: parsed.processArea,
        critical: parsed.critical,
        requiresPermit: parsed.requiresPermit,
        progress: parsed.completed ? 100 : Number(parsed.progress),
        completed: parsed.completed,
        dueDate: toDateOptional(parsed.dueDate),
      },
    });

    if (updated.completed || updated.progress > 0) {
      await assertCriticalTaskClearance(tx as typeof prisma, updated.id);
    }

    await recalcWorkOrderProgress(tx as typeof prisma, existing.workOrderId);

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entity: "WorkOrderTask",
        entityId: updated.id,
        metadata: JSON.stringify({ workOrderId: existing.workOrderId }),
      },
    });

    return updated;
  });

  revalidatePath(`/ordenes/${existing.workOrderId}`);
  return task;
}

export async function deleteWorkOrderTask(id: string) {
  const session = await requireAuth(MANAGEABLE_ROLES);

  const task = await prisma.workOrderTask.findUnique({ where: { id } });
  if (!task) throw new Error("Tarea no encontrada");

  await prisma.$transaction(async (tx) => {
    await tx.workOrderTask.delete({ where: { id } });
    await recalcWorkOrderProgress(tx as typeof prisma, task.workOrderId);

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entity: "WorkOrderTask",
        entityId: id,
        metadata: JSON.stringify({ workOrderId: task.workOrderId }),
      },
    });
  });

  revalidatePath(`/ordenes/${task.workOrderId}`);
}

export async function toggleWorkOrderTask(id: string) {
  const session = await requireAuth(OPERATIONS_ROLES);

  const task = await prisma.workOrderTask.findUnique({ where: { id } });
  if (!task) throw new Error("Tarea no encontrada");

  const completed = !task.completed;
  const updated = await prisma.$transaction(async (tx) => {
    if (completed) {
      await assertCriticalTaskClearance(tx as typeof prisma, id);
    }

    const toggled = await tx.workOrderTask.update({
      where: { id },
      data: { completed, progress: completed ? 100 : 0 },
    });

    await recalcWorkOrderProgress(tx as typeof prisma, task.workOrderId);

    await tx.auditLog.create({
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

    return toggled;
  });

  revalidatePath(`/ordenes/${task.workOrderId}`);
  return updated;
}
