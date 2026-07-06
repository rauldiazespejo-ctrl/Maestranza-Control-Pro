import * as React from "react";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "fire"
  | "gold"
  | "success"
  | "destructive"
  /* ── Order states ── */
  | "nueva"
  | "planificada"
  | "en_proceso"
  | "detenida"
  | "revision"
  | "completada"
  | "cerrada"
  /* ── Priority ── */
  | "critica"
  | "alta"
  | "media"
  | "baja"
  /* ── HSEQ states ── */
  | "hseq-abierto"
  | "hseq-en-revision"
  | "hseq-cerrado"
  | "hseq-vencido";

export interface BadgeProps extends React.ComponentProps<"span"> {
  variant?: BadgeVariant;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-sm transition-[background-color,border-color,color] duration-200",
          {
            /* ── Base / generic ── */
            default:
              "border-border-subtle bg-navy-light text-white",
            secondary:
              "border-steel/40 bg-steel text-navy-dark",
            outline:
              "border border-border-subtle bg-transparent text-steel",
            fire:
              "border-alert/40 bg-alert/85 text-white",
            gold:
              "border-gold/45 bg-gold text-navy-dark",
            success:
              "border-blue-400/35 bg-blue-500/20 text-blue-100",
            destructive:
              "border-alert/45 bg-alert text-white",

            /* ── Order states ── */
            nueva: (
              "border-alert/35 bg-alert/12 text-red-200" +
              " [&_.badge-dot]:bg-red-300"
            ),
            planificada: (
              "border-border-gold bg-gold-muted text-gold" +
              " [&_.badge-dot]:bg-gold"
            ),
            en_proceso: (
              "border-steel/50 bg-navy-light text-steel" +
              " [&_.badge-dot]:bg-steel [&_.badge-dot]:animate-[pulse-dot_2s_ease-in-out_infinite]"
            ),
            detenida: (
              "border-alert/45 bg-alert/15 text-red-200" +
              " [&_.badge-dot]:bg-red-300"
            ),
            revision: (
              "border-border-gold/50 bg-gold-muted text-gold" +
              " [&_.badge-dot]:bg-gold"
            ),
            completada: (
              "border-blue-400/35 bg-blue-500/15 text-blue-200" +
              " [&_.badge-dot]:bg-blue-300"
            ),
            cerrada: (
              "border-border-subtle bg-navy-light/40 text-steel/60" +
              " [&_.badge-dot]:bg-steel/40"
            ),

            /* ── Priority ── */
            critica: (
              "border-alert/60 bg-alert text-white" +
              " [&_.badge-dot]:bg-white"
            ),
            alta: (
              "border-alert/45 bg-alert/15 text-red-200" +
              " [&_.badge-dot]:bg-red-300"
            ),
            media: (
              "border-border-gold bg-gold-muted text-gold" +
              " [&_.badge-dot]:bg-gold"
            ),
            baja: (
              "border-border-subtle bg-navy-light text-steel" +
              " [&_.badge-dot]:bg-steel"
            ),

            /* ── HSEQ states ── */
            "hseq-abierto":
              "border-alert/35 bg-alert/12 text-red-200",
            "hseq-en-revision":
              "border-border-gold/45 bg-gold/15 text-gold",
            "hseq-cerrado":
              "border-blue-300/30 bg-blue-500/10 text-blue-100/80",
            "hseq-vencido":
              "border-alert/60 bg-alert/20 text-red-100",
          }[variant],
          className
        )}
        {...props}
      >
        {/* Status dot — rendered for order-state and priority variants */}
        {["nueva", "planificada", "en_proceso", "detenida", "revision", "completada", "cerrada", "critica", "alta", "media", "baja"].includes(variant) && (
          <span className="badge-dot inline-block h-1.5 w-1.5 shrink-0 rounded-full" />
        )}
        {/* Check icon for completada */}
        {variant === "completada" && (
          <CheckCircle className="h-3 w-3 shrink-0" />
        )}
        {children}
      </span>
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
