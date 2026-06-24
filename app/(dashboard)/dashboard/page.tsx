import { redirect } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { KPIStrip } from "@/components/dashboard/KPIStrip";
import { MiniGantt } from "@/components/dashboard/MiniGantt";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  FileWarning,
  ShieldAlert,
} from "lucide-react";
import type { WorkOrderStatus, HseqStatus } from "@prisma/client";

const CLOSED_STATUSES: WorkOrderStatus[] = ["completada", "cerrada"];
const ACTIVE_STATUSES: WorkOrderStatus[] = [
  "nueva",
  "planificada",
  "en_proceso",
  "detenida",
  "revision",
];

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  nueva: "Nueva",
  planificada: "Planificada",
  en_proceso: "En proceso",
  detenida: "Detenida",
  revision: "Revisión",
  completada: "Completada",
  cerrada: "Cerrada",
};

const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  nueva: "#C8D5DC",
  planificada: "#1C244B",
  en_proceso: "#E8B33A",
  detenida: "#D92930",
  revision: "#16163F",
  completada: "#10b981",
  cerrada: "#0E0E2A",
};

const HSEQ_STATUS_LABELS: Record<HseqStatus, string> = {
  abierto: "Abierto",
  en_revision: "En revisión",
  cerrado: "Cerrado",
  vencido: "Vencido",
};

function workOrderStatusVariant(status: WorkOrderStatus) {
  switch (status) {
    case "completada":
      return "success";
    case "cerrada":
      return "secondary";
    case "en_proceso":
      return "gold";
    case "detenida":
      return "destructive";
    case "revision":
      return "outline";
    case "planificada":
      return "default";
    case "nueva":
    default:
      return "outline";
  }
}

function hseqStatusVariant(status: HseqStatus) {
  switch (status) {
    case "vencido":
      return "destructive";
    case "abierto":
      return "gold";
    case "en_revision":
      return "secondary";
    case "cerrado":
    default:
      return "success";
  }
}

/** Returns greeting based on time of day */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const now = new Date();
  const userName = session.user.name?.split(" ")[0] ?? "Usuario";

  const [
    activeOrdersCount,
    delayedOrdersCount,
    completedOrdersCount,
    avgProgressResult,
    // ── LEFT column: órdenes en proceso
    processOrders,
    // ── RIGHT column: próximos vencimientos HSEQ
    hseqVencimientos,
    // ── HSEQ alerts count
    hseqAlertsCount,
    // ── Bottom row: Gantt items (ordenes con fechas)
    ganttOrders,
    // ── Bottom row: Alerts summary
    hseqAlerts,
    // ── Bottom row: Recent activity
    recentActivity,
  ] = await Promise.all([
    // KPI counts
    prisma.workOrder.count({ where: { status: { in: ACTIVE_STATUSES } } }),
    prisma.workOrder.count({
      where: { status: { in: ACTIVE_STATUSES }, dueDate: { lt: now } },
    }),
    prisma.workOrder.count({ where: { status: "completada" } }),
    prisma.workOrder.aggregate({ _avg: { progress: true } }),
    // Orders in process (active + sorting by due date)
    prisma.workOrder.findMany({
      where: { status: { in: ACTIVE_STATUSES } },
      include: { client: true, project: true, responsible: true },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      take: 12,
    }),
    // HSEQ vencimientos (abiertos + vencidos)
    prisma.hseqRecord.findMany({
      where: {
        OR: [
          { status: { in: ["abierto", "vencido"] } },
          { dueDate: { lt: now } },
        ],
      },
      include: { responsible: true },
      orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
      take: 10,
    }),
    // Count of HSEQ alerts
    prisma.hseqRecord.count({
      where: { OR: [{ status: { in: ["abierto", "vencido"] } }, { dueDate: { lt: now } }] },
    }),
    // Gantt: orders with start/due dates
    prisma.workOrder.findMany({
      where: {
        status: { in: ACTIVE_STATUSES },
        OR: [{ startDate: { not: null } }, { dueDate: { not: null } }],
      },
      select: {
        id: true,
        code: true,
        title: true,
        startDate: true,
        dueDate: true,
        progress: true,
        status: true,
        priority: true,
      },
      orderBy: { dueDate: "asc" },
      take: 20,
    }),
    // Alerts for bottom panel
    prisma.hseqRecord.findMany({
      where: {
        OR: [
          { status: { in: ["abierto", "vencido"] } },
          { dueDate: { lt: now } },
        ],
      },
      include: { responsible: true },
      orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
      take: 5,
    }),
    // Recent activity
    prisma.workOrder.findMany({
      include: { client: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  const avgProgress = Math.round(avgProgressResult._avg.progress ?? 0);

  return (
    <div className="space-y-6">
      {/* ── SECTION 1: Hero Greeting ── */}
      <section className="dashboard-hero surface-glass overflow-hidden rounded-lg border-gold/20 p-5 shadow-industrial-lg sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            {/* Status badge */}
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold">
              <Activity className="h-3.5 w-3.5" />
              Centro de control operacional
            </div>
            {/* Greeting */}
            <h1 className="font-heading text-3xl font-bold tracking-normal text-white sm:text-4xl">
              {getGreeting()}, {userName}
            </h1>
            <p className="mt-1.5 text-sm text-steel sm:text-base">
              {format(now, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
              {" · "}
              BOILER COMP S.A. / SOLDESP S.A.
            </p>
          </div>
          {/* Date + status cards */}
          <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-80">
            <div className="rounded-lg border border-border-subtle bg-navy-dark/35 p-3 shadow-industrial-sm">
              <p className="text-xs uppercase text-steel">Fecha de control</p>
              <p className="mt-1 font-semibold text-white">
                {format(now, "dd MMM yyyy", { locale: es })}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 shadow-industrial-sm">
              <p className="text-xs uppercase text-emerald-200">Estado</p>
              <p className="mt-1 flex items-center gap-1.5 font-semibold text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Operativo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: KPI Strip (5 cards) ── */}
      <KPIStrip
        activeOrders={activeOrdersCount}
        delayedOrders={delayedOrdersCount}
        completedOrders={completedOrdersCount}
        avgProgress={avgProgress}
        hseqAlerts={hseqAlertsCount}
      />

      {/* ── SECTION 3: Two-column content ── */}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* LEFT: Órdenes en proceso */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gold" />
              <CardTitle>Órdenes en proceso</CardTitle>
            </div>
            <Badge variant="gold">{processOrders.length}</Badge>
          </CardHeader>
          <CardContent>
            {processOrders.length > 0 ? (
              <div className="space-y-1">
                {processOrders.slice(0, 10).map((order, i) => {
                  const isDelayed =
                    order.dueDate &&
                    order.dueDate < now &&
                    !CLOSED_STATUSES.includes(order.status);
                  return (
                    <div
                      key={order.id}
                      className={cn(
                        "list-item flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 transition-colors hover:border-border-subtle hover:bg-surface-hover",
                        isDelayed && "border-fire/30 bg-fire/5"
                      )}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      {/* Status dot */}
                      <span
                        className="h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[order.status] }}
                        aria-hidden="true"
                      />
                      {/* Code + title */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-steel">{order.code}</span>
                          <span className="truncate text-sm font-medium text-white">
                            {order.title}
                          </span>
                        </div>
                        {order.client && (
                          <p className="truncate text-xs text-steel/70">
                            {order.client.name}
                          </p>
                        )}
                      </div>
                      {/* Due date */}
                      {order.dueDate && (
                        <div className="flex-shrink-0 text-right">
                          <p
                            className={cn(
                              "text-xs font-medium",
                              isDelayed ? "text-fire-bright" : "text-steel"
                            )}
                          >
                            {format(order.dueDate, "dd/MM", { locale: es })}
                          </p>
                          {isDelayed && (
                            <p className="text-[10px] text-fire-bright">Atrasada</p>
                          )}
                        </div>
                      )}
                      {/* Progress */}
                      <div className="flex-shrink-0">
                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-navy-light">
                          <div
                            className="h-full rounded-full bg-gold"
                            style={{ width: `${order.progress}%` }}
                          />
                        </div>
                        <p className="mt-0.5 text-right text-[10px] text-steel">
                          {Math.round(order.progress)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="Sin órdenes activas"
                description="No hay órdenes de trabajo en proceso."
              />
            )}
          </CardContent>
        </Card>

        {/* RIGHT: Próximos vencimientos HSEQ */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-gold" />
              <CardTitle>Próximos vencimientos HSEQ</CardTitle>
            </div>
            {hseqAlertsCount > 0 && (
              <Badge variant="fire">
                {hseqAlertsCount} alerta{hseqAlertsCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {hseqVencimientos.length > 0 ? (
              <div className="space-y-3">
                {hseqVencimientos.slice(0, 10).map((record) => {
                  const isVencido = record.status === "vencido" || (record.dueDate !== null && record.dueDate < now && record.status !== "cerrado");
                  return (
                    <div
                      key={record.id}
                      className={cn(
                        "rounded-md border p-3 transition-colors",
                        isVencido
                          ? "hseq-alert-vencido border-fire/40 bg-fire/10"
                          : "border-border-subtle bg-navy-primary/30 hover:border-border-strong"
                      )}
                    >
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-steel">
                          {record.type.replace(/_/g, " ")}
                        </span>
                        <Badge variant={hseqStatusVariant(record.status)}>
                          {HSEQ_STATUS_LABELS[record.status]}
                        </Badge>
                      </div>
                      <p className="line-clamp-2 text-sm text-white">
                        {record.description}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        {record.dueDate && (
                          <p
                            className={cn(
                              "flex items-center gap-1 text-xs",
                              isVencido ? "text-fire-bright" : "text-steel"
                            )}
                          >
                            <Clock className="h-3 w-3" />
                            {isVencido
                              ? `Venció ${format(record.dueDate, "dd/MM/yyyy", { locale: es })}`
                              : `Vence ${format(record.dueDate, "dd/MM/yyyy", { locale: es })}`}
                          </p>
                        )}
                        {record.responsible && (
                          <p className="text-xs text-steel/70">
                            {record.responsible.name}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="Sin vencimientos HSEQ"
                description="No hay registros HSEQ abiertos ni próximos a vencer."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── SECTION 4: Bottom row ── */}
      <div className="grid items-start gap-6 xl:grid-cols-3">
        {/* Mini Gantt resumido */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-gold" />
              <CardTitle>Gantt resumido</CardTitle>
            </div>
            <span className="text-xs text-steel">Próximos 30 días</span>
          </CardHeader>
          <CardContent>
            {ganttOrders.length > 0 ? (
              <MiniGantt items={ganttOrders} windowDays={30} />
            ) : (
              <EmptyState
                title="Sin planificación"
                description="No hay órdenes con fechas asignadas."
              />
            )}
          </CardContent>
        </Card>

        {/* Alerts panel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-fire-bright" />
              <CardTitle>Alertas</CardTitle>
            </div>
            {hseqAlertsCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fire-bright text-[10px] font-bold text-white">
                {hseqAlertsCount > 9 ? "9+" : hseqAlertsCount}
              </span>
            )}
          </CardHeader>
          <CardContent>
            {hseqAlerts.length > 0 ? (
              <div className="space-y-2">
                {hseqAlerts.map((record) => {
                  const isVencido =
                    record.status === "vencido" ||
                    (record.dueDate !== null && record.dueDate < now);
                  return (
                    <div
                      key={record.id}
                      className={cn(
                        "flex items-start gap-2 rounded-md p-2",
                        isVencido
                          ? "hseq-alert-vencido border border-fire/30 bg-fire/5"
                          : "bg-navy-primary/30"
                      )}
                    >
                      {isVencido ? (
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-fire-bright" />
                      ) : (
                        <Clock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gold" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white">
                          {record.type.replace(/_/g, " ")}
                        </p>
                        <p className="line-clamp-1 text-[11px] text-steel">
                          {record.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="Sin alertas"
                description="No hay alertas pendientes."
              />
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-gold" />
              <CardTitle>Actividad reciente</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-2">
                {recentActivity.map((order, i) => (
                  <div
                    key={order.id}
                    className="list-item flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-surface-hover"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {/* Status dot */}
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[order.status] }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-white">
                        {order.code} · {order.title}
                      </p>
                      <p className="truncate text-[11px] text-steel/70">
                        {order.client?.name ?? "—"}
                      </p>
                    </div>
                    <Badge variant={workOrderStatusVariant(order.status)}>
                      {STATUS_LABELS[order.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Sin actividad"
                description="Aún no se registran órdenes."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
