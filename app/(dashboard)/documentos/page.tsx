import { Suspense } from "react";
import { DocumentosClient } from "@/components/documentos/DocumentosClient";
import { getDocuments } from "@/lib/actions/documents";
import { prisma } from "@/lib/db";
import { LoadingState } from "@/components/ui/LoadingState";

export const metadata = {
  title: "Documentos y evidencias · MAESTRANZA Control Pro",
};

export default async function DocumentosPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; workOrderId?: string; hseqRecordId?: string }>;
}) {
  const params = await searchParams;

  const [documents, workOrders, hseqRecords] = await Promise.all([
    getDocuments({
      search: params.search,
      type: params.type,
      workOrderId: params.workOrderId,
      hseqRecordId: params.hseqRecordId,
    }),
    prisma.workOrder.findMany({
      select: { id: true, code: true, title: true },
      orderBy: { code: "asc" },
    }),
    prisma.hseqRecord.findMany({
      select: { id: true, type: true, description: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <Suspense fallback={<LoadingState />}>
      <DocumentosClient documents={documents} workOrders={workOrders} hseqRecords={hseqRecords} />
    </Suspense>
  );
}
