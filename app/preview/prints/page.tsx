import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  HardHat,
  LayoutDashboard,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import { BrandLockup } from "@/components/brand/BrandLockup";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Prints de despliegue | ForgeOps",
  description: "Pantallas demo para capturas de despliegue de ForgeOps.",
  robots: {
    index: false,
    follow: false,
  },
};

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Ordenes", icon: ClipboardList },
  { label: "Clientes", icon: Users },
  { label: "Trabajadores", icon: HardHat },
  { label: "Gantt", icon: BarChart3 },
  { label: "Reportes", icon: FileText },
  { label: "HSEQ", icon: ShieldAlert },
];

const orders = [
  { code: "OT-2026-041", title: "Fabricacion spool linea impulsion", status: "En proceso", progress: 68, priority: "Alta" },
  { code: "OT-2026-038", title: "Mantencion estructural chancador", status: "Revision", progress: 92, priority: "Media" },
  { code: "OT-2026-033", title: "Cambio valvulas red servicios", status: "Atrasada", progress: 44, priority: "Critica" },
];

const hseqRecords = [
  { type: "Inspeccion", norm: "ISO 45001", status: "Abierto", due: "05 Jul 2026" },
  { type: "Accion correctiva", norm: "DS 44", status: "Vencido", due: "28 Jun 2026" },
  { type: "Capacitacion", norm: "ISO 9001", status: "Cerrado", due: "18 Jun 2026" },
];

function ShellFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell-bg min-h-dvh text-white">
      <header className="sticky top-0 z-20 h-20 border-b border-border-subtle bg-navy-primary/82 shadow-industrial-sm backdrop-blur-xl">
        <div className="flex h-full items-center justify-between gap-4 px-5">
          <Link href="/preview/prints" aria-label="ForgeOps preview">
            <BrandLockup />
          </Link>
          <div className="hidden items-center gap-3 md:flex">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Demo operativo
            </span>
            <span className="inline-flex min-h-9 items-center justify-center rounded-md border border-border-subtle bg-white/[0.03] px-3 py-2 text-xs font-semibold text-steel">
              Exportar prints
            </span>
          </div>
        </div>
      </header>
      <div className="grid lg:grid-cols-[18rem_1fr]">
        <aside className="hidden min-h-[calc(100dvh-5rem)] border-r border-border-subtle bg-navy-primary/58 p-4 backdrop-blur-xl lg:block">
          <p className="mb-3 text-[11px] font-semibold uppercase text-steel">Navegacion</p>
          <nav className="space-y-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={[
                    "flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium",
                    index === 0
                      ? "border-emerald-400/25 bg-emerald-400/10 text-white"
                      : "border-transparent text-steel",
                  ].join(" ")}
                >
                  <Icon className={index === 0 ? "h-5 w-5 text-emerald-300" : "h-5 w-5"} />
                  {item.label}
                </div>
              );
            })}
          </nav>
        </aside>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: string;
  icon: typeof Activity;
}) {
  return (
    <Card className="min-h-36 border-border-subtle">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm text-steel">{label}</CardTitle>
        <Icon className={`h-5 w-5 ${tone}`} />
      </CardHeader>
      <CardContent>
        <p className="font-heading text-3xl font-bold text-white">{value}</p>
        <p className="mt-2 text-xs text-steel">Actualizado hace 4 minutos</p>
      </CardContent>
    </Card>
  );
}

export default function PrintsPreviewPage() {
  return (
    <ShellFrame>
      <div className="mx-auto max-w-7xl space-y-6">
        <section id="dashboard" className="surface-glass rounded-lg border-emerald-400/20 p-5 shadow-industrial-lg sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase text-emerald-200">
                <Activity className="h-3.5 w-3.5" />
                Centro de control
              </div>
              <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">ForgeOps</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-steel sm:text-base">
                Operaciones, trazabilidad documental, avance de ordenes y alertas criticas en una sola vista.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-80">
              <div className="rounded-lg border border-border-subtle bg-navy-dark/40 p-3">
                <p className="text-xs uppercase text-steel">Fecha de control</p>
                <p className="mt-1 font-semibold text-white">03 Jul 2026</p>
              </div>
              <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3">
                <p className="text-xs uppercase text-emerald-200">Estado</p>
                <p className="mt-1 font-semibold text-emerald-200">Operativo</p>
              </div>
            </div>
          </div>
        </section>

        <section id="kpis" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Ordenes activas" value="18" tone="text-emerald-300" icon={ClipboardList} />
          <KpiCard label="Avance promedio" value="72%" tone="text-gold" icon={BarChart3} />
          <KpiCard label="Alertas abiertas" value="5" tone="text-red-300" icon={AlertTriangle} />
          <KpiCard label="Trabajadores asignados" value="42" tone="text-steel" icon={HardHat} />
        </section>

        <section id="ordenes" className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Ordenes de trabajo</CardTitle>
                <p className="mt-1 text-sm text-steel">Planificacion, avance y prioridad operacional.</p>
              </div>
              <span className="inline-flex min-h-9 items-center justify-center rounded-md bg-fire px-3 py-2 text-xs font-semibold text-white shadow-[var(--shadow-btn-fire)]">
                Nueva orden
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
                <Input className="pl-9" placeholder="Buscar orden, cliente o responsable" />
              </div>
              {orders.map((order) => (
                <div key={order.code} className="rounded-lg border border-border-subtle bg-navy-primary/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs font-semibold text-emerald-200">{order.code}</p>
                      <p className="mt-1 font-heading text-base font-semibold text-white">{order.title}</p>
                    </div>
                    <Badge variant={order.status === "Atrasada" ? "destructive" : "gold"}>{order.status}</Badge>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-navy-light">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${order.progress}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-steel">
                    <span>Prioridad {order.priority}</span>
                    <span>{order.progress}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card id="gantt">
            <CardHeader>
              <CardTitle>Carta Gantt</CardTitle>
              <p className="text-sm text-steel">Vista temporal por fases y compromisos.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {["Ingenieria", "Fabricacion", "Montaje", "Revision"].map((phase, index) => (
                <div key={phase}>
                  <div className="mb-1 flex justify-between text-xs text-steel">
                    <span>{phase}</span>
                    <span>Semana {index + 1}-{index + 3}</span>
                  </div>
                  <div className="h-8 rounded-lg bg-navy-light/70 p-1">
                    <div
                      className="h-full rounded-md bg-gradient-to-r from-emerald-500 to-gold"
                      style={{ width: `${48 + index * 12}%`, marginLeft: `${index * 7}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section id="hseq" className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Registros HSEQ</CardTitle>
              <p className="text-sm text-steel">Modulo secundario para cumplimiento, inspecciones y acciones correctivas.</p>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {hseqRecords.map((record) => (
                <div key={`${record.type}-${record.status}`} className="rounded-lg border border-border-subtle bg-navy-primary/45 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <ShieldAlert className={record.status === "Vencido" ? "h-5 w-5 text-red-300" : "h-5 w-5 text-emerald-300"} />
                    <Badge variant={record.status === "Vencido" ? "destructive" : "outline"}>{record.status}</Badge>
                  </div>
                  <p className="mt-4 font-heading text-sm font-semibold text-white">{record.type}</p>
                  <p className="mt-1 text-xs text-steel">{record.norm}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-steel">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {record.due}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card id="reportes">
            <CardHeader>
              <CardTitle>Reportes</CardTitle>
              <p className="text-sm text-steel">Exportacion ejecutiva y seguimiento por cliente.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {["Ordenes por estado", "Avance por cliente", "Alertas abiertas"].map((label, index) => (
                <div key={label} className="flex items-center justify-between rounded-lg border border-border-subtle bg-navy-dark/35 p-3">
                  <span className="text-sm text-white">{label}</span>
                  <span className="font-mono text-sm text-emerald-200">{[18, 72, 5][index]}</span>
                </div>
              ))}
              <span className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-border-subtle bg-navy-light/85 px-4 py-2 text-sm font-semibold text-white">
                Descargar PDF
              </span>
            </CardContent>
          </Card>
        </section>

        <section id="documentos" className="rounded-lg border border-border-subtle bg-navy-primary/48 p-4 shadow-industrial-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold text-white">Documentos y evidencias</h2>
              <p className="text-sm text-steel">Trazabilidad de respaldos por orden, cliente y registro.</p>
            </div>
            <FileText className="h-6 w-6 text-emerald-300" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {["Procedimiento soldadura.pdf", "Certificado inspeccion.pdf", "Evidencia fotografica.zip"].map((doc) => (
              <div key={doc} className="flex items-center gap-3 rounded-lg border border-border-subtle bg-navy-dark/40 p-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                <span className="truncate text-sm text-white">{doc}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ShellFrame>
  );
}
