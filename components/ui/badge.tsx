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
          "inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-xs transition-[background-color,border-color,color] duration-200",
          {
            /* ── Base / generic ── */
            default:
              "border-hairline bg-surface-2 text-white",
            secondary:
              "border-ink-muted/30 bg-ink-muted/10 text-ink-muted",
            outline:
              "border border-hairline bg-transparent text-ink-subtle",
            fire:
              "border-alert/40 bg-alert/85 text-white",
            gold:
              "border-gold/45 bg-gold text-canvas",
            success:
              "border-success/40 bg-success/12 text-success",
            destructive:
              "border-alert/45 bg-alert text-white",

            /* ── Order states ── */
            nueva: (
              "border-alert/35 bg-alert/12 text-red-200" +
              " [&_.badge-dot]:bg-red-300"
            ),
            planificada: (
              "border-gold/30 bg-gold-muted text-gold" +
              " [&_.badge-dot]:bg-gold"
            ),
            en_proceso: (
              "border-ink-muted/40 bg-surface-3 text-ink-muted" +
              " [&_.badge-dot]:bg-ink-muted [&_.badge-dot]:animate-[pulse-dot_2s_ease-in-out_infinite]"
            ),
            detenida: (
              "border-alert/45 bg-alert/15 text-red-200" +
              " [&_.badge-dot]:bg-red-300"
            ),
            revision: (
              "border-gold/40 bg-gold-muted text-gold" +
              " [&_.badge-dot]:bg-gold"
            ),
            completada: (
              "border-success/35 bg-success/12 text-success" +
              " [&_.badge-dot]:bg-success"
            ),
            cerrada: (
              "border-hairline bg-surface-1/50 text-ink-tertiary" +
              " [&_.badge-dot]:bg-ink-tertiary"
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
              "border-gold/30 bg-gold-muted text-gold" +
              " [&_.badge-dot]:bg-gold"
            ),
            baja: (
              "border-hairline bg-surface-2 text-ink-subtle" +
              " [&_.badge-dot]:bg-ink-subtle"
            ),

            /* ── HSEQ states ── */
            "hseq-abierto":
              "border-alert/35 bg-alert/12 text-red-200",
            "hseq-en-revision":
              "border-gold/40 bg-gold/15 text-gold",
            "hseq-cerrado":
              "border-success/30 bg-success/10 text-success/90",
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
