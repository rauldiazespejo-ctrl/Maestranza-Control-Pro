import { Suspense } from "react";
import { ConfiguracionClient } from "@/components/configuracion/ConfiguracionClient";
import { getUsers } from "@/lib/actions/users";
import { prisma } from "@/lib/db";
import { LoadingState } from "@/components/ui/LoadingState";

export const metadata = {
  title: "Configuración · MAESTRANZA Control Pro",
};

export default async function ConfiguracionPage() {
  const [users, company, clients] = await Promise.all([
    getUsers(),
    prisma.company.findFirst({ orderBy: { createdAt: "asc" } }),
    prisma.client.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <Suspense fallback={<LoadingState />}>
      <ConfiguracionClient users={users} company={company} clients={clients} />
    </Suspense>
  );
}
