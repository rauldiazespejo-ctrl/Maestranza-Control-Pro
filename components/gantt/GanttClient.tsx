"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Pencil,
  Trash2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  TrendingUp,
  ArrowRight,
  Factory,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ganttTaskSchema, type GanttTaskFormData } from "@/lib/validations/gantt";
import {
  createGanttTask,
  updateGanttTask,
  deleteGanttTask,
  createFabricationGanttFromWorkOrder,
} from "@/lib/actions/gantt";
import { fabricationProcessGroups } from "@/lib/fabrication-processes";
import {
  format,
  differenceInDays,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  startOfWeek,
  isToday,
} from "date-fns";
import type { Prisma } from "@prisma/client";

type GanttTaskWithRelations = Prisma.GanttTaskGetPayload<{
  include: { project: { include: { client: true } }; workOrder: true };
}>;

interface Props {
  tasks: GanttTaskWithRelations[];
  projects: { id: string; name: string }[];
  workOrders: { id: string; code: string; title: string }[];
}

const statusLabels: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completada: "Completada",
  retrasada: "Retrasada",
};

type ZoomLevel = "day" | "week" | "month";

// Derive visual priority from status
function getBarGradient(status: string): string {
  switch (status) {
    case "retrasada":
      return "linear-gradient(90deg, #950A10, #D92930)";
    case "en_progreso":
      return "linear-gradient(90deg, #E8B33A, #F0C860)";
    case "completada":
      return "linear-gradient(90deg, #16a34a, #4ade80)";
    default:
      return "linear-gradient(90deg, #C8D5DC, #e2e8ed)";
  }
}

function getBarOpacity(status: string): number {
  switch (status) {
    case "retrasada": return 0.95;
    case "en_progreso": return 0.90;
    case "completada": return 0.85;
    default: return 0.70;
  }
}

interface TooltipData {
  task: GanttTaskWithRelations;
  x: number;
  y: number;
}

function GanttTooltip({ data, containerW }: { data: TooltipData; containerW: number }) {
  if (!data) return null;
  const { task, x, y } = data;

  // Keep tooltip within bounds
  const style: React.CSSProperties = {
    position: "absolute",
    left: Math.min(x + 12, containerW - 280),
    top: y - 8,
    zIndex: 50,
    pointerEvents: "none",
  };

  return (
    <div
      style={style}
      className="w-64 rounded-lg border border-border-strong bg-navy-light/95 p-3 shadow-industrial-lg backdrop-blur-sm"
    >
      <p className="mb-1.5 font-heading text-sm font-semibold text-white">
        {task.name}
      </p>
      <div className="mb-2 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-steel">
          <Badge
            variant={
              task.status === "retrasada"
                ? "fire"
                : task.status === "en_progreso"
                ? "gold"
                : task.status === "completada"
                ? "success"
                : "outline"
            }
            className="text-[10px]"
          >
            {statusLabels[task.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-steel">
          <ArrowRight className="h-3 w-3 shrink-0 text-gold" />
          <span className="truncate">{task.project.name}</span>
        </div>
        {task.responsible && (
          <div className="flex items-center gap-1.5 text-xs text-steel">
            <User className="h-3 w-3 shrink-0 text-gold" />
            <span className="truncate">{task.responsible}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-steel">
          <Calendar className="h-3 w-3 shrink-0 text-gold" />
          <span>
            {format(task.startDate, "dd MMM")} → {format(task.endDate, "dd MMM yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-steel">
          <TrendingUp className="h-3 w-3 shrink-0 text-gold" />
          <span>Avance: {task.progress}%</span>
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-1.5 h-1.5 rounded-full bg-navy-dark">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${task.progress}%`,
            background: task.status === "completada"
              ? "linear-gradient(90deg, #16a34a, #4ade80)"
              : task.status === "retrasada"
              ? "linear-gradient(90deg, #950A10, #D92930)"
              : "linear-gradient(90deg, #E8B33A, #F0C860)",
          }}
        />
      </div>
    </div>
  );
}

export function GanttClient({ tasks, projects, workOrders }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<GanttTaskWithRelations | null>(null);
  const [filterProject, setFilterProject] = React.useState(searchParams.get("projectId") ?? "");
  const [zoom, setZoom] = React.useState<ZoomLevel>("week");
  const [viewStart, setViewStart] = React.useState(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 });
  });
  const [tooltip, setTooltip] = React.useState<TooltipData | null>(null);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = React.useState(workOrders[0]?.id ?? "");
  const [generating, setGenerating] = React.useState(false);
  const [generationMessage, setGenerationMessage] = React.useState<string | null>(null);
  const [generationError, setGenerationError] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(800);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0]?.contentRect.width ?? 800);
    });
    observer.observe(el);
    setContainerWidth(el.clientWidth || 800);
    return () => observer.disconnect();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GanttTaskFormData>({
    resolver: zodResolver(ganttTaskSchema),
    defaultValues: {
      name: "",
      projectId: projects[0]?.id ?? "",
      workOrderId: "",
      startDate: "",
      endDate: "",
      status: "pendiente",
      progress: "0",
      responsible: "",
      dependencies: "",
    },
  });

  React.useEffect(() => {
    if (editing) {
      reset({
        name: editing.name,
        projectId: editing.projectId,
        workOrderId: editing.workOrderId ?? "",
        startDate: editing.startDate.toISOString().slice(0, 10),
        endDate: editing.endDate.toISOString().slice(0, 10),
        progress: String(editing.progress),
        status: editing.status as GanttTaskFormData["status"],
        responsible: editing.responsible ?? "",
        dependencies: editing.dependencies ?? "",
      });
    } else {
      reset({
        name: "",
        projectId: projects[0]?.id ?? "",
        workOrderId: "",
        startDate: "",
        endDate: "",
        progress: "0",
        status: "pendiente",
        responsible: "",
        dependencies: "",
      });
    }
  }, [editing, reset, projects]);

  const onSubmit = async (data: GanttTaskFormData) => {
    if (editing) await updateGanttTask(editing.id, data);
    else await createGanttTask(data);
    setIsOpen(false);
    setEditing(null);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta tarea?")) return;
    await deleteGanttTask(id);
    router.refresh();
  };

  const handleGenerateFabricationGantt = async () => {
    if (!selectedWorkOrderId) return;
    setGenerating(true);
    setGenerationMessage(null);
    setGenerationError(null);
    try {
      const result = await createFabricationGanttFromWorkOrder(selectedWorkOrderId);
      const message =
        result.created > 0
          ? `Programa generado para OT ${result.workOrderCode}: ${result.created} tareas creadas.`
          : `La OT ${result.workOrderCode} ya tenia su programa de fabricacion generado.`;
      setGenerationMessage(result.skipped > 0 ? `${message} ${result.skipped} tareas existentes no se duplicaron.` : message);
      setFilterProject(result.projectId);
      router.push(`/gantt?projectId=${result.projectId}`);
      router.refresh();
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : "No se pudo generar la carta Gantt");
    } finally {
      setGenerating(false);
    }
  };

  const filteredTasks = filterProject ? tasks.filter((t) => t.projectId === filterProject) : tasks;

  // Determine date range for timeline
  const viewEnd = React.useMemo(() => {
    const span = zoom === "day" ? 28 : zoom === "week" ? 84 : 180;
    return addDays(viewStart, span);
  }, [viewStart, zoom]);

  const todayIndex = React.useMemo(
    () => differenceInDays(new Date(), viewStart),
    [viewStart]
  );

  const totalDays = differenceInDays(viewEnd, viewStart) || 1;

  // Build timeline columns based on zoom
  const timelineCols = React.useMemo(() => {
    if (zoom === "day") {
      return eachDayOfInterval({ start: viewStart, end: viewEnd }).map((d) => ({
        date: d,
        label: format(d, "dd"),
        sublabel: format(d, "EEE"),
        isToday: isToday(d),
        width: 32,
      }));
    } else if (zoom === "week") {
      return eachWeekOfInterval({ start: viewStart, end: viewEnd }, { weekStartsOn: 1 }).map((d) => ({
        date: d,
        label: format(d, "dd"),
        sublabel: format(d, "MMM"),
        isToday: isToday(d) || (d <= new Date() && addDays(d, 7) > new Date()),
        width: 100,
      }));
    } else {
      // month
      const months: { date: Date; label: string; sublabel: string; isToday: boolean; width: number }[] = [];
      let cur = startOfMonth(viewStart);
      while (cur <= viewEnd) {
        months.push({
          date: cur,
          label: format(cur, "MMM yyyy"),
          sublabel: "",
          isToday: isToday(cur),
          width: 140,
        });
        cur = addDays(endOfMonth(cur), 1);
      }
      return months;
    }
  }, [viewStart, viewEnd, zoom]);

  const rowHeight = 44;

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    task: GanttTaskWithRelations
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    setTooltip({
      task,
      x: rect.right - containerRect.left,
      y: rect.top - containerRect.top + rowHeight / 2,
    });
  };

  const handleMouseLeave = () => setTooltip(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl font-bold text-white">Carta Gantt</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setIsOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva tarea
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Project filter */}
        <Select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="w-auto min-w-[160px]"
        >
          <option value="">Todos los proyectos</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            if (filterProject) params.set("projectId", filterProject);
            else params.delete("projectId");
            router.push(`/gantt?${params.toString()}`);
          }}
        >
          Filtrar
        </Button>

        <div className="ml-auto flex items-center gap-1 rounded-md border border-border-subtle bg-surface-muted p-1">
          <button
            onClick={() => setZoom((z) => (z === "day" ? "day" : z === "week" ? "day" : "week"))}
            className="rounded p-1.5 text-steel transition-colors hover:bg-surface-hover hover:text-white disabled:opacity-30"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <div className="flex gap-0.5 px-1">
            {(["day", "week", "month"] as ZoomLevel[]).map((z) => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  zoom === z
                    ? "bg-gold/20 text-gold"
                    : "text-steel hover:bg-surface-hover hover:text-white"
                }`}
              >
                {z === "day" ? "Día" : z === "week" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setZoom((z) => (z === "month" ? "month" : z === "week" ? "month" : "week"))}
            className="rounded p-1.5 text-steel transition-colors hover:bg-surface-hover hover:text-white disabled:opacity-30"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              const shift = zoom === "day" ? -7 : zoom === "week" ? -28 : -60;
              setViewStart((d) => addDays(d, shift));
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => {
              const today = new Date();
              setViewStart(startOfWeek(today, { weekStartsOn: 1 }));
            }}
          >
            Hoy
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              const shift = zoom === "day" ? 7 : zoom === "week" ? 28 : 60;
              setViewStart((d) => addDays(d, shift));
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Factory className="h-5 w-5 text-gold" />
              <h2 className="font-heading text-lg font-semibold text-white">
                Programa de fabricacion desde OT
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(220px,360px)_1fr] sm:items-center">
              <Select value={selectedWorkOrderId} onChange={(event) => setSelectedWorkOrderId(event.target.value)}>
                <option value="">Seleccionar OT</option>
                {workOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.code} — {order.title}
                  </option>
                ))}
              </Select>
              <p className="text-sm text-steel">
                Genera una secuencia con {fabricationProcessGroups.join(", ")}.
              </p>
            </div>
            {generationMessage && (
              <div className="mt-3 rounded-md border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                {generationMessage}
              </div>
            )}
            {generationError && (
              <div className="mt-3 rounded-md border border-fire/30 bg-fire/10 px-3 py-2 text-sm text-fire-bright">
                {generationError}
              </div>
            )}
          </div>
          <Button
            type="button"
            onClick={handleGenerateFabricationGantt}
            disabled={!selectedWorkOrderId || generating}
            className="gap-2"
          >
            <Factory className="h-4 w-4" />
            {generating ? "Generando..." : "Generar procesos"}
          </Button>
        </div>
      </Card>

      {/* Gantt chart */}
      <Card className="overflow-hidden p-0">
        {filteredTasks.length === 0 ? (
          <div className="p-8">
            <EmptyState title="No hay tareas Gantt" />
          </div>
        ) : (
          <div ref={containerRef} className="relative overflow-hidden">
            <div
              ref={scrollRef}
              className="overflow-x-auto"
              style={{ maxHeight: "calc(100vh - 320px)" }}
            >
              <div style={{ minWidth: `${timelineCols.reduce((s, c) => s + c.width, 0) + 220}px` }}>
                {/* Sticky row label column + timeline header */}
                <div className="sticky left-0 z-20 flex bg-navy-primary">
                  {/* Task name column header */}
                  <div
                    className="sticky left-0 z-30 flex h-10 w-48 shrink-0 items-center border-b border-r border-border-subtle bg-navy-primary px-4 text-xs font-semibold uppercase tracking-wider text-steel"
                  >
                    Tarea
                  </div>
                  {/* Timeline header */}
                  <div className="flex flex-1 border-b border-border-subtle">
                    {timelineCols.map((col, i) => (
                      <div
                        key={i}
                        className={`flex flex-col items-center justify-center border-r border-border-subtle ${
                          col.isToday ? "bg-gold/8" : ""
                        }`}
                        style={{ width: col.width, minWidth: col.width }}
                      >
                        {col.sublabel && (
                          <span className="text-[10px] text-steel/60">{col.sublabel}</span>
                        )}
                        <span
                          className={`text-xs font-medium ${
                            col.isToday ? "text-gold" : "text-steel"
                          }`}
                        >
                          {col.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rows */}
                <div className="relative">
                  {/* Today line */}
                  {todayIndex >= 0 && todayIndex <= totalDays && (
                    <div
                      className="pointer-events-none absolute top-0 z-10 border-l-2 border-dashed border-gold"
                      style={{
                        left: 192 + (todayIndex / totalDays) * (timelineCols.reduce((s, c) => s + c.width, 0)),
                        height: "100%",
                      }}
                      title={`Hoy: ${format(new Date(), "dd MMM yyyy")}`}
                    />
                  )}

                  {filteredTasks.map((task) => {
                    const offset = differenceInDays(task.startDate, viewStart);
                    const duration = Math.max(
                      differenceInDays(task.endDate, task.startDate) + 1,
                      1
                    );
                    const taskStartPct = (offset / totalDays) * 100;
                    const taskWidthPct = (duration / totalDays) * 100;

                    return (
                      <div
                        key={task.id}
                        className="relative flex h-11 border-b border-border-subtle/50 hover:bg-navy-light/20"
                        onMouseMove={(e) => handleMouseMove(e, task)}
                        onMouseLeave={handleMouseLeave}
                      >
                        {/* Task label */}
                        <div className="sticky left-0 z-10 flex h-full w-48 shrink-0 items-center gap-2 border-r border-border-subtle bg-navy-primary/90 px-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-white">{task.name}</p>
                            <p className="truncate text-[10px] text-steel">
                              {task.project.name}
                            </p>
                          </div>
                          <button
                            className="shrink-0 rounded p-0.5 text-steel/50 opacity-0 transition-opacity hover:bg-surface-hover hover:text-white group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditing(task);
                              setIsOpen(true);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Timeline bar area */}
                        <div className="relative flex-1">
                          {/* Grid lines */}
                          {timelineCols.map((_, i) => (
                            <div
                              key={i}
                              className="absolute top-0 h-full border-r border-border-subtle/30"
                              style={{ left: `${(i / timelineCols.length) * 100}%` }}
                            />
                          ))}

                          {/* Task bar */}
                          {taskStartPct >= -100 && taskStartPct <= 100 && (
                            <div
                              className="absolute top-1/2 -translate-y-1/2 cursor-pointer rounded-md transition-all duration-150 hover:brightness-110 hover:shadow-md"
                              style={{
                                left: `${Math.max(0, taskStartPct)}%`,
                                width: `${Math.min(100 - Math.max(0, taskStartPct), taskWidthPct)}%`,
                                minWidth: "8px",
                              }}
                              onClick={() => {
                                setEditing(task);
                                setIsOpen(true);
                              }}
                            >
                              {/* Progress fill */}
                              <div
                                className="h-full rounded-md"
                                style={{
                                  background: getBarGradient(task.status),
                                  opacity: getBarOpacity(task.status),
                                }}
                              >
                                {/* Progress overlay */}
                                <div
                                  className="h-full rounded-md"
                                  style={{
                                    width: `${task.progress}%`,
                                    background:
                                      "linear-gradient(90deg, rgba(255,255,255,0.25), rgba(255,255,255,0.05))",
                                  }}
                                />
                              </div>
                              {/* Progress text inside bar */}
                              {taskWidthPct > 8 && (
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                  <span className="truncate px-1.5 text-[10px] font-semibold text-white/90">
                                    {task.progress}%
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tooltip */}
                {tooltip && (
                  <GanttTooltip data={tooltip} containerW={containerWidth} />
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 border-t border-border-subtle bg-navy-primary/80 px-4 py-2.5 text-xs text-steel">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-6 rounded-sm" style={{ background: "linear-gradient(90deg, #950A10, #D92930)" }} />
                <span>Retrasada</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-6 rounded-sm" style={{ background: "linear-gradient(90deg, #E8B33A, #F0C860)" }} />
                <span>En progreso</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-6 rounded-sm" style={{ background: "linear-gradient(90deg, #C8D5DC, #e2e8ed)" }} />
                <span>Pendiente</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-6 rounded-sm" style={{ background: "linear-gradient(90deg, #16a34a, #4ade80)" }} />
                <span>Completada</span>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="h-4 w-0 border-l-2 border-dashed border-gold" />
                <span>Hoy</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Task detail / edit dialog */}
      <Dialog
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
          setEditing(null);
        }}
        title={editing ? "Editar tarea" : "Nueva tarea Gantt"}
        className="max-w-lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label className="mb-2 block">Nombre</Label>
            <Input {...register("name")} />
            {errors.name && (
              <p className="mt-1 text-xs text-fire-bright">{errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block">
                Proyecto
              </Label>
              <Select {...register("projectId")}>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">
                Orden de trabajo
              </Label>
              <Select {...register("workOrderId")}>
                <option value="">Ninguna</option>
                {workOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.code} — {o.title}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block">
                Inicio
              </Label>
              <Input type="date" {...register("startDate")} />
            </div>
            <div>
              <Label className="mb-2 block">
                Término
              </Label>
              <Input type="date" {...register("endDate")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block">
                Estado
              </Label>
              <Select {...register("status")}>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">
                Avance (%)
              </Label>
              <Input
                type="number"
                {...register("progress")}
                min={0}
                max={100}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block">
                Responsable
              </Label>
              <Input {...register("responsible")} />
            </div>
            <div>
              <Label className="mb-2 block">
                Dependencias
              </Label>
              <Input
                {...register("dependencies")}
                placeholder="IDs separados por coma"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {editing && (
              <Button
                type="button"
                variant="ghost"
                className="text-fire-bright hover:bg-fire/10"
                onClick={() => {
                  if (confirm("¿Eliminar esta tarea?")) {
                    handleDelete(editing.id);
                    setIsOpen(false);
                    setEditing(null);
                  }
                }}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Eliminar
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsOpen(false);
                  setEditing(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Guardando..."
                  : editing
                  ? "Guardar cambios"
                  : "Crear tarea"}
              </Button>
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
