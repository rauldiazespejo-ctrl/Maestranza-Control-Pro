"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { hseqRecordSchema, type HseqRecordFormData } from "@/lib/validations/hseq";
import { auth, HSEQ_ROLES, MANAGEABLE_ROLES } from "@/lib/auth";

function toDateOptional(value?: string) {
  return value ? new Date(value) : undefined;
}

export async function getHseqRecords(filters?: { type?: string; norm?: string; status?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.type) where.type = filters.type;
  if (filters?.norm) where.norm = filters.norm;
  if (filters?.status) where.status = filters.status;
  return prisma.hseqRecord.findMany({
    where,
    include: { responsible: true },
    orderBy: { date: "desc" },
  });
}

export async function getHseqRecordById(id: string) {
  return prisma.hseqRecord.findUnique({
    where: { id },
    include: { responsible: true, actions: true, documents: true },
  });
}

export async function createHseqRecord(data: HseqRecordFormData) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  if (!HSEQ_ROLES.includes(session.user.role as typeof HSEQ_ROLES[number])) {
    throw new Error("No tienes permisos para crear registros HSEQ");
  }

  const parsed = hseqRecordSchema.parse(data);
  const company = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });
  const record = await prisma.hseqRecord.create({
    data: {
      ...parsed,
      date: new Date(parsed.date),
      dueDate: toDateOptional(parsed.dueDate),
      responsibleId: parsed.responsibleId || null,
      companyId: company?.id ?? "",
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "CREATE", entity: "HseqRecord", entityId: record.id },
  });

  revalidatePath("/hseq");
  return record;
}

export async function updateHseqRecord(id: string, data: HseqRecordFormData) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  if (!HSEQ_ROLES.includes(session.user.role as typeof HSEQ_ROLES[number])) {
    throw new Error("No tienes permisos para actualizar registros HSEQ");
  }

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
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  if (!MANAGEABLE_ROLES.includes(session.user.role as typeof MANAGEABLE_ROLES[number])) {
    throw new Error("No tienes permisos para eliminar registros HSEQ");
  }
  await prisma.hseqRecord.delete({ where: { id } });
  revalidatePath("/hseq");
}
