"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, AlertTriangle, Shield, ShieldCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { hseqRecordSchema, type HseqRecordFormData } from "@/lib/validations/hseq";
import { createHseqRecord, updateHseqRecord, deleteHseqRecord } from "@/lib/actions/hseq";
import type { Prisma } from "@prisma/client";
import { cn } from "@/lib/utils";

type HseqRecordWithRelations = Prisma.HseqRecordGetPayload<{
  include: { responsible: true };
}>;

interface Props {
  records: HseqRecordWithRelations[];
  workers: { id: string; name: string }[];
}

const typeLabels: Record<string, string> = {
  inspeccion: "Inspección",
  incidente: "Incidente",
  accion_correctiva: "Acción correctiva",
  capacitacion: "Capacitación",
  permiso_trabajo: "Permiso de trabajo",
  matriz_riesgo: "Matriz de riesgo",
};

const normLabels: Record<string, string> = {
  ISO_45001: "ISO 45001",
  ISO_9001: "ISO 9001",
  ISO_14001: "ISO 14001",
  DS_44: "D.S. 44",
};

const statusLabels: Record<string, string> = {
  abierto: "Abierto",
  en_revision: "En revisión",
  cerrado: "Cerrado",
  vencido: "Vencido",
};

const statusBadgeVariant: Record<string, "hseq-abierto" | "hseq-en-revision" | "hseq-cerrado" | "hseq-vencido"> = {
  abierto: "hseq-abierto",
  en_revision: "hseq-en-revision",
  cerrado: "hseq-cerrado",
  vencido: "hseq-vencido",
};

const normBadgeVariant: Record<string, "gold" | "fire" | "secondary"> = {
  ISO_45001: "gold",
  ISO_9001: "fire",
  ISO_14001: "fire",
  DS_44: "secondary",
};

function getDaysOverdue(dueDate: Date | null): number | null {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

function RecordCard({
  record,
  onEdit,
  onDelete,
}: {
  record: HseqRecordWithRelations;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isVencido = record.status === "vencido";
  const daysOverdue = record.status === "vencido" ? getDaysOverdue(record.dueDate) : null;

  return (
    <div
      className={cn(
        "group relative rounded-lg border p-4 transition-[background-color,border-color,box-shadow,transform] duration-200",
        isVencido
          ? "hseq-alert-vencido border-fire/40 bg-fire/10"
          : "border-border-subtle bg-navy-primary/40 hover:-translate-y-0.5 hover:border-gold/25 hover:bg-navy-primary/60 hover:shadow-industrial-sm"
      )}
    >
      {/* Top row: type + norm + status */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 font-heading text-xs font-semibold text-white">
          {record.type === "inspeccion" && <Search className="h-3.5 w-3.5 text-gold" />}
          {record.type === "incidente" && <AlertTriangle className="h-3.5 w-3.5 text-fire-bright" />}
          {record.type === "accion_correctiva" && <Shield className="h-3.5 w-3.5 text-gold" />}
          {record.type === "capacitacion" && <ShieldCheck className="h-3.5 w-3.5 text-gold" />}
          {record.type === "matriz_riesgo" && <Shield className="h-3.5 w-3.5 text-fire-bright" />}
          {typeLabels[record.type]}
        </span>
        <Badge variant={normBadgeVariant[record.norm] ?? "secondary"}>{normLabels[record.norm]}</Badge>
        <Badge variant={statusBadgeVariant[record.status] ?? "secondary"}>{statusLabels[record.status]}</Badge>
        {isVencido && daysOverdue !== null && (
          <span className="ml-auto text-xs font-semibold text-fire-bright">
            Venció hace {daysOverdue} día{daysOverdue !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-white/90">{record.description}</p>

      {/* Meta row */}
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-steel">
        {record.responsible && (
          <span>
            <span className="font-medium text-white/80">{record.responsible.name}</span>
          </span>
        )}
        {record.dueDate && (
          <span>
            Vence: {new Date(record.dueDate).toLocaleDateString("es-CL")}
          </span>
        )}
        {record.signatureRequired && (
          <span className="flex items-center gap-1 text-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Requiere firma
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 border-t border-border-subtle pt-3">
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
          <Pencil className="h-3.5 w-3.5" /> Editar
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          <Trash2 className="h-3.5 w-3.5 text-fire-bright" />
        </Button>
      </div>
    </div>
  );
}

export function HseqClient({ records, workers }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<HseqRecordWithRelations | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HseqRecordFormData>({
    resolver: zodResolver(hseqRecordSchema),
    defaultValues: { type: "inspeccion", norm: "ISO_45001", description: "", responsibleId: "", date: new Date().toISOString().slice(0, 10), dueDate: "", status: "abierto", evidenceDocumental: "", signatureRequired: false },
  });

  React.useEffect(() => {
    if (editing) {
      reset({
        type: editing.type,
        norm: editing.norm,
        description: editing.description,
        responsibleId: editing.responsibleId ?? "",
        date: editing.date.toISOString().slice(0, 10),
        dueDate: editing.dueDate ? editing.dueDate.toISOString().slice(0, 10) : "",
        status: editing.status,
        evidenceDocumental: editing.evidenceDocumental ?? "",
        signatureRequired: editing.signatureRequired,
      });
    } else {
      reset({ type: "inspeccion", norm: "ISO_45001", description: "", responsibleId: "", date: new Date().toISOString().slice(0, 10), dueDate: "", status: "abierto", evidenceDocumental: "", signatureRequired: false });
    }
  }, [editing, reset]);

  const onSubmit = async (data: HseqRecordFormData) => {
    if (editing) await updateHseqRecord(editing.id, data);
    else await createHseqRecord(data);
    setIsOpen(false);
    setEditing(null);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este registro HSEQ?")) return;
    await deleteHseqRecord(id);
    router.refresh();
  };

  // Group records by status for prioritized display
  const vencidos = records.filter((r) => r.status === "vencido");
  const abiertos = records.filter((r) => r.status === "abierto");
  const enRevision = records.filter((r) => r.status === "en_revision");
  const cerrados = records.filter((r) => r.status === "cerrado");

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Registros HSEQ</h1>
          <p className="mt-1 text-sm text-steel">{records.length} registro{records.length !== 1 ? "s" : ""} en total</p>
        </div>
        <Button onClick={() => { setEditing(null); setIsOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo registro
        </Button>
      </div>

      {records.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              title="Sin registros HSEQ"
              description="No hay registros HSEQ registrados. Crea tu primer registro para comenzar."
              icon={<Shield className="h-10 w-10 text-steel/60" />}
            />
            <div className="mt-4 flex justify-center">
              <Button onClick={() => { setEditing(null); setIsOpen(true); }} className="gap-2">
                <Plus className="h-4 w-4" /> Nuevo registro
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* VENCIDOS — Critical Alert Section */}
          {vencidos.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-fire-bright" />
                <h2 className="font-heading text-lg font-bold text-fire-bright">VENCIDOS — ALERTA CRÍTICA</h2>
                <span className="rounded-full bg-fire-bright/20 px-2.5 py-0.5 text-xs font-bold text-fire-bright border border-fire-bright/40">
                  {vencidos.length}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {vencidos.map((r) => (
                  <RecordCard
                    key={r.id}
                    record={r}
                    onEdit={() => { setEditing(r); setIsOpen(true); }}
                    onDelete={() => handleDelete(r.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ABIERTOS */}
          {abiertos.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-fire" />
                <h2 className="font-heading text-base font-semibold text-white">Abiertos</h2>
                <span className="rounded-full bg-fire/20 px-2 py-0.5 text-xs font-semibold text-fire-bright border border-fire/30">
                  {abiertos.length}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {abiertos.map((r) => (
                  <RecordCard
                    key={r.id}
                    record={r}
                    onEdit={() => { setEditing(r); setIsOpen(true); }}
                    onDelete={() => handleDelete(r.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* EN REVISIÓN */}
          {enRevision.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gold" />
                <h2 className="font-heading text-base font-semibold text-white">En revisión</h2>
                <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold border border-gold/30">
                  {enRevision.length}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {enRevision.map((r) => (
                  <RecordCard
                    key={r.id}
                    record={r}
                    onEdit={() => { setEditing(r); setIsOpen(true); }}
                    onDelete={() => handleDelete(r.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* CERRADOS */}
          {cerrados.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-steel/50" />
                <h2 className="font-heading text-base font-semibold text-steel/80">Cerrados</h2>
                <span className="rounded-full bg-steel/10 px-2 py-0.5 text-xs font-semibold text-steel border border-steel/20">
                  {cerrados.length}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {cerrados.map((r) => (
                  <RecordCard
                    key={r.id}
                    record={r}
                    onEdit={() => { setEditing(r); setIsOpen(true); }}
                    onDelete={() => handleDelete(r.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isOpen} onClose={() => { setIsOpen(false); setEditing(null); }} title={editing ? "Editar registro HSEQ" : "Nuevo registro HSEQ"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block">Tipo</Label>
              <Select {...register("type")}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
            </div>
            <div>
              <Label className="mb-2 block">Norma</Label>
              <Select {...register("norm")}>{Object.entries(normLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Descripción</Label>
            <Textarea {...register("description")} rows={3} />
            {errors.description && <p className="mt-1 text-xs text-fire-bright">{errors.description.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block">Responsable</Label>
              <Select {...register("responsibleId")}><option value="">Sin responsable</option>{workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select>
            </div>
            <div>
              <Label className="mb-2 block">Estado</Label>
              <Select {...register("status")}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label className="mb-2 block">Fecha</Label><Input type="date" {...register("date")} /></div>
            <div><Label className="mb-2 block">Vencimiento</Label><Input type="date" {...register("dueDate")} /></div>
          </div>
          <div>
            <Label className="mb-2 block">Evidencia documental</Label>
            <Input {...register("evidenceDocumental")} placeholder="URL o referencia de documento" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register("signatureRequired")} id="signatureRequired" className="h-4 w-4 rounded border-border-subtle bg-navy-dark text-fire" />
            <Label htmlFor="signatureRequired">Firma requerida</Label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => { setIsOpen(false); setEditing(null); }}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : editing ? "Guardar cambios" : "Crear registro"}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
