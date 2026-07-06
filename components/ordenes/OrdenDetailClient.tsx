"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Trash2, User, Save, Calendar, Clock, ShieldCheck, Factory } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  workerAssignmentSchema,
  type WorkerAssignmentFormData,
} from "@/lib/validations/worker-assignment";
import {
  assignWorkerToOrder,
  removeWorkerAssignment,
  updateAssignmentHours,
} from "@/lib/actions/worker-assignments";
import { assignSupervisorToWorkOrder } from "@/lib/actions/workorders";
import { createFabricationGanttFromWorkOrder } from "@/lib/actions/gantt";
import { WorkOrderTasksSection } from "@/components/ordenes/WorkOrderTasksSection";

type WorkOrderDetail = Prisma.WorkOrderGetPayload<{
  include: {
    client: true;
    responsible: true;
    project: true;
    tasks: {
      include: {
        asts: { select: { id: true; status: true; riskLevel: true; approvedAt: true } };
        permits: { select: { id: true; type: true; status: true; startAt: true; endAt: true } };
      };
    };
    assignments: { include: { worker: true } };
    documents: true;
  };
}>;

type ActiveWorker = {
  id: string;
  name: string;
  position: string;
  specialty: string | null;
  profile: string;
  engagement: string;
};

interface Props {
  order: WorkOrderDetail;
  activeWorkers: ActiveWorker[];
}

const statusLabels: Record<string, string> = {
  nueva: "Nueva",
  planificada: "Planificada",
  en_proceso: "En proceso",
  detenida: "Detenida",
  revision: "En revisión",
  completada: "Completada",
  cerrada: "Cerrada",
};

const statusBadgeMap: Record<string, "fire" | "gold" | "secondary" | "destructive"> = {
  nueva: "fire",
  planificada: "gold",
  en_proceso: "fire",
  detenida: "destructive",
  revision: "gold",
  completada: "secondary",
  cerrada: "secondary",
};

const priorityLabels: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  critica: "Crítica",
};

function formatDate(date: Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-CL");
}

function formatCurrency(value: Prisma.Decimal | number | null | undefined) {
  if (value === null || value === undefined) return "—";
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "object" && "toNumber" in value
        ? value.toNumber()
        : Number(value);
  if (!Number.isFinite(numericValue)) return "—";
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(numericValue);
}

export function OrdenDetailClient({ order, activeWorkers }: Props) {
  const router = useRouter();
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [supervisorId, setSupervisorId] = React.useState(order.responsibleId ?? "");
  const [savingSupervisor, setSavingSupervisor] = React.useState(false);
  const [generatingGantt, setGeneratingGantt] = React.useState(false);

  const supervisors = React.useMemo(
    () => activeWorkers.filter((worker) => worker.profile === "supervisor"),
    [activeWorkers]
  );
  const assignedWorkerIds = React.useMemo(
    () => new Set(order.assignments.map((assignment) => assignment.workerId)),
    [order.assignments]
  );
  const assignableWorkers = React.useMemo(
    () => activeWorkers.filter((worker) => !assignedWorkerIds.has(worker.id)),
    [activeWorkers, assignedWorkerIds]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkerAssignmentFormData>({
    resolver: zodResolver(workerAssignmentSchema),
    defaultValues: {
      workOrderId: order.id,
      workerId: "",
      startDate: "",
      endDate: "",
      hours: "",
    },
  });

  const onAssign = async (data: WorkerAssignmentFormData) => {
    setSubmitting(true);
    setGlobalError(null);
    setGlobalSuccess(null);
    try {
      await assignWorkerToOrder({
        ...data,
        workOrderId: order.id,
      });
      reset({ workOrderId: order.id, workerId: "", startDate: "", endDate: "", hours: "" });
      router.refresh();
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Error al asignar trabajador");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (assignmentId: string) => {
    if (!confirm("¿Eliminar esta asignación?")) return;
    try {
      await removeWorkerAssignment(assignmentId, order.id);
      router.refresh();
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Error al eliminar asignación");
    }
  };

  const handleSupervisorSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingSupervisor(true);
    setGlobalError(null);
    setGlobalSuccess(null);
    try {
      await assignSupervisorToWorkOrder(order.id, supervisorId);
      router.refresh();
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Error al asignar supervisor");
    } finally {
      setSavingSupervisor(false);
    }
  };

  const handleGenerateGantt = async () => {
    setGeneratingGantt(true);
    setGlobalError(null);
    setGlobalSuccess(null);
    try {
      const result = await createFabricationGanttFromWorkOrder(order.id);
      const message =
        result.created > 0
          ? `Carta Gantt generada: ${result.created} procesos creados para la OT ${result.workOrderCode}.`
          : `La OT ${result.workOrderCode} ya tenia carta Gantt de fabricacion.`;
      setGlobalSuccess(result.skipped > 0 ? `${message} ${result.skipped} procesos existentes no se duplicaron.` : message);
      router.refresh();
      router.push(`/gantt?projectId=${result.projectId}`);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Error al generar carta Gantt");
    } finally {
      setGeneratingGantt(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/ordenes")}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Volver
        </Button>
        <h1 className="font-heading text-2xl font-bold text-white">Detalle de la orden</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-white">
                {order.code} · {order.title}
              </CardTitle>
              <p className="text-sm text-muted">{order.description || "Sin descripción"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={handleGenerateGantt} disabled={generatingGantt} className="gap-2">
                <Factory className="h-4 w-4" />
                {generatingGantt ? "Generando..." : "Generar carta Gantt"}
              </Button>
              <Badge variant={statusBadgeMap[order.status] ?? "secondary"}>{statusLabels[order.status]}</Badge>
              <Badge variant={order.priority === "critica" ? "destructive" : order.priority === "alta" ? "gold" : order.priority === "media" ? "gold" : "secondary"}>
                {priorityLabels[order.priority]}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-navy-primary/50 p-3">
              <p className="text-xs text-steel">Cliente</p>
              <p className="font-medium text-white">{order.client?.name ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-navy-primary/50 p-3">
              <p className="text-xs text-steel">Proyecto</p>
              <p className="font-medium text-white">{order.project?.name ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-navy-primary/50 p-3">
              <p className="text-xs text-steel">Responsable</p>
              <p className="font-medium text-white">{order.responsible?.name ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-navy-primary/50 p-3">
              <p className="text-xs text-steel">Avance</p>
              <div className="flex items-center gap-2">
                <div className="relative h-2 w-20 overflow-hidden rounded-full bg-navy-light">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-fire to-fire-bright transition-all duration-500"
                    style={{ width: `${order.progress}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-white">{order.progress}%</span>
              </div>
            </div>
            <div className="rounded-lg bg-navy-primary/50 p-3">
              <p className="text-xs text-steel">Inicio</p>
              <p className="font-medium text-white">{formatDate(order.startDate)}</p>
            </div>
            <div className="rounded-lg bg-navy-primary/50 p-3">
              <p className="text-xs text-steel">Compromiso</p>
              <p className="font-medium text-white">{formatDate(order.dueDate)}</p>
            </div>
            <div className="rounded-lg bg-navy-primary/50 p-3">
              <p className="text-xs text-steel">Costo estimado</p>
              <p className="font-medium text-white">{formatCurrency(order.estimatedCost)}</p>
            </div>
            <div className="rounded-lg bg-navy-primary/50 p-3">
              <p className="text-xs text-steel">Costo real</p>
              <p className="font-medium text-white">{formatCurrency(order.actualCost)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="h-5 w-5 text-gold" /> Dotación asignada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {globalError && (
            <div className="rounded-lg border border-fire/30 bg-fire/10 p-3 text-sm text-fire-bright">
              {globalError}
            </div>
          )}
          {globalSuccess && (
            <div className="rounded-lg border border-blue-400/25 bg-blue-500/10 p-3 text-sm text-blue-100">
              {globalSuccess}
            </div>
          )}

          <form
            onSubmit={handleSupervisorSave}
            className="rounded-lg border border-blue-400/20 bg-blue-500/10 p-4"
          >
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <label className="mb-1 flex items-center gap-2 text-xs font-medium text-steel">
                  <ShieldCheck className="h-4 w-4 text-blue-300" />
                  Supervisor responsable de la OT
                </label>
                <Select value={supervisorId} onChange={(event) => setSupervisorId(event.target.value)}>
                  <option value="">Sin supervisor asignado</option>
                  {supervisors.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name} · {worker.position}
                    </option>
                  ))}
                </Select>
                <p className="mt-1 text-xs text-steel/75">
                  Solo aparecen trabajadores activos marcados como supervisores.
                </p>
              </div>
              <Button type="submit" disabled={savingSupervisor} className="gap-2">
                <Save className="h-4 w-4" />
                {savingSupervisor ? "Guardando..." : "Guardar supervisor"}
              </Button>
            </div>
          </form>

          <form onSubmit={handleSubmit(onAssign)} className="rounded-lg border border-border-subtle bg-navy-primary/30 p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-steel">Trabajador activo</label>
                <Select {...register("workerId")}>
                  <option value="">Seleccionar trabajador</option>
                  {assignableWorkers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} · {w.position}
                      {w.profile === "supervisor" ? " · Supervisor" : ""}
                      {w.engagement === "spot" ? " · Spot" : ""}
                    </option>
                  ))}
                </Select>
                {errors.workerId && <p className="mt-1 text-xs text-fire-bright">{errors.workerId.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-steel">Inicio</label>
                <Input type="date" {...register("startDate")} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-steel">Término</label>
                <Input type="date" {...register("endDate")} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-steel">Horas</label>
                <Input type="number" step="0.5" min={0} {...register("hours")} placeholder="0" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button type="submit" disabled={submitting} className="gap-2">
                <Plus className="h-4 w-4" /> {submitting ? "Asignando..." : "Asignar trabajador"}
              </Button>
            </div>
          </form>

          {order.assignments.length === 0 ? (
            <EmptyState
              title="Sin dotación asignada"
              description="Aún no hay trabajadores asignados a esta orden."
              icon={<User className="h-10 w-10 text-steel/60" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-navy-light text-left text-xs uppercase tracking-wide text-steel">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Trabajador</th>
                    <th className="px-4 py-3 font-semibold">Cargo</th>
                    <th className="px-4 py-3 font-semibold">Perfil</th>
                    <th className="px-4 py-3 font-semibold">Inicio</th>
                    <th className="px-4 py-3 font-semibold">Término</th>
                    <th className="px-4 py-3 font-semibold">Horas</th>
                    <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {order.assignments.map((assignment) => (
                    <AssignmentRow
                      key={assignment.id}
                      assignment={assignment}
                      onRemove={() => handleRemove(assignment.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <WorkOrderTasksSection workOrderId={order.id} tasks={order.tasks} />
    </div>
  );
}

function AssignmentRow({
  assignment,
  onRemove,
}: {
  assignment: Prisma.WorkerAssignmentGetPayload<{ include: { worker: true } }>;
  onRemove: () => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [rowError, setRowError] = React.useState<string | null>(null);

  const startDateStr = assignment.startDate ? assignment.startDate.toISOString().slice(0, 10) : "";
  const endDateStr = assignment.endDate ? assignment.endDate.toISOString().slice(0, 10) : "";
  const hoursStr = assignment.hours !== null && assignment.hours !== undefined ? String(assignment.hours) : "";

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSaving(true);
    setRowError(null);
    try {
      await updateAssignmentHours(assignment.id, {
        hours: formData.get("hours") as string,
        startDate: formData.get("startDate") as string,
        endDate: formData.get("endDate") as string,
      });
      setEditing(false);
      router.refresh();
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <tr>
        <td className="px-4 py-3 text-white">{assignment.worker.name}</td>
        <td className="px-4 py-3 text-steel">{assignment.worker.position}</td>
        <td className="px-4 py-3 text-steel">
          {assignment.worker.profile === "supervisor" ? "Supervisor" : "Empleado"}
          {assignment.worker.engagement === "spot" ? " / Spot" : ""}
        </td>
        <td className="px-4 py-3" colSpan={3}>
          <form id={`edit-form-${assignment.id}`} onSubmit={handleSave} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-steel">Inicio</label>
              <Input type="date" name="startDate" defaultValue={startDateStr} className="h-8 px-2 text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-steel">Término</label>
              <Input type="date" name="endDate" defaultValue={endDateStr} className="h-8 px-2 text-xs" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-steel">Horas</label>
              <Input type="number" step="0.5" min={0} name="hours" defaultValue={hoursStr} className="w-28" />
            </div>
            {rowError && <p className="w-full text-xs text-fire-bright">{rowError}</p>}
          </form>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex justify-end gap-2">
            <Button type="submit" form={`edit-form-${assignment.id}`} size="sm" disabled={saving} className="gap-1">
              <Save className="h-4 w-4" /> {saving ? "Guardando..." : "Guardar"}
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-navy-light/30">
      <td className="px-4 py-3 font-medium text-white">{assignment.worker.name}</td>
      <td className="px-4 py-3 text-steel">{assignment.worker.position}</td>
      <td className="px-4 py-3 text-steel">
        {assignment.worker.profile === "supervisor" ? "Supervisor" : "Empleado"}
        {assignment.worker.engagement === "spot" ? " / Spot" : ""}
      </td>
      <td className="px-4 py-3 text-steel">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-steel/70" /> {formatDate(assignment.startDate)}
        </span>
      </td>
      <td className="px-4 py-3 text-steel">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-steel/70" /> {formatDate(assignment.endDate)}
        </span>
      </td>
      <td className="px-4 py-3 text-steel">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-steel/70" /> {assignment.hours ?? "—"}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Editar
          </Button>
          <Button variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-fire-bright" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
