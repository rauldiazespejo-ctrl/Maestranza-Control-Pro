"use client";

import { AlertTriangle, CheckCircle2, ShieldAlert, TrendingUp, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedKPIValue } from "./AnimatedKPIValue";
import { TrendBadge } from "./TrendBadge";

interface KPIStripProps {
  activeOrders: number;
  delayedOrders: number;
  completedOrders: number;
  avgProgress: number;
  hseqAlerts: number;
  // Optional trend deltas (computed client-side from prev period)
  trends?: {
    activeOrders?: number;
    delayedOrders?: number;
    completedOrders?: number;
    avgProgress?: number;
    hseqAlerts?: number;
  };
}

export function KPIStrip({ activeOrders, delayedOrders, completedOrders, avgProgress, hseqAlerts, trends }: KPIStripProps) {
  const cards = [
    {
      icon: Wrench,
      iconColor: "text-ink-muted",
      iconGlow: false,
      accentColor: "bg-hairline-strong",
      label: "Órdenes activas",
      value: activeOrders,
      trend: trends?.activeOrders,
      subtitle: "En planificación, ejecución o revisión.",
    },
    {
      icon: AlertTriangle,
      iconColor: "text-alert",
      iconGlow: false,
      accentColor: "bg-alert/60",
      label: "Órdenes atrasadas",
      value: delayedOrders,
      trend: trends?.delayedOrders,
      subtitle: "Compromisos vencidos no cerrados.",
    },
    {
      icon: CheckCircle2,
      iconColor: "text-success",
      iconGlow: false,
      accentColor: "bg-success/60",
      label: "Completadas",
      value: completedOrders,
      trend: trends?.completedOrders,
      subtitle: "Órdenes terminadas y verificadas.",
    },
    {
      icon: TrendingUp,
      iconColor: "text-gold",
      iconGlow: false,
      accentColor: "bg-gold/60",
      label: "Avance promedio",
      value: Math.round(avgProgress),
      suffix: "%",
      trend: trends?.avgProgress,
      subtitle: "Progreso promedio de todas las órdenes.",
      progress: Math.round(avgProgress),
    },
    {
      icon: ShieldAlert,
      iconColor: hseqAlerts > 0 ? "text-alert" : "text-ink-muted",
      iconGlow: false,
      accentColor: hseqAlerts > 0 ? "bg-alert/60" : "bg-hairline-strong",
      label: "Alertas HSEQ",
      value: hseqAlerts,
      trend: trends?.hseqAlerts,
      subtitle: hseqAlerts > 0
        ? "Registros abiertos o vencidos pendientes."
        : "Sin alertas pendientes.",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.label}
            className="metric-card kpi-card-enter relative overflow-hidden"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Top accent line */}
            <div
              className={`absolute inset-x-0 top-0 h-0.5 ${card.accentColor}`}
              aria-hidden="true"
            />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-ink-subtle">
                {card.label}
              </CardTitle>
              <div
                className={`metric-icon ${card.iconGlow ? "metric-icon-glow" : ""} ${card.iconColor}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <div className="flex items-end gap-2">
                <AnimatedKPIValue
                  value={card.value}
                  suffix={card.suffix ?? ""}
                  className="font-heading text-3xl font-bold tracking-[-0.02em] text-white tabular-nums"
                />
                {card.trend !== undefined && (
                  <TrendBadge value={card.trend} />
                )}
              </div>
              {card.progress !== undefined && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full bg-gold transition-[width] duration-700 ease-out"
                    style={{ width: `${card.progress}%` }}
                  />
                </div>
              )}
              <p className="mt-1 text-xs text-ink-subtle">{card.subtitle}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
