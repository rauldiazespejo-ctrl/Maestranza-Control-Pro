import { Suspense } from "react";
import { TrabajadoresClient } from "@/components/trabajadores/TrabajadoresClient";
import { getWorkers } from "@/lib/actions/workers";
import { LoadingState } from "@/components/ui/LoadingState";

export const metadata = {
  title: "Trabajadores · MAESTRANZA Control Pro",
};

export default async function TrabajadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const workers = await getWorkers({ search: params.search, status: params.status });

  return (
    <Suspense fallback={<LoadingState />}>
      <TrabajadoresClient workers={workers} />
    </Suspense>
  );
}
