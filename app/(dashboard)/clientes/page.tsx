import { Suspense } from "react";
import { ClientesClient } from "@/components/clientes/ClientesClient";
import { getClients } from "@/lib/actions/clients";
import { LoadingState } from "@/components/ui/LoadingState";

export const metadata = {
  title: "Clientes",
};

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const clients = await getClients(params.search);

  return (
    <Suspense fallback={<LoadingState />}>
      <ClientesClient clients={clients} />
    </Suspense>
  );
}
