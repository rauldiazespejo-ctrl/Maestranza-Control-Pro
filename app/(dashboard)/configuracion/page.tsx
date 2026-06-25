import { Suspense } from "react";
import { ConfiguracionClient } from "@/components/configuracion/ConfiguracionClient";
import { getUsers } from "@/lib/actions/users";
import { getClients } from "@/lib/actions/clients";
import { prisma } from "@/lib/db";
import { requireAuth, MANAGEABLE_ROLES } from "@/lib/auth";
import { LoadingState } from "@/components/ui/LoadingState";

export const metadata = {
  title: "Configuración · MAESTRANZA Control Pro",
};

export default async function ConfiguracionPage() {
  await requireAuth(MANAGEABLE_ROLES);

  const [users, company, clients] = await Promise.all([
    getUsers(),
    prisma.company.findFirst({ orderBy: { createdAt: "asc" } }),
    getClients(),
  ]);

  return (
    <Suspense fallback={<LoadingState />}>
      <ConfiguracionClient users={users} company={company} clients={clients} />
    </Suspense>
  );
}
