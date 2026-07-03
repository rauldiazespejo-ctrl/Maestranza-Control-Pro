"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Trash2, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { deleteDocument } from "@/lib/actions/documents";
import type { Prisma } from "@prisma/client";

type DocumentWithRelations = Prisma.DocumentGetPayload<{
  include: {
    workOrder: { select: { id: true; code: true; title: true } };
    hseqRecord: { select: { id: true; type: true; description: true } };
  };
}>;

interface Props {
  documents: DocumentWithRelations[];
  workOrders: { id: string; code: string; title: string }[];
  hseqRecords: { id: string; type: string; description: string }[];
}

const hseqTypeLabels: Record<string, string> = {
  inspeccion: "Inspección",
  incidente: "Incidente",
  accion_correctiva: "Acción correctiva",
  capacitacion: "Capacitación",
  permiso_trabajo: "Permiso de trabajo",
  matriz_riesgo: "Matriz de riesgo",
};

export function DocumentosClient({ documents, workOrders, hseqRecords }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(searchParams.get("search") ?? "");
  const [type, setType] = React.useState(searchParams.get("type") ?? "");
  const [workOrderId, setWorkOrderId] = React.useState(searchParams.get("workOrderId") ?? "");
  const [hseqRecordId, setHseqRecordId] = React.useState(searchParams.get("hseqRecordId") ?? "");

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (type) params.set("type", type);
    if (workOrderId) params.set("workOrderId", workOrderId);
    if (hseqRecordId) params.set("hseqRecordId", hseqRecordId);
    router.push(`/documentos?${params.toString()}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este documento/evidencia?")) return;
    try {
      await deleteDocument(id);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al eliminar el documento");
    }
  };

  const documentTypes = React.useMemo(() => {
    const types = new Set<string>();
    documents.forEach((d) => { if (d.type) types.add(d.type); });
    return Array.from(types).sort();
  }, [documents]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl font-bold text-white">Documentos y evidencias</h1>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
              <Input
                placeholder="Buscar por nombre o URL..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") applyFilters(); }}
              />
            </div>
            <div className="grid flex-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-steel">Tipo</label>
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="">Todos los tipos</option>
                  {documentTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-steel">Orden de trabajo</label>
                <Select value={workOrderId} onChange={(e) => setWorkOrderId(e.target.value)}>
                  <option value="">Todas</option>
                  {workOrders.map((o) => (
                    <option key={o.id} value={o.id}>{o.code} — {o.title}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-steel">Registro HSEQ</label>
                <Select value={hseqRecordId} onChange={(e) => setHseqRecordId(e.target.value)}>
                  <option value="">Todos</option>
                  {hseqRecords.map((r) => (
                    <option key={r.id} value={r.id}>
                      {hseqTypeLabels[r.type] ?? r.type} — {r.description.slice(0, 40)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <Button onClick={applyFilters}>Filtrar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy-light text-left text-xs uppercase tracking-wide text-steel">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Asociado a</th>
                  <th className="px-4 py-3">Visibilidad</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8">
                      <EmptyState title="No hay documentos registrados" />
                    </td>
                  </tr>
                )}
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-navy-light/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-steel" />
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-white hover:text-fire"
                        >
                          {doc.name}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {doc.type ? <Badge variant="secondary">{doc.type}</Badge> : <span className="text-steel">—</span>}
                    </td>
                    <td className="px-4 py-3 text-steel">
                      {doc.workOrder ? (
                        <span>{doc.workOrder.code} — {doc.workOrder.title}</span>
                      ) : doc.hseqRecord ? (
                        <span>{hseqTypeLabels[doc.hseqRecord.type] ?? doc.hseqRecord.type} — {doc.hseqRecord.description.slice(0, 40)}</span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={doc.public ? "success" : "outline"}>
                        {doc.public ? "Público" : "Privado"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-steel">
                      {doc.createdAt.toLocaleDateString("es-CL")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(doc.url, "_blank", "noopener,noreferrer")}
                          aria-label="Abrir documento"
                        >
                          <ExternalLink className="h-4 w-4 text-steel" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(doc.id)}
                          aria-label={`Eliminar documento ${doc.name}`}
                        >
                          <Trash2 className="h-4 w-4 text-fire-bright" />
                        </Button>
                      </div>
                    </td>
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
