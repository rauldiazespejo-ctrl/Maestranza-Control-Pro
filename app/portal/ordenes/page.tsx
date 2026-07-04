import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getWorkOrders } from "@/lib/actions/workorders";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export const metadata = {
  title: "Portal Cliente · Mis órdenes",
};

export default async function PortalOrdenesPage() {
  const session = await auth();
  if (!session?.user?.clientId) redirect("/portal/login");

  const orders = await getWorkOrders();

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
            <Table>
              <TableHeader>
                <TableRow><TableHead>Código</TableHead><TableHead>Título</TableHead><TableHead>Estado</TableHead><TableHead>Avance</TableHead><TableHead>Compromiso</TableHead><TableHead>Responsable</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="text-white">{o.code}</TableCell>
                    <TableCell className="text-steel">{o.title}</TableCell>
                    <TableCell><Badge>{statusLabels[o.status]}</Badge></TableCell>
                    <TableCell className="text-steel">{o.progress}%</TableCell>
                    <TableCell className="text-steel">{o.dueDate ? o.dueDate.toLocaleDateString("es-CL") : "—"}</TableCell>
                    <TableCell className="text-steel">{o.responsible?.name ?? "—"}</TableCell>
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
