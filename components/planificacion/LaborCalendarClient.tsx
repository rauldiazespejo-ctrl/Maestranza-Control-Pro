"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, parseISO, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, ChevronLeft, ChevronRight, Clock3, Plus, Trash2, Users } from "lucide-react";
import { deleteLaborEntry, getLaborCalendar, upsertLaborEntry } from "@/lib/actions/labor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type CalendarData = Awaited<ReturnType<typeof getLaborCalendar>>;
type Assignment = CalendarData["assignments"][number];
type Entry = CalendarData["entries"][number];

const OT_COLORS = ["#E8B33A", "#3B82F6", "#22C55E", "#A855F7", "#F97316", "#06B6D4", "#EC4899"];
const dateKey = (value: Date | string) => new Date(value).toISOString().slice(0, 10);

export function LaborCalendarClient({ month, assignments, entries }: { month: string; assignments: Assignment[]; entries: Entry[] }) {
  const router = useRouter();
  const monthDate = parseISO(`${month}-01`);
  const days = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) });
  const [open, setOpen] = React.useState(false);
  const [selectedEntryId, setSelectedEntryId] = React.useState<string | null>(null);
  const [workerFilter, setWorkerFilter] = React.useState("");
  const [orderFilter, setOrderFilter] = React.useState("");
  const [selectedAssignment, setSelectedAssignment] = React.useState(assignments[0]?.id ?? "");
  const [selectedDate, setSelectedDate] = React.useState(`${month}-01`);
  const [plannedHours, setPlannedHours] = React.useState("8");
  const [actualHours, setActualHours] = React.useState("0");
  const [shift, setShift] = React.useState<"dia" | "noche" | "extra">("dia");
  const [taskId, setTaskId] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const workers = React.useMemo(() => Array.from(new Map(assignments.map((item) => [item.worker.id, item.worker])).values()), [assignments]);
  const orders = React.useMemo(() => Array.from(new Map(assignments.map((item) => [item.workOrder.id, item.workOrder])).values()), [assignments]);
  const currentAssignment = assignments.find((item) => item.id === selectedAssignment);
  const visibleWorkers = workers.filter((worker) => !workerFilter || worker.id === workerFilter);
  const orderColor = React.useMemo(() => new Map(orders.map((order, index) => [order.id, OT_COLORS[index % OT_COLORS.length]])), [orders]);
  const entriesByCell = React.useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const entry of entries) {
      const key = `${entry.workerId}:${dateKey(entry.workDate)}`;
      map.set(key, [...(map.get(key) ?? []), entry]);
    }
    return map;
  }, [entries]);
  const totalPlanned = entries.reduce((sum, entry) => sum + entry.plannedHours, 0);
  const overloads = Array.from(entriesByCell.values()).filter((items) => items.reduce((sum, item) => sum + item.plannedHours, 0) > 10).length;

  const openCell = (workerId: string, day: Date, existing?: Entry) => {
    const assignment = assignments.find((item) => item.workerId === workerId);
    if (!assignment) return;
    setSelectedEntryId(existing?.id ?? null);
    setSelectedAssignment(existing?.assignmentId ?? assignment.id);
    setSelectedDate(dateKey(day));
    setPlannedHours(String(existing?.plannedHours ?? 8));
    setActualHours(String(existing?.actualHours ?? 0));
    setShift((existing?.shift as typeof shift) ?? "dia");
    setTaskId(existing?.taskId ?? "");
    setNotes(existing?.notes ?? "");
    setError(null);
    setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null);
    try {
      await upsertLaborEntry({ id: selectedEntryId ?? undefined, assignmentId: selectedAssignment, workDate: selectedDate, plannedHours, actualHours, shift, taskId, notes });
      setOpen(false); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo guardar"); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!selectedEntryId || !confirm("¿Eliminar este registro de HH?")) return;
    setSaving(true); setError(null);
    try { await deleteLaborEntry(selectedEntryId); setOpen(false); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo eliminar"); }
    finally { setSaving(false); }
  };

  return <div className="space-y-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-gold">Capacidad de maestranza</p><h1 className="font-heading text-2xl font-bold text-white">Planificación mensual de HH</h1><p className="mt-1 text-sm text-steel">Cada bloque muestra OT y horas planificadas por trabajador.</p></div>
      <div className="flex items-center rounded-lg border border-hairline bg-surface-2 p-1"><Button variant="ghost" size="icon" onClick={() => router.push(`/planificacion?month=${format(addMonths(monthDate, -1), "yyyy-MM")}`)}><ChevronLeft className="h-4 w-4" /></Button><div className="min-w-40 text-center text-sm font-semibold capitalize text-white">{format(monthDate, "MMMM yyyy", { locale: es })}</div><Button variant="ghost" size="icon" onClick={() => router.push(`/planificacion?month=${format(addMonths(monthDate, 1), "yyyy-MM")}`)}><ChevronRight className="h-4 w-4" /></Button></div>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <Card className="flex items-center gap-3 p-4"><Users className="h-5 w-5 text-gold" /><div><p className="text-xs text-steel">Dotación planificada</p><p className="text-xl font-bold text-white">{workers.length}</p></div></Card>
      <Card className="flex items-center gap-3 p-4"><Clock3 className="h-5 w-5 text-gold" /><div><p className="text-xs text-steel">HH planificadas</p><p className="text-xl font-bold text-white">{totalPlanned.toLocaleString("es-CL")}</p></div></Card>
      <Card className="flex items-center gap-3 p-4"><AlertTriangle className={`h-5 w-5 ${overloads ? "text-alert" : "text-success"}`} /><div><p className="text-xs text-steel">Días sobrecargados (&gt;10 HH)</p><p className="text-xl font-bold text-white">{overloads}</p></div></Card>
    </div>
    <div className="flex flex-wrap gap-3 rounded-lg border border-hairline bg-surface-1 p-3">
      <Select value={workerFilter} onChange={(event) => setWorkerFilter(event.target.value)} className="w-auto min-w-56"><option value="">Todos los trabajadores</option>{workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}</Select>
      <Select value={orderFilter} onChange={(event) => setOrderFilter(event.target.value)} className="w-auto min-w-48"><option value="">Todas las OT</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.code} · {order.title}</option>)}</Select>
      {(workerFilter || orderFilter) && <Button variant="ghost" onClick={() => { setWorkerFilter(""); setOrderFilter(""); }}>Limpiar filtros</Button>}
    </div>
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto"><div style={{ minWidth: `${260 + days.length * 58}px` }}>
        <div className="sticky top-0 z-20 flex border-b border-hairline bg-surface-1"><div className="sticky left-0 z-30 flex w-64 shrink-0 items-center border-r border-hairline bg-surface-1 px-4 text-xs font-semibold uppercase tracking-wider text-steel">Trabajador</div>{days.map((day) => <div key={day.toISOString()} className={`w-[58px] shrink-0 border-r border-hairline py-2 text-center ${getDay(day) === 0 || getDay(day) === 6 ? "bg-surface-3/50" : ""}`}><p className="text-[10px] uppercase text-ink-subtle">{format(day, "EEE", { locale: es })}</p><p className="text-sm font-semibold text-white">{format(day, "dd")}</p></div>)}</div>
        {visibleWorkers.map((worker) => <div key={worker.id} className="flex min-h-[66px] border-b border-hairline hover:bg-surface-2/30"><div className="sticky left-0 z-10 w-64 shrink-0 border-r border-hairline bg-surface-1/95 px-4 py-3"><p className="truncate text-sm font-semibold text-white">{worker.name}</p><p className="truncate text-xs text-ink-subtle">{worker.position}</p></div>{days.map((day) => { const cell = (entriesByCell.get(`${worker.id}:${dateKey(day)}`) ?? []).filter((entry) => !orderFilter || entry.workOrderId === orderFilter); const total = cell.reduce((sum, entry) => sum + entry.plannedHours, 0); return <div key={day.toISOString()} className={`group relative w-[58px] shrink-0 border-r border-hairline p-1 text-left transition-colors hover:bg-gold/10 ${getDay(day) === 0 || getDay(day) === 6 ? "bg-surface-3/30" : ""}`} title={cell.map((entry) => `${entry.workOrder.code}: ${entry.plannedHours} HH`).join("\n") || "Asignar HH"}>{cell.map((entry) => <button type="button" onClick={() => openCell(worker.id, day, entry)} key={entry.id} className="mb-1 block w-full rounded px-1 py-0.5 text-left text-[10px] font-bold text-canvas" style={{ backgroundColor: orderColor.get(entry.workOrderId) }}>{entry.workOrder.code.replace(/^OT-?/i, "")} · {entry.plannedHours}h</button>)}{cell.length === 0 && <button type="button" aria-label={`Asignar HH a ${worker.name} el ${format(day, "dd-MM-yyyy")}`} onClick={() => openCell(worker.id, day)} className="h-full w-full"><Plus className="mx-auto mt-4 h-4 w-4 text-ink-tertiary opacity-0 group-hover:opacity-100" /></button>}{total > 10 && <span className="absolute right-0 top-0 h-2 w-2 rounded-bl bg-alert" />}</div>; })}</div>)}
        {visibleWorkers.length === 0 && <div className="p-10 text-center text-sm text-steel">No hay trabajadores para los filtros seleccionados.</div>}
      </div></div>
      <div className="flex flex-wrap gap-3 border-t border-hairline bg-surface-1 px-4 py-3">{orders.filter((order) => !orderFilter || order.id === orderFilter).map((order) => <span key={order.id} className="flex items-center gap-1.5 text-xs text-steel"><i className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: orderColor.get(order.id) }} />{order.code}</span>)}</div>
    </Card>
    <Dialog open={open} onClose={() => setOpen(false)} title={selectedEntryId ? "Editar HH del día" : "Asignar HH del día"} className="max-w-lg"><form onSubmit={save} className="space-y-4">{error && <div className="rounded-md border border-alert/30 bg-alert/10 p-3 text-sm text-alert">{error}</div>}<div><label className="mb-1 block text-xs text-steel">Trabajador y OT</label><Select value={selectedAssignment} onChange={(event) => { setSelectedAssignment(event.target.value); setTaskId(""); }}>{assignments.filter((item) => item.workerId === currentAssignment?.workerId).map((item) => <option key={item.id} value={item.id}>{item.worker.name} · {item.workOrder.code}</option>)}</Select></div><div className="grid grid-cols-2 gap-3"><div><label className="mb-1 block text-xs text-steel">Fecha</label><Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></div><div><label className="mb-1 block text-xs text-steel">Turno</label><Select value={shift} onChange={(event) => setShift(event.target.value as typeof shift)}><option value="dia">Día</option><option value="noche">Noche</option><option value="extra">Extra</option></Select></div><div><label className="mb-1 block text-xs text-steel">HH planificadas</label><Input type="number" min="0" max="24" step="0.5" value={plannedHours} onChange={(event) => setPlannedHours(event.target.value)} /></div><div><label className="mb-1 block text-xs text-steel">HH reales</label><Input type="number" min="0" max="24" step="0.5" value={actualHours} onChange={(event) => setActualHours(event.target.value)} /></div></div><div><label className="mb-1 block text-xs text-steel">Tarea de la OT (opcional)</label><Select value={taskId} onChange={(event) => setTaskId(event.target.value)}><option value="">Sin tarea específica</option>{currentAssignment?.workOrder.tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</Select></div><div><label className="mb-1 block text-xs text-steel">Nota</label><Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ej.: fabricación de soportes" /></div><div className="flex justify-between gap-2">{selectedEntryId ? <Button type="button" variant="ghost" onClick={remove} disabled={saving}><Trash2 className="mr-2 h-4 w-4 text-alert" />Eliminar</Button> : <span />}<div className="flex gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button disabled={saving}>{saving ? "Guardando..." : "Guardar HH"}</Button></div></div></form></Dialog>
  </div>;
}
