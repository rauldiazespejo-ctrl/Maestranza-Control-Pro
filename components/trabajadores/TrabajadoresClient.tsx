"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Search,
  Trash2,
  Mail,
  Phone,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { SlideOver } from "@/components/ui/slide-over";
import { EmptyState } from "@/components/ui/EmptyState";
import { workerSchema, type WorkerFormData } from "@/lib/validations/worker";
import { createWorker, updateWorker, deleteWorker } from "@/lib/actions/workers";
import { format, differenceInDays } from "date-fns";
import type { Prisma } from "@prisma/client";
import { es } from "date-fns/locale";

type WorkerWithRelations = Prisma.WorkerGetPayload<{
  include: {
    assignments: { include: { workOrder: true } };
    ledOrders: true;
  };
}>;

interface Props {
  workers: WorkerWithRelations[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function CertificationStatus({
  expires,
  name,
}: {
  expires: string | Date | null;
  name: string;
}) {
  if (!expires) return null;
  const expiryDate = new Date(expires);
  const now = new Date();
  const daysLeft = differenceInDays(expiryDate, now);
  const isExpired = daysLeft < 0;
  const isSoon = daysLeft >= 0 && daysLeft <= 30;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-xs",
        isExpired
          ? "border-fire/40 bg-fire/10"
          : isSoon
          ? "border-gold/40 bg-gold/10"
          : "border-border-subtle bg-surface-muted"
      )}
    >
      {isExpired ? (
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-fire-bright" />
      ) : isSoon ? (
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-gold" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
      )}
      <div className="min-w-0 flex-1">
        <span className="truncate font-medium text-white">{name}</span>
        <span className="ml-1.5 text-steel">
          · {format(expiryDate, "dd MMM yyyy", { locale: es })}
        </span>
      </div>
      <span
        className={cn(
          "shrink-0 font-medium",
          isExpired
            ? "text-fire-bright"
            : isSoon
            ? "text-gold"
            : "text-emerald-400"
        )}
      >
        {isExpired ? `Vencido` : isSoon ? `${daysLeft}d` : `OK`}
      </span>
    </div>
  );
}

function WorkerCard({
  worker,
  onClick,
}: {
  worker: WorkerWithRelations;
  onClick: () => void;
}) {
  const initials = getInitials(worker.name);
  const isActive = worker.status === "activo";

  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-lg border border-border-subtle bg-surface-glass p-5 shadow-industrial transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(232,179,58,0.30)] hover:shadow-industrial-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      {/* Avatar */}
      <div className="mb-4 flex items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-bold text-white shadow-md"
          style={{
            background: "linear-gradient(135deg, #950A10, #D92930)",
          }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-heading text-base font-semibold text-white">
            {worker.name}
          </h3>
          <p className="truncate text-sm text-steel">{worker.position}</p>
          <p className="mt-0.5 font-mono text-xs text-steel/70">{worker.rut}</p>
        </div>
        <Badge
          variant={isActive ? "default" : "secondary"}
          className="shrink-0"
        >
          {isActive ? "Activo" : "Inactivo"}
        </Badge>
      </div>

      {/* Meta */}
      <div className="space-y-2">
        {worker.specialty && (
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 shrink-0 text-gold" />
            <span className="truncate text-xs text-steel">{worker.specialty}</span>
          </div>
        )}
        {worker.certifications && (
          <p
            className="line-clamp-2 text-xs leading-relaxed text-steel/80"
            title={worker.certifications}
          >
            {worker.certifications}
          </p>
        )}
        {worker.criticalExpires && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 shrink-0 text-gold" />
            <span className="text-xs text-steel">
              Venc. crítico:{" "}
              <span className="font-medium text-white">
                {format(new Date(worker.criticalExpires), "dd MMM yyyy", { locale: es })}
              </span>
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

function WorkerDetailPanel({
  worker,
  open,
  onClose,
}: {
  worker: WorkerWithRelations | null;
  open: boolean;
  onClose: () => void;
}) {
  const initials = worker ? getInitials(worker.name) : "";
  const isActive = worker?.status === "activo";

  const now = new Date();
  const activeAssignments = worker?.assignments.filter(
    (a) => !a.endDate || new Date(a.endDate) >= now
  ) ?? [];
  const pastAssignments = worker?.assignments.filter(
    (a) => a.endDate && new Date(a.endDate) < now
  ) ?? [];

  // Build certification list from the certifications string
  const certificationLines = (worker?.certifications ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={worker?.name ?? "Trabajador"}
      description={`Perfil de ${worker?.position ?? ""}`}
    >
      {!worker ? null : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white shadow-md"
              style={{
                background: "linear-gradient(135deg, #950A10, #D92930)",
              }}
            >
              {initials}
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-white">
                {worker.name}
              </h3>
              <p className="text-sm text-steel">{worker.position}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge variant={isActive ? "default" : "secondary"}>
                  {isActive ? "Activo" : "Inactivo"}
                </Badge>
                <span className="font-mono text-xs text-steel">{worker.rut}</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          {(worker.phone || worker.email) && (
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel">
                Contacto
              </h4>
              <div className="space-y-2">
                {worker.phone && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-gold" />
                    <span className="text-white">{worker.phone}</span>
                  </div>
                )}
                {worker.email && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-gold" />
                    <span className="text-white">{worker.email}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Info grid */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel">
              Datos
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {worker.specialty && (
                <div className="rounded-md border border-border-subtle bg-surface-muted p-3">
                  <p className="text-xs text-steel">Especialidad</p>
                  <p className="mt-0.5 font-medium text-white">{worker.specialty}</p>
                </div>
              )}
              {worker.criticalExpires && (
                <div className="rounded-md border border-border-subtle bg-surface-muted p-3">
                  <p className="text-xs text-steel">Venc. crítico</p>
                  <p className="mt-0.5 font-medium text-white">
                    {format(new Date(worker.criticalExpires), "dd MMM yyyy", { locale: es })}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Certifications */}
          {certificationLines.length > 0 && (
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel">
                Certificaciones
              </h4>
              <div className="space-y-1.5">
                {certificationLines.map((cert, i) => (
                  <CertificationStatus
                    key={i}
                    name={cert}
                    expires={worker.criticalExpires}
                  />
                ))}
                {worker.criticalExpires && (
                  <p className="pt-1 text-xs text-steel/70">
                    Fecha de vencimiento de certificaciones:{" "}
                    <span className="text-steel">
                      {format(new Date(worker.criticalExpires), "dd MMMM yyyy", { locale: es })}
                    </span>
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Assignment history */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel">
              Asignaciones activas ({activeAssignments.length})
            </h4>
            {activeAssignments.length === 0 ? (
              <p className="text-sm text-steel/60">Sin asignaciones activas</p>
            ) : (
              <div className="space-y-2">
                {activeAssignments.slice(0, 8).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-md border border-border-subtle bg-surface-muted px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {a.workOrder.code} — {a.workOrder.title}
                      </p>
                      <p className="text-xs text-steel">
                        {a.startDate
                          ? `Desde ${format(new Date(a.startDate), "dd MMM yyyy", { locale: es })}`
                          : "Fecha no asignada"}
                      </p>
                    </div>
                    <Badge variant="success" className="ml-2 shrink-0">
                      Activa
                    </Badge>
                  </div>
                ))}
                {activeAssignments.length > 8 && (
                  <p className="text-xs text-steel/60">
                    +{activeAssignments.length - 8} más
                  </p>
                )}
              </div>
            )}
          </section>

          {pastAssignments.length > 0 && (
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-steel">
                Historial ({pastAssignments.length})
              </h4>
              <div className="space-y-2">
                {pastAssignments.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-md border border-border-subtle/50 bg-surface-muted/50 px-3 py-2 opacity-70"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-steel">
                        {a.workOrder.code} — {a.workOrder.title}
                      </p>
                      <p className="text-xs text-steel/60">
                        {a.endDate
                          ? `Hasta ${format(new Date(a.endDate), "dd MMM yyyy", { locale: es })}`
                          : "—"}
                      </p>
                    </div>
                  </div>
                ))}
                {pastAssignments.length > 5 && (
                  <p className="text-xs text-steel/60">
                    +{pastAssignments.length - 5} más
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </SlideOver>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function TrabajadoresClient({ workers }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<WorkerWithRelations | null>(null);
  const [detailWorker, setDetailWorker] = React.useState<WorkerWithRelations | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [search, setSearch] = React.useState(searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = React.useState(searchParams.get("status") ?? "");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkerFormData>({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      status: "activo",
      name: "",
      rut: "",
      position: "",
      specialty: "",
      certifications: "",
      criticalExpires: "",
      phone: "",
      email: "",
    },
  });

  React.useEffect(() => {
    if (editing) {
      reset({
        name: editing.name,
        rut: editing.rut,
        position: editing.position,
        specialty: editing.specialty ?? "",
        status: editing.status as "activo" | "inactivo",
        certifications: editing.certifications ?? "",
        criticalExpires: editing.criticalExpires
          ? editing.criticalExpires.toISOString().slice(0, 10)
          : "",
        phone: editing.phone ?? "",
        email: editing.email ?? "",
      });
    } else {
      reset({
        name: "",
        rut: "",
        position: "",
        specialty: "",
        status: "activo",
        certifications: "",
        criticalExpires: "",
        phone: "",
        email: "",
      });
    }
  }, [editing, reset]);

  const onSubmit = async (data: WorkerFormData) => {
    if (editing) await updateWorker(editing.id, data);
    else await createWorker(data);
    setIsFormOpen(false);
    setEditing(null);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este trabajador?")) return;
    await deleteWorker(id);
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set("search", search);
    else params.delete("search");
    if (statusFilter) params.set("status", statusFilter);
    else params.delete("status");
    router.push(`/trabajadores?${params.toString()}`);
  };

  const openDetail = (worker: WorkerWithRelations) => {
    setDetailWorker(worker);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl font-bold text-white">Trabajadores</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setIsFormOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo trabajador
        </Button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <Input
            placeholder="Buscar por nombre, RUT o especialidad..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-auto min-w-[130px]"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </Select>
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      {/* Card grid */}
      {workers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <EmptyState
              title="Sin trabajadores"
              description="Agrega tu primer trabajador para comenzar."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workers.map((worker) => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              onClick={() => openDetail(worker)}
            />
          ))}
        </div>
      )}

      {/* Worker detail panel */}
      <WorkerDetailPanel
        worker={detailWorker}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />

      {/* Edit/Create dialog */}
      <Dialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditing(null);
        }}
        title={editing ? "Editar trabajador" : "Nuevo trabajador"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-steel">
                Nombre
              </label>
              <Input {...register("name")} />
              {errors.name && (
                <p className="mt-1 text-xs text-fire-bright">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-steel">
                RUT
              </label>
              <Input {...register("rut")} />
              {errors.rut && (
                <p className="mt-1 text-xs text-fire-bright">
                  {errors.rut.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-steel">
                Cargo
              </label>
              <Input {...register("position")} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-steel">
                Especialidad
              </label>
              <Input {...register("specialty")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-steel">
                Estado
              </label>
              <Select {...register("status")}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-steel">
                Vencimiento crítico
              </label>
              <Input type="date" {...register("criticalExpires")} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-steel">
              Certificaciones
            </label>
            <Input {...register("certifications")} placeholder="Separadas por coma" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-steel">
                Teléfono
              </label>
              <Input {...register("phone")} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-steel">
                Email
              </label>
              <Input type="email" {...register("email")} />
            </div>
          </div>

          {/* Detail panel action when editing */}
          {editing && (
            <div className="rounded-md border border-border-subtle bg-surface-muted p-3">
              <p className="text-xs text-steel">
                ¿Necesitas ver el historial completo o las certificaciones?{" "}
                <button
                  type="button"
                  className="ml-1 font-medium text-gold underline underline-offset-2"
                  onClick={() => {
                    setIsFormOpen(false);
                    setDetailWorker(editing);
                    setDetailOpen(true);
                  }}
                >
                  Abrir perfil completo
                </button>
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {editing && (
              <Button
                type="button"
                variant="ghost"
                className="text-fire-bright hover:bg-fire/10"
                onClick={() => {
                  if (confirm("¿Eliminar este trabajador?")) {
                    handleDelete(editing.id);
                    setIsFormOpen(false);
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
                  setIsFormOpen(false);
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
                  : "Crear trabajador"}
              </Button>
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
