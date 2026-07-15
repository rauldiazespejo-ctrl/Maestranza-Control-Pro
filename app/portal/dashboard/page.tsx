import { getSession } from "@/lib/auth";
import { getWorkOrders } from "@/lib/actions/workorders";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export const metadata = {
  title: "Portal Cliente · Dashboard",
};

export default async function PortalDashboardPage() {
  const session = await getSession();
  if (!session?.user?.clientId) redirect("/portal/login");

  const orders = await getWorkOrders();

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
            <Table>
              <TableHeader>
                <TableRow><TableHead>Código</TableHead><TableHead>Título</TableHead><TableHead>Estado</TableHead><TableHead>Avance</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 5).map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="text-white">{o.code}</TableCell>
                    <TableCell className="text-steel">{o.title}</TableCell>
                    <TableCell><Badge>{statusLabels[o.status]}</Badge></TableCell>
                    <TableCell className="text-steel">{o.progress}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
