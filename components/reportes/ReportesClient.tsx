"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Prisma } from "@prisma/client";

interface Props {
  orders: Prisma.WorkOrderGetPayload<{ include: { client: true } }>[];
  hseq: Prisma.HseqRecordGetPayload<object>[];
  clients: Prisma.ClientGetPayload<{ include: { _count: { select: { workOrders: true } } } }>[];
}

export function ReportesClient({ orders, hseq, clients }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [from, setFrom] = React.useState(searchParams.get("from") ?? "");
  const [to, setTo] = React.useState(searchParams.get("to") ?? "");

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const overdueOrders = orders.filter((o) => o.dueDate && new Date(o.dueDate) < new Date() && o.status !== "completada" && o.status !== "cerrada");
  const openHseq = hseq.filter((r) => r.status === "abierto" || r.status === "vencido");

  const exportCsv = () => {
    const headers = ["Codigo", "Titulo", "Cliente", "Estado", "Prioridad", "Avance", "Compromiso", "CostoEstimado", "CostoReal"];
    const rows = orders.map((o) => [
      o.code,
      o.title,
      o.client?.name ?? "",
      o.status,
      o.priority,
      o.progress,
      o.dueDate ? o.dueDate.toISOString().slice(0, 10) : "",
      o.estimatedCost ?? "",
      o.actualCost ?? "",
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-operacional-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold text-white">Reportes</h1>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div>
          <label className="mb-1 block text-xs text-steel">Desde</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-steel">Hasta</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button variant="secondary" onClick={() => {
          const params = new URLSearchParams(searchParams.toString());
          if (from) params.set("from", from); else params.delete("from");
          if (to) params.set("to", to); else params.delete("to");
          router.push(`/reportes?${params.toString()}`);
        }}>Actualizar</Button>
        <Button onClick={exportCsv} className="gap-2"><Download className="h-4 w-4" /> Exportar CSV</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4"><div className="text-xs uppercase text-steel">Total órdenes</div><div className="font-heading text-2xl font-bold text-white">{orders.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs uppercase text-steel">Atrasadas</div><div className="font-heading text-2xl font-bold text-fire-bright">{overdueOrders.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs uppercase text-steel">Avance promedio</div><div className="font-heading text-2xl font-bold text-white">{orders.length ? Math.round(orders.reduce((s, o) => s + o.progress, 0) / orders.length) : 0}%</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs uppercase text-steel">HSEQ abiertos/vencidos</div><div className="font-heading text-2xl font-bold text-gold">{openHseq.length}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Órdenes por estado</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <Badge key={status} variant="secondary">{status}: {count}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Indicadores por cliente</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy-light text-left text-xs uppercase text-steel"><tr><th className="px-4 py-2">Cliente</th><th className="px-4 py-2">Órdenes</th></tr></thead>
              <tbody className="divide-y divide-border-subtle">
                {clients.map((c) => <tr key={c.id} className="hover:bg-navy-light/20"><td className="px-4 py-2 text-white">{c.name}</td><td className="px-4 py-2 text-steel">{c._count.workOrders}</td></tr>)}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Órdenes atrasadas</CardTitle></CardHeader>
        <CardContent>
          {overdueOrders.length === 0 ? <p className="text-sm text-steel">No hay órdenes atrasadas.</p> : (
            <ul className="space-y-2">
              {overdueOrders.map((o) => <li key={o.id} className="text-sm text-steel">{o.code} · {o.title} · {o.dueDate?.toLocaleDateString("es-CL")}</li>)}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
