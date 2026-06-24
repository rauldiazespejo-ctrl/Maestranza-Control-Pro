import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Portal Cliente · Dashboard",
};

export default async function PortalDashboardPage() {
  const session = await auth();
  if (!session?.user?.clientId) redirect("/portal/login");

  const orders = await prisma.workOrder.findMany({
    where: { clientId: session.user.clientId },
    orderBy: { createdAt: "desc" },
  });

  const statusLabels: Record<string, string> = {
    nueva: "Nueva", planificada: "Planificada", en_proceso: "En proceso", detenida: "Detenida",
    revision: "En revisión", completada: "Completada", cerrada: "Cerrada",
  };

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold text-white">Dashboard Cliente</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><div className="text-xs uppercase text-steel">Total órdenes</div><div className="font-heading text-2xl font-bold text-white">{orders.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs uppercase text-steel">En proceso</div><div className="font-heading text-2xl font-bold text-white">{orders.filter((o) => o.status === "en_proceso").length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs uppercase text-steel">Completadas</div><div className="font-heading text-2xl font-bold text-white">{orders.filter((o) => o.status === "completada" || o.status === "cerrada").length}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Últimas órdenes</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy-light text-left text-xs uppercase text-steel"><tr><th className="px-4 py-3">Código</th><th className="px-4 py-3">Título</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Avance</th></tr></thead>
              <tbody className="divide-y divide-border-subtle">
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="hover:bg-navy-light/30">
                    <td className="px-4 py-3 text-white">{o.code}</td>
                    <td className="px-4 py-3 text-steel">{o.title}</td>
                    <td className="px-4 py-3"><Badge>{statusLabels[o.status]}</Badge></td>
                    <td className="px-4 py-3 text-steel">{o.progress}%</td>
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
