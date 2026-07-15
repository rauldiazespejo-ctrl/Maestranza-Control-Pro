import { Suspense } from "react";
import { HseqClient } from "@/components/hseq/HseqClient";
import { getHseqRecords, getSafetyWorkflows } from "@/lib/actions/hseq";
import { getWorkers } from "@/lib/actions/workers";
import { LoadingState } from "@/components/ui/LoadingState";

export const metadata = {
  title: "HSEQ",
};

export default async function HseqPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; norm?: string; status?: string }>;
}) {
  const params = await searchParams;
  const [records, workers, safety] = await Promise.all([
    getHseqRecords({ type: params.type, norm: params.norm, status: params.status }),
    getWorkers(),
    getSafetyWorkflows(),
  ]);

  return (
    <Suspense fallback={<LoadingState />}>
      <HseqClient records={records} workers={workers} safety={safety} />
    </Suspense>
  );
}
