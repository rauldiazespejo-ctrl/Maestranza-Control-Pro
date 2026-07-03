import { Suspense } from "react";
import { ReportesClient } from "@/components/reportes/ReportesClient";
import { getOperationalReport } from "@/lib/actions/reports";
import { LoadingState } from "@/components/ui/LoadingState";

export const metadata = {
  title: "Reportes · ForgeOps",
};

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const { orders, hseq, clients } = await getOperationalReport(params.from, params.to);

  return (
    <Suspense fallback={<LoadingState />}>
      <ReportesClient orders={orders} hseq={hseq} clients={clients} />
    </Suspense>
  );
}
