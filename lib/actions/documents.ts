"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { documentSchema, type DocumentFormData } from "@/lib/validations/document";
import { auth } from "@/lib/auth";

export async function getDocuments(filters?: {
  workOrderId?: string;
  hseqRecordId?: string;
  type?: string;
  search?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.workOrderId) where.workOrderId = filters.workOrderId;
  if (filters?.hseqRecordId) where.hseqRecordId = filters.hseqRecordId;
  if (filters?.type) where.type = filters.type;
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { url: { contains: filters.search } },
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
  return prisma.document.findMany({
    where: { workOrderId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDocumentsByHseqRecord(hseqRecordId: string) {
  return prisma.document.findMany({
    where: { hseqRecordId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createDocument(data: DocumentFormData) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

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
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

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
