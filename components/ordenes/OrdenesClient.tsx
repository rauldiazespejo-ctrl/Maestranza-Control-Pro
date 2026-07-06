"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Pencil, Trash2, Eye, X, Calendar, User, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { workOrderSchema, type WorkOrderFormData } from "@/lib/validations/workorder";
import { createWorkOrder, updateWorkOrder, deleteWorkOrder } from "@/lib/actions/workorders";
import type { Prisma } from "@prisma/client";
import { cn } from "@/lib/utils";

type WorkOrderWithRelations = Prisma.WorkOrderGetPayload<{
  include: { client: true; responsible: true; project: true };
}>;

const statusBadgeMap: Record<string, "fire" | "gold" | "secondary" | "destructive"> = {
  nueva: "fire",
  planificada: "gold",
  en_proceso: "fire",
  detenida: "destructive",
  revision: "gold",
  completada: "secondary",
  cerrada: "secondary",
};

interface Props {
  orders: WorkOrderWithRelations[];
  clients: { id: string; name: string }[];
  workers: { id: string; name: string; position?: string; profile?: string }[];
  projects: { id: string; name: string }[];
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

const priorityLabels: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  critica: "Crítica",
};

export function OrdenesClient({ orders, clients, workers, projects }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<WorkOrderWithRelations | null>(null);
  const [search, setSearch] = React.useState(searchParams.get("search") ?? "");
  const supervisors = React.useMemo(
    () => workers.filter((worker) => worker.profile === "supervisor"),
    [workers]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: { status: "nueva", priority: "media", progress: "0", code: "", title: "", description: "", responsibleId: "", clientId: "", projectId: "", estimatedCost: "", actualCost: "" },
  });

  React.useEffect(() => {
    if (editing) {
      reset({
        code: editing.code,
        title: editing.title,
        description: editing.description ?? "",
        status: editing.status,
        priority: editing.priority,
        startDate: editing.startDate ? editing.startDate.toISOString().slice(0, 10) : "",
        dueDate: editing.dueDate ? editing.dueDate.toISOString().slice(0, 10) : "",
        progress: String(editing.progress),
        responsibleId: editing.responsibleId ?? "",
        clientId: editing.clientId ?? "",
        projectId: editing.projectId ?? "",
        estimatedCost: editing.estimatedCost?.toString() ?? "",
        actualCost: editing.actualCost?.toString() ?? "",
      });
    } else {
      reset({
        code: "", title: "", description: "", status: "nueva", priority: "media",
        startDate: "", dueDate: "", progress: "0", responsibleId: "", clientId: "",
        projectId: "", estimatedCost: "", actualCost: "",
      });
    }
  }, [editing, reset]);

  const onSubmit = async (data: WorkOrderFormData) => {
    if (editing) {
      await updateWorkOrder(editing.id, data);
    } else {
      const order = await createWorkOrder(data);
      setIsOpen(false);
      setEditing(null);
      router.push(`/ordenes/${order.id}`);
      return;
    }
    setIsOpen(false);
    setEditing(null);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta orden de trabajo?")) return;
    await deleteWorkOrder(id);
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set("search", search);
    else params.delete("search");
    router.push(`/ordenes?${params.toString()}`);
  };

  const activeFilters: { key: string; label: string }[] = [];
  if (searchParams.get("status")) activeFilters.push({ key: "status", label: `Estado: ${statusLabels[searchParams.get("status")!] ?? searchParams.get("status")}` });
  if (searchParams.get("priority")) activeFilters.push({ key: "priority", label: `Prioridad: ${priorityLabels[searchParams.get("priority")!] ?? searchParams.get("priority")}` });
  if (searchParams.get("search")) activeFilters.push({ key: "search", label: `Búsqueda: ${searchParams.get("search")}` });

  const clearFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    if (key === "search") setSearch("");
    router.push(`/ordenes?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl font-bold text-white">Órdenes de trabajo</h1>
        <Button onClick={() => { setEditing(null); setIsOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva orden
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <Input placeholder="Buscar por código o título..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button type="submit" variant="secondary">Buscar</Button>
      </form>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-steel">Filtros activos:</span>
          {activeFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => clearFilter(f.key)}
              className="inline-flex items-center gap-1 rounded-full border border-border-strong bg-navy-light px-2.5 py-1 text-xs text-white transition-colors hover:border-fire hover:text-fire-bright"
            >
              {f.label}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              title="Sin órdenes de trabajo"
              description="No hay órdenes que coincidan con los filtros aplicados."
              icon={<ClipboardList className="h-10 w-10 text-steel/60" />}
            />
            <div className="mt-4 flex justify-center">
              <Button onClick={() => { setEditing(null); setIsOpen(true); }} className="gap-2">
                <Plus className="h-4 w-4" /> Nueva orden
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onView={() => router.push(`/ordenes/${order.id}`)}
              onEdit={() => { setEditing(order); setIsOpen(true); }}
              onDelete={() => handleDelete(order.id)}
            />
          ))}
        </div>
      )}

      <Dialog open={isOpen} onClose={() => { setIsOpen(false); setEditing(null); }} title={editing ? "Editar orden" : "Nueva orden de trabajo"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block">Código</Label>
              <Input {...register("code")} placeholder="OT-2026-001" />
              {errors.code && <p className="mt-1 text-xs text-fire-bright">{errors.code.message}</p>}
            </div>
            <div>
              <Label className="mb-2 block">Título</Label>
              <Input {...register("title")} placeholder="Título de la orden" />
              {errors.title && <p className="mt-1 text-xs text-fire-bright">{errors.title.message}</p>}
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Descripción</Label>
            <Textarea {...register("description")} rows={3} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block">Estado</Label>
              <Select {...register("status")}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
            </div>
            <div>
              <Label className="mb-2 block">Prioridad</Label>
              <Select {...register("priority")}>{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block">Cliente</Label>
              <Select {...register("clientId")}><option value="">Sin cliente</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
            </div>
            <div>
              <Label className="mb-2 block">Proyecto</Label>
              <Select {...register("projectId")}><option value="">Sin proyecto</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block">Supervisor OT</Label>
              <Select {...register("responsibleId")}>
                <option value="">Asignar despues</option>
                {supervisors.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}{w.position ? ` · ${w.position}` : ""}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-steel/75">
                Al crear la OT se abrira su ficha para asignar cuadrilla y horas.
              </p>
            </div>
            <div>
              <Label className="mb-2 block">Avance (%)</Label>
              <Input type="number" {...register("progress")} min={0} max={100} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label className="mb-2 block">Inicio</Label><Input type="date" {...register("startDate")} /></div>
            <div><Label className="mb-2 block">Compromiso</Label><Input type="date" {...register("dueDate")} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label className="mb-2 block">Costo estimado</Label><Input type="number" step="0.01" {...register("estimatedCost")} /></div>
            <div><Label className="mb-2 block">Costo real</Label><Input type="number" step="0.01" {...register("actualCost")} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => { setIsOpen(false); setEditing(null); }}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : editing ? "Guardar cambios" : "Crear orden"}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const variants: Record<string, "destructive" | "gold" | "secondary"> = {
    critica: "destructive",
    alta: "gold",
    media: "gold",
    baja: "secondary",
  };
  const labels: Record<string, string> = {
    critica: "Crítica",
    alta: "Alta",
    media: "Media",
    baja: "Baja",
  };
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        variants[priority] === "destructive"
          ? "border-fire-bright/40 bg-fire-bright text-white shadow-[0_0_8px_rgba(217,41,48,0.3)]"
          : variants[priority] === "gold"
          ? "border-gold/45 bg-gold text-navy-dark"
          : "border-steel/40 bg-steel/20 text-steel"
      )}
    >
      {labels[priority] ?? priority}
    </span>
  );
}

function OrderCard({
  order,
  onView,
  onEdit,
  onDelete,
}: {
  order: WorkOrderWithRelations;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  const openOrderFromKeyboard = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onView();
  };

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark",
        hovered && "border-gold/30 shadow-[var(--shadow-industrial-lg)]"
      )}
      role="button"
      tabIndex={0}
      aria-label={`Ver orden ${order.code}: ${order.title}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={openOrderFromKeyboard}
      onClick={onView}
      style={{ transform: hovered ? "translateY(-2px)" : "translateY(0)" }}
    >
      <CardContent className="p-4">
        {/* Header row */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs font-semibold text-gold">{order.code}</p>
            <h3 className="mt-1 truncate font-heading text-base font-semibold text-white">{order.title}</h3>
          </div>
          <div className="flex flex-shrink-0 flex-col items-end gap-1">
            <Badge variant={statusBadgeMap[order.status] ?? "secondary"}>{statusLabels[order.status]}</Badge>
            <PriorityBadge priority={order.priority} />
          </div>
        </div>

        {/* Description */}
        {order.description && (
          <p className="mb-3 line-clamp-2 text-xs text-steel">{order.description}</p>
        )}

        {/* Meta info */}
        <div className="mb-3 flex flex-wrap gap-3 text-xs text-steel">
          {order.client && (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              {order.client.name}
            </span>
          )}
          {order.responsible && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3 text-steel/60" />
              {order.responsible.name}
            </span>
          )}
          {order.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-steel/60" />
              {new Date(order.dueDate).toLocaleDateString("es-CL")}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-steel">Avance</span>
            <span className="text-xs font-semibold text-white">{order.progress}%</span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-navy-light">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-fire to-fire-bright transition-all duration-500"
              style={{ width: `${order.progress}%` }}
            />
          </div>
        </div>

        {/* Action buttons (stop propagation to prevent card click) */}
        <div className="flex items-center justify-end gap-1 border-t border-border-subtle pt-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={(e) => { e.stopPropagation(); onView(); }}
          >
            <Eye className="h-3.5 w-3.5" /> Ver
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
          >
            <Pencil className="h-3.5 w-3.5" /> Editar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 className="h-3.5 w-3.5 text-fire-bright" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
