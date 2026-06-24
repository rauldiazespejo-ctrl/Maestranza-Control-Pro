"use client";

import { format, differenceInDays, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import type { WorkOrderStatus, Priority } from "@prisma/client";
import { cn } from "@/lib/utils";

interface GanttItem {
  id: string;
  code: string;
  title: string;
  startDate: Date | null;
  dueDate: Date | null;
  progress: number;
  status: WorkOrderStatus;
  priority: Priority;
}

interface MiniGanttProps {
  items: GanttItem[];
  /** Timeline window in days (default 30) */
  windowDays?: number;
  className?: string;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  critica: "#D92930",
  alta: "#950A10",
  media: "#E8B33A",
  baja: "#4A5568",
};

const STATUS_OPACITY: Record<WorkOrderStatus, number> = {
  nueva: 0.5,
  planificada: 0.6,
  en_proceso: 1,
  detenida: 0.45,
  revision: 0.7,
  completada: 0.4,
  cerrada: 0.3,
};

export function MiniGantt({ items, windowDays = 30, className }: MiniGanttProps) {
  const today = startOfDay(new Date());
  const timelineStart = new Date(today);
  timelineStart.setDate(today.getDate() - 7); // 7 days in the past
  const timelineEnd = new Date(today);
  timelineEnd.setDate(today.getDate() + windowDays);

  const totalDays = differenceInDays(timelineEnd, timelineStart);

  const getLeftPercent = (date: Date | null) => {
    if (!date) return 0;
    const d = startOfDay(date);
    const days = differenceInDays(d, timelineStart);
    return Math.max(0, Math.min(100, (days / totalDays) * 100));
  };

  const getWidthPercent = (start: Date | null, end: Date | null) => {
    if (!start || !end) return 0;
    const s = startOfDay(start);
    const e = startOfDay(end);
    const days = differenceInDays(e, s);
    return Math.max(1, Math.min(100, (days / totalDays) * 100));
  };

  // Filter items that have at least a dueDate within our window
  const visibleItems = items
    .filter((item) => {
      if (!item.dueDate) return false;
      const d = startOfDay(item.dueDate);
      return d >= timelineStart && d <= timelineEnd;
    })
    .slice(0, 8);

  // Generate month labels
  const monthLabels: { label: string; left: number }[] = [];
  const cur = new Date(timelineStart);
  cur.setDate(1);
  while (cur <= timelineEnd) {
    const left = getLeftPercent(cur);
    monthLabels.push({ label: format(cur, "MMM", { locale: es }), left });
    cur.setMonth(cur.getMonth() + 1);
  }

  // Today marker position
  const todayLeft = getLeftPercent(today);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Timeline header */}
      <div className="relative h-6 overflow-hidden">
        <div
          className="absolute inset-y-0 w-px bg-gold opacity-40"
          style={{ left: `${todayLeft}%` }}
          aria-hidden="true"
        />
        {monthLabels.map((m, i) => (
          <span
            key={i}
            className="absolute text-[10px] uppercase text-steel"
            style={{ left: `${m.left}%` }}
          >
            {m.label}
          </span>
        ))}
      </div>

      {/* Gantt bars */}
      <div className="relative flex flex-col gap-2" style={{ minHeight: `${visibleItems.length * 32 + 8}px` }}>
        {/* Today line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-gold/40"
          style={{ left: `${todayLeft}%` }}
          aria-label="Hoy"
        />

        {/* Month grid lines */}
        {monthLabels.slice(1).map((m, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px bg-border-subtle"
            style={{ left: `${m.left}%` }}
            aria-hidden="true"
          />
        ))}

        {visibleItems.length === 0 ? (
          <p className="text-sm text-steel">Sin órdenes con vencimiento en este período.</p>
        ) : (
          visibleItems.map((item) => {
            const left = getLeftPercent(item.startDate ?? item.dueDate ?? today);
            const width = getWidthPercent(item.startDate ?? today, item.dueDate ?? today);
            const color = PRIORITY_COLORS[item.priority];
            const opacity = STATUS_OPACITY[item.status];
            const isDelayed =
              item.dueDate &&
              startOfDay(item.dueDate) < today &&
              item.status !== "completada" &&
              item.status !== "cerrada";

            return (
              <div
                key={item.id}
                className="group relative flex items-center"
                style={{ height: "28px" }}
              >
                {/* Label */}
                <span
                  className="mr-2 w-16 flex-shrink-0 truncate text-right text-[11px] text-steel"
                  title={item.code}
                >
                  {item.code}
                </span>

                {/* Track */}
                <div className="relative h-4 flex-1 overflow-hidden rounded-sm bg-navy-light/50">
                  {/* Bar */}
                  <div
                    className="absolute top-0 h-full rounded-sm transition-all duration-300"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: color,
                      opacity,
                    }}
                    aria-hidden="true"
                  />
                  {/* Progress fill */}
                  {item.progress > 0 && (
                    <div
                      className="absolute top-0 h-full rounded-sm brightness-125"
                      style={{
                        left: `${left}%`,
                        width: `${(width * item.progress) / 100}%`,
                        backgroundColor: color,
                        opacity: Math.min(1, opacity + 0.2),
                      }}
                      aria-hidden="true"
                    />
                  )}
                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded border border-border-subtle bg-navy-light px-2 py-1 text-[10px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    {item.title} — {item.progress}%
                  </div>
                </div>

                {/* Delayed indicator */}
                {isDelayed && (
                  <span className="ml-2 flex-shrink-0 text-[10px] font-semibold text-fire-bright">
                    ATRASADA
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-steel">
        <span className="font-semibold uppercase">Prioridad:</span>
        {(["critica", "alta", "media", "baja"] as Priority[]).map((p) => (
          <span key={p} className="flex items-center gap-1">
            <span
              className="h-2 w-3 rounded-sm"
              style={{ backgroundColor: PRIORITY_COLORS[p] }}
            />
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </span>
        ))}
        <span className="ml-2 flex items-center gap-1">
          <span className="h-0 w-3 border-t border-dashed border-gold/60" />
          Hoy
        </span>
      </div>
    </div>
  );
}
