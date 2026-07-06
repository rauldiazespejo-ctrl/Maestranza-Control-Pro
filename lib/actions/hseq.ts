"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  astFormSchema,
  hseqRecordSchema,
  permitFormSchema,
  type AstFormData,
  type HseqRecordFormData,
  type PermitFormData,
} from "@/lib/validations/hseq";
import { requireAuth, HSEQ_ROLES, MANAGEABLE_ROLES, READ_ROLES } from "@/lib/auth";

function toDateOptional(value?: string) {
  return value ? new Date(value) : undefined;
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*\d.)]+\s*/, "").trim())
    .filter(Boolean);
}

function toPermitStatus(startAt: Date, endAt: Date) {
  const now = new Date();
  if (endAt < now) return "vencido";
  return startAt <= now ? "activo" : "aprobado";
}

export async function getHseqRecords(filters?: { type?: string; norm?: string; status?: string }) {
  await requireAuth(READ_ROLES);
  const where: import('@prisma/client').Prisma.HseqRecordWhereInput = {};
  if (filters?.type) where.type = filters.type as HseqRecordFormData["type"];
  if (filters?.norm) where.norm = filters.norm as HseqRecordFormData["norm"];
  if (filters?.status) where.status = filters.status as HseqRecordFormData["status"];
  return prisma.hseqRecord.findMany({
    where,
    include: { responsible: true },
    orderBy: { date: "desc" },
  });
}

export async function getHseqRecordById(id: string) {
  await requireAuth(READ_ROLES);
  return prisma.hseqRecord.findUnique({
    where: { id },
    include: { responsible: true, actions: true, documents: true },
  });
}

export async function getSafetyWorkflows() {
  await requireAuth(READ_ROLES);
  const [asts, permits, workOrders, equipment] = await Promise.all([
    prisma.ast.findMany({
      include: {
        workOrder: { select: { id: true, code: true, title: true } },
        workOrderTask: { select: { id: true, title: true, critical: true, requiresPermit: true } },
        equipment: { select: { id: true, name: true, code: true, status: true } },
        steps: { include: { hazards: true }, orderBy: { stepOrder: "asc" } },
        permits: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.workPermit.findMany({
      include: {
        ast: { select: { id: true, status: true, riskLevel: true } },
        workOrder: { select: { id: true, code: true, title: true } },
        workOrderTask: { select: { id: true, title: true } },
        equipment: { select: { id: true, name: true, code: true, status: true } },
        checklist: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.workOrder.findMany({
      select: {
        id: true,
        code: true,
        title: true,
        tasks: {
          select: {
            id: true,
            title: true,
            processArea: true,
            critical: true,
            requiresPermit: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.equipment.findMany({
      select: { id: true, name: true, code: true, type: true, status: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { asts, permits, workOrders, equipment };
}

export async function createHseqRecord(data: HseqRecordFormData) {
  const session = await requireAuth(HSEQ_ROLES);

  const parsed = hseqRecordSchema.parse(data);
  const company = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });

  if (!company?.id) {
    throw new Error("No existe empresa base para crear registros HSEQ");
  }

  const record = await prisma.hseqRecord.create({
    data: {
      ...parsed,
      date: new Date(parsed.date),
      dueDate: toDateOptional(parsed.dueDate),
      responsibleId: parsed.responsibleId || null,
      companyId: company.id,
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "CREATE", entity: "HseqRecord", entityId: record.id },
  });

  revalidatePath("/hseq");
  return record;
}

export async function updateHseqRecord(id: string, data: HseqRecordFormData) {
  const session = await requireAuth(HSEQ_ROLES);

  const parsed = hseqRecordSchema.parse(data);
  const record = await prisma.hseqRecord.update({
    where: { id },
    data: {
      ...parsed,
      date: new Date(parsed.date),
      dueDate: toDateOptional(parsed.dueDate),
      responsibleId: parsed.responsibleId || null,
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "UPDATE", entity: "HseqRecord", entityId: record.id },
  });

  revalidatePath("/hseq");
  return record;
}

export async function deleteHseqRecord(id: string) {
  await requireAuth(MANAGEABLE_ROLES);
  await prisma.hseqRecord.delete({ where: { id } });
  revalidatePath("/hseq");
}

export async function createAst(data: AstFormData) {
  const session = await requireAuth(HSEQ_ROLES);
  const parsed = astFormSchema.parse(data);
  const steps = splitLines(parsed.stepsText);
  const hazards = splitLines(parsed.hazardsText);

  const ast = await prisma.$transaction(async (tx) => {
    const workOrder = await tx.workOrder.findUnique({ where: { id: parsed.workOrderId } });
    if (!workOrder) throw new Error("OT no encontrada para AST");

    if (parsed.workOrderTaskId) {
      const task = await tx.workOrderTask.findUnique({ where: { id: parsed.workOrderTaskId } });
      if (!task || task.workOrderId !== parsed.workOrderId) {
        throw new Error("La tarea seleccionada no pertenece a la OT");
      }
    }

    const created = await tx.ast.create({
      data: {
        workOrderId: parsed.workOrderId,
        workOrderTaskId: parsed.workOrderTaskId ?? null,
        area: parsed.area,
        equipmentId: parsed.equipmentId ?? null,
        riskLevel: parsed.riskLevel,
        supervisor: parsed.supervisor,
        preStartChecks: parsed.preStartChecks,
        evidence: parsed.evidence,
        createdBy: session.user.id,
        steps: {
          create: steps.map((description, index) => ({
            stepOrder: index + 1,
            description,
            hazards: {
              create: (hazards.length > 0 ? hazards : ["Peligro operacional por evaluar"]).map((hazard) => ({
                hazardType: hazard,
                initialRisk: parsed.riskLevel,
                controls: parsed.preStartChecks ?? "Controles administrativos, EPP y supervisión directa",
                residualRisk: parsed.riskLevel === "critico" ? "alto" : parsed.riskLevel,
              })),
            },
          })),
        },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_AST",
        entity: "Ast",
        entityId: created.id,
        workOrderId: created.workOrderId,
        metadata: JSON.stringify({ riskLevel: created.riskLevel, workOrderTaskId: created.workOrderTaskId }),
      },
    });

    return created;
  });

  revalidatePath("/hseq");
  revalidatePath(`/ordenes/${ast.workOrderId}`);
  return ast;
}

export async function approveAst(id: string) {
  const session = await requireAuth(HSEQ_ROLES);

  const ast = await prisma.$transaction(async (tx) => {
    const existing = await tx.ast.findUnique({
      where: { id },
      include: { steps: { include: { hazards: true } } },
    });
    if (!existing) throw new Error("AST no encontrado");
    if (existing.steps.length === 0 || existing.steps.some((step) => step.hazards.length === 0)) {
      throw new Error("El AST debe tener pasos y peligros antes de aprobar");
    }
    if ((existing.riskLevel === "alto" || existing.riskLevel === "critico") && !existing.evidence) {
      throw new Error("AST de alto riesgo requiere evidencia documental antes de aprobar");
    }

    const updated = await tx.ast.update({
      where: { id },
      data: {
        status: "aprobado",
        approvedBy: session.user.id,
        approvedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "APPROVE_AST",
        entity: "Ast",
        entityId: updated.id,
        workOrderId: updated.workOrderId,
        metadata: JSON.stringify({ version: updated.version, riskLevel: updated.riskLevel }),
      },
    });

    return updated;
  });

  revalidatePath("/hseq");
  revalidatePath(`/ordenes/${ast.workOrderId}`);
  return ast;
}

export async function createWorkPermit(data: PermitFormData) {
  const session = await requireAuth(HSEQ_ROLES);
  const parsed = permitFormSchema.parse(data);
  const startAt = new Date(parsed.startAt);
  const endAt = new Date(parsed.endAt);
  const checklist = splitLines(parsed.checklistText);

  const permit = await prisma.$transaction(async (tx) => {
    const ast = await tx.ast.findUnique({ where: { id: parsed.astId } });
    if (!ast) throw new Error("AST relacionado no encontrado");
    if (ast.status !== "aprobado") throw new Error("El PTW requiere un AST aprobado");
    if (ast.workOrderId !== parsed.workOrderId) throw new Error("El AST no pertenece a la OT seleccionada");

    if (parsed.workOrderTaskId && ast.workOrderTaskId && ast.workOrderTaskId !== parsed.workOrderTaskId) {
      throw new Error("El PTW debe usar la misma tarea crítica del AST");
    }

    const created = await tx.workPermit.create({
      data: {
        type: parsed.type,
        workOrderId: parsed.workOrderId,
        workOrderTaskId: parsed.workOrderTaskId ?? ast.workOrderTaskId,
        astId: parsed.astId,
        area: parsed.area,
        equipmentId: parsed.equipmentId ?? ast.equipmentId,
        startAt,
        endAt,
        preconditions: parsed.preconditions,
        createdBy: session.user.id,
        checklist: {
          create: checklist.map((label) => ({
            label,
            required: true,
            checked: true,
            checkedBy: session.user.id,
            checkedAt: new Date(),
          })),
        },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_PTW",
        entity: "WorkPermit",
        entityId: created.id,
        workOrderId: created.workOrderId,
        metadata: JSON.stringify({ type: created.type, astId: created.astId }),
      },
    });

    return created;
  });

  revalidatePath("/hseq");
  revalidatePath(`/ordenes/${permit.workOrderId}`);
  return permit;
}

export async function approveWorkPermit(id: string) {
  const session = await requireAuth(HSEQ_ROLES);

  const permit = await prisma.$transaction(async (tx) => {
    const existing = await tx.workPermit.findUnique({
      where: { id },
      include: {
        ast: true,
        checklist: true,
        equipment: { include: { certifications: true } },
      },
    });
    if (!existing) throw new Error("PTW no encontrado");
    if (existing.ast.status !== "aprobado") throw new Error("El AST relacionado debe estar aprobado");
    if (existing.endAt < new Date()) throw new Error("No se puede aprobar un PTW vencido");
    if (existing.checklist.some((item) => item.required && !item.checked)) {
      throw new Error("Checklist del PTW incompleto");
    }
    if (existing.equipment) {
      if (existing.equipment.status !== "disponible") {
        throw new Error("Equipo no disponible para permiso de trabajo");
      }
      const hasValidCertification = existing.equipment.certifications.some(
        (cert) => cert.status === "vigente" && cert.validTo >= new Date()
      );
      if (existing.equipment.certifications.length > 0 && !hasValidCertification) {
        throw new Error("Equipo sin certificación vigente");
      }
    }

    const updated = await tx.workPermit.update({
      where: { id },
      data: {
        status: toPermitStatus(existing.startAt, existing.endAt),
        approvedBy: session.user.id,
        approvedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "APPROVE_PTW",
        entity: "WorkPermit",
        entityId: updated.id,
        workOrderId: updated.workOrderId,
        metadata: JSON.stringify({ status: updated.status, type: updated.type }),
      },
    });

    return updated;
  });

  revalidatePath("/hseq");
  revalidatePath(`/ordenes/${permit.workOrderId}`);
  return permit;
}
