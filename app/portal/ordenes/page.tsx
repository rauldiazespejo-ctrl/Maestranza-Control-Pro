import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Portal Cliente · Mis órdenes",
};

export default async function PortalOrdenesPage() {
  const session = await auth();
  if (!session?.user?.clientId) redirect("/portal/login");

  const orders = await prisma.workOrder.findMany({
    where: { clientId: session.user.clientId },
    include: { responsible: true, tasks: true },
    orderBy: { createdAt: "desc" },
  });

  const statusLabels: Record<string, string> = {
    nueva: "Nueva", planificada: "Planificada", en_proceso: "En proceso", detenida: "Detenida",
    revision: "En revisión", completada: "Completada", cerrada: "Cerrada",
  };

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold text-white">Mis órdenes</h1>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy-light text-left text-xs uppercase text-steel">
                <tr><th className="px-4 py-3">Código</th><th className="px-4 py-3">Título</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Avance</th><th className="px-4 py-3">Compromiso</th><th className="px-4 py-3">Responsable</th></tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-navy-light/30">
                    <td className="px-4 py-3 text-white">{o.code}</td>
                    <td className="px-4 py-3 text-steel">{o.title}</td>
                    <td className="px-4 py-3"><Badge>{statusLabels[o.status]}</Badge></td>
                    <td className="px-4 py-3 text-steel">{o.progress}%</td>
                    <td className="px-4 py-3 text-steel">{o.dueDate ? o.dueDate.toLocaleDateString("es-CL") : "—"}</td>
                    <td className="px-4 py-3 text-steel">{o.responsible?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
