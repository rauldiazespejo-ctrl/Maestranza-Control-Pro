"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { documentSchema, type DocumentFormData } from "@/lib/validations/document";
import { requireAuth, READ_ROLES, WRITE_ROLES, MANAGEABLE_ROLES } from "@/lib/auth";

export async function getDocuments(filters?: {
  workOrderId?: string;
  hseqRecordId?: string;
  type?: string;
  search?: string;
}) {
  const session = await requireAuth(READ_ROLES);
  const where: import('@prisma/client').Prisma.DocumentWhereInput = {};
  
  if (session.user.role === "CLIENT" && session.user.clientId) {
    where.workOrder = { clientId: session.user.clientId };
  }

  if (filters?.workOrderId) where.workOrderId = filters.workOrderId;
  if (filters?.hseqRecordId) where.hseqRecordId = filters.hseqRecordId;
  if (filters?.type) where.type = filters.type;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { url: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.document.findMany({
    where,
    include: {
      workOrder: { select: { id: true, code: true, title: true } },
      hseqRecord: { select: { id: true, type: true, description: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDocumentsByWorkOrder(workOrderId: string) {
  const session = await requireAuth(READ_ROLES);
  const where: import('@prisma/client').Prisma.DocumentWhereInput = { workOrderId };
  if (session.user.role === "CLIENT" && session.user.clientId) {
    where.workOrder = { clientId: session.user.clientId };
  }

  return prisma.document.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

export async function getDocumentsByHseqRecord(hseqRecordId: string) {
  const session = await requireAuth(READ_ROLES);
  // Un cliente normalmente no tiene registros HSEQ, pero por si acaso.
  if (session.user.role === "CLIENT") {
    return []; // O lanzar error
  }
  
  return prisma.document.findMany({
    where: { hseqRecordId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createDocument(data: DocumentFormData) {
  const session = await requireAuth(WRITE_ROLES);
  const parsed = documentSchema.parse(data);

  const document = await prisma.document.create({
    data: {
      name: parsed.name,
      url: parsed.url,
      type: parsed.type ?? null,
      public: parsed.isPublic,
      workOrderId: parsed.workOrderId || null,
      hseqRecordId: parsed.hseqRecordId || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entity: "Document",
      entityId: document.id,
      metadata: JSON.stringify({
        workOrderId: document.workOrderId,
        hseqRecordId: document.hseqRecordId,
      }),
    },
  });

  revalidatePath("/documentos");
  if (document.workOrderId) revalidatePath(`/ordenes/${document.workOrderId}`);
  if (document.hseqRecordId) revalidatePath(`/hseq/${document.hseqRecordId}`);

  return document;
}

export async function deleteDocument(id: string) {
  const session = await requireAuth(MANAGEABLE_ROLES);

  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) throw new Error("Documento no encontrado");

  await prisma.document.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE",
      entity: "Document",
      entityId: document.id,
      metadata: JSON.stringify({
        workOrderId: document.workOrderId,
        hseqRecordId: document.hseqRecordId,
      }),
    },
  });

  revalidatePath("/documentos");
  if (document.workOrderId) revalidatePath(`/ordenes/${document.workOrderId}`);
  if (document.hseqRecordId) revalidatePath(`/hseq/${document.hseqRecordId}`);

  return document;
}
