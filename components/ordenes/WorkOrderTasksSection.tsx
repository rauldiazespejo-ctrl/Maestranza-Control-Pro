"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  CheckSquare,
  Square,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/badge";
import {
  workOrderTaskSchema,
  type WorkOrderTaskFormData,
} from "@/lib/validations/workorder-task";
import {
  createWorkOrderTask,
  updateWorkOrderTask,
  deleteWorkOrderTask,
  toggleWorkOrderTask,
} from "@/lib/actions/workorder-tasks";
import type { Prisma } from "@prisma/client";

interface Props {
  workOrderId: string;
  tasks: Prisma.WorkOrderTaskGetPayload<{
    include: {
      asts: { select: { id: true; status: true; riskLevel: true; approvedAt: true } };
      permits: { select: { id: true; type: true; status: true; startAt: true; endAt: true } };
    };
  }>[];
}

type TaskWithSafety = Props["tasks"][number];

function formatDate(date?: Date | null) {
  if (!date) return "—";
  return date.toLocaleDateString("es-CL");
}

export function WorkOrderTasksSection({ workOrderId, tasks }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TaskWithSafety | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WorkOrderTaskFormData>({
    resolver: zodResolver(workOrderTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      processArea: "",
      critical: false,
      requiresPermit: false,
      progress: "0",
      completed: false,
      dueDate: "",
    },
  });

  const completed = useWatch({ control, name: "completed" });
  const critical = useWatch({ control, name: "critical" });

  React.useEffect(() => {
    if (editing) {
      reset({
        title: editing.title,
        description: editing.description ?? "",
        processArea: editing.processArea ?? "",
        critical: editing.critical,
        requiresPermit: editing.requiresPermit,
        progress: String(editing.progress),
        completed: editing.completed,
        dueDate: editing.dueDate
          ? editing.dueDate.toISOString().slice(0, 10)
          : "",
      });
    } else {
      reset({
        title: "",
        description: "",
        processArea: "",
        critical: false,
        requiresPermit: false,
        progress: "0",
        completed: false,
        dueDate: "",
      });
    }
  }, [editing, reset]);

  React.useEffect(() => {
    if (completed) setValue("progress", "100");
  }, [completed, setValue]);

  React.useEffect(() => {
    if (!critical) setValue("requiresPermit", false);
  }, [critical, setValue]);

  const onSubmit = async (data: WorkOrderTaskFormData) => {
    setError(null);
    try {
      if (editing) {
        await updateWorkOrderTask(editing.id, data);
      } else {
        await createWorkOrderTask(workOrderId, data);
      }
      setIsOpen(false);
      setEditing(null);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar la tarea"
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta tarea?")) return;
    try {
      await deleteWorkOrderTask(id);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar la tarea"
      );
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleWorkOrderTask(id);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar la tarea"
      );
    }
  };

  const openNew = () => {
    setEditing(null);
    setError(null);
    setIsOpen(true);
  };

  const openEdit = (task: TaskWithSafety) => {
    setEditing(task);
    setError(null);
    setIsOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-white">
          <ClipboardList className="h-5 w-5 text-gold" />
          Tareas
        </CardTitle>
        <Button size="sm" onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Agregar tarea
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy-light text-left text-xs uppercase tracking-wide text-steel">
              <tr>
                <th className="px-4 py-3">Completado</th>
                <th className="px-4 py-3">Tarea</th>
                <th className="px-4 py-3">Avance</th>
                <th className="px-4 py-3">Compromiso</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8">
                    <EmptyState
                      title="Sin tareas"
                      description="Aún no se han registrado tareas para esta orden."
                    />
                  </td>
                </tr>
              )}
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className={`hover:bg-navy-light/30 ${
                    task.completed ? "opacity-70" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggle(task.id)}
                      className="text-steel transition-colors hover:text-gold"
                      aria-label={
                        task.completed
                          ? "Marcar como pendiente"
                          : "Marcar como completada"
                      }
                    >
                      {task.completed ? (
                        <CheckSquare className="h-5 w-5 text-steel" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">
                      {task.completed ? <s>{task.title}</s> : task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-steel">{task.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {task.processArea && <Badge variant="outline">{task.processArea}</Badge>}
                      {task.critical && <Badge variant="destructive">Crítica</Badge>}
                      {task.critical && (
                        <Badge
                          variant={task.asts.some((ast) => ast.status === "aprobado") ? "success" : "gold"}
                        >
                          AST {task.asts.some((ast) => ast.status === "aprobado") ? "aprobado" : "pendiente"}
                        </Badge>
                      )}
                      {task.requiresPermit && (
                        <Badge
                          variant={
                            task.permits.some((permit) => {
                              const now = Date.now();
                              return (
                                (permit.status === "activo" || permit.status === "aprobado") &&
                                new Date(permit.startAt).getTime() <= now &&
                                new Date(permit.endAt).getTime() >= now
                              );
                            })
                              ? "success"
                              : "gold"
                          }
                        >
                          PTW {task.permits.length > 0 ? "registrado" : "pendiente"}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-navy-light">
                        <div
                          className="h-full bg-fire"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-steel">
                        {Math.round(task.progress)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-steel">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(task.dueDate)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(task)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(task.id)}
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

      <Dialog
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
          setEditing(null);
          setError(null);
        }}
        title={editing ? "Editar tarea" : "Nueva tarea"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-fire/30 bg-fire/10 p-3 text-sm text-fire-bright">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-steel">
              Título
            </label>
            <Input {...register("title")} placeholder="Nombre de la tarea" />
            {errors.title && (
              <p className="mt-1 text-xs text-fire-bright">
                {errors.title.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-steel">
              Descripción
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full rounded-md border border-border-subtle bg-navy-dark px-3 py-2 text-sm text-white placeholder-steel/50 focus:border-fire focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-steel">
              Proceso / área
            </label>
            <Input {...register("processArea")} placeholder="Ej.: Puente grúa / Soldadura / CNC" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-lg border border-border-subtle bg-navy-primary/30 p-3 text-sm text-steel">
              <input
                type="checkbox"
                {...register("critical")}
                className="h-4 w-4 accent-gold"
              />
              Tarea crítica HSEQ
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-border-subtle bg-navy-primary/30 p-3 text-sm text-steel">
              <input
                type="checkbox"
                {...register("requiresPermit")}
                disabled={!critical}
                className="h-4 w-4 accent-gold disabled:opacity-40"
              />
              Requiere PTW vigente
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-steel">
                Avance (%)
              </label>
              <Input
                type="number"
                {...register("progress")}
                min={0}
                max={100}
                disabled={completed}
              />
              {errors.progress && (
                <p className="mt-1 text-xs text-fire-bright">
                  {errors.progress.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-steel">
                Fecha compromiso
              </label>
              <Input type="date" {...register("dueDate")} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-steel">
            <input
              type="checkbox"
              {...register("completed")}
              className="h-4 w-4 accent-gold"
            />
            Marcar como completada
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsOpen(false);
                setEditing(null);
                setError(null);
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
        </form>
      </Dialog>
    </Card>
  );
}
