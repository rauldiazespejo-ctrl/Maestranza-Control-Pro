import { Suspense } from "react";
import { DocumentosClient } from "@/components/documentos/DocumentosClient";
import { getDocuments } from "@/lib/actions/documents";
import { getWorkOrders } from "@/lib/actions/workorders";
import { getHseqRecords } from "@/lib/actions/hseq";
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
    getWorkOrders(),
    getHseqRecords(),
  ]);

  return (
    <Suspense fallback={<LoadingState />}>
      <DocumentosClient documents={documents} workOrders={workOrders} hseqRecords={hseqRecords} />
    </Suspense>
  );
}
