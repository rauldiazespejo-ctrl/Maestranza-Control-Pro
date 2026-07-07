"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendBadgeProps {
  value: number;       // e.g. 12.4 → "+12.4%", -5.2 → "-5.2%"
  label?: string;
  className?: string;
}

/** Renders a trend badge with directional arrow and color coding */
export function TrendBadge({ value, label, className }: TrendBadgeProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors duration-200",
        isNeutral
          ? "border-border-subtle bg-white/5 text-steel"
          : isPositive
          ? "border-steel/35 bg-steel/12 text-steel"
          : "border-red-400/35 bg-red-500/12 text-red-200",
        className
      )}
    >
      {isNeutral ? (
        <Minus className="h-3 w-3" aria-hidden="true" />
      ) : isPositive ? (
        <TrendingUp className="h-3 w-3" aria-hidden="true" />
      ) : (
        <TrendingDown className="h-3 w-3" aria-hidden="true" />
      )}
      {isPositive ? "+" : ""}
      {value}
      {label ? ` ${label}` : "%"}
    </span>
  );
}
