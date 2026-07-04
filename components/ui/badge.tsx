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
              "border-fire-bright/30 bg-fire text-white",
            gold:
              "border-gold/45 bg-gold text-navy-dark",
            success:
              "border-emerald-400/30 bg-emerald-600 text-white",
            destructive:
              "border-fire-bright/40 bg-fire-bright text-white",

            /* ── Order states ── */
            nueva: (
              "border-border-fire bg-fire-muted text-fire-bright" +
              " [&_.badge-dot]:bg-fire-bright"
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
              "border-border-fire/50 bg-fire-muted text-fire" +
              " [&_.badge-dot]:bg-fire"
            ),
            revision: (
              "border-border-gold/50 bg-gold-muted text-gold" +
              " [&_.badge-dot]:bg-gold"
            ),
            completada: (
              "border-steel/40 bg-navy-light text-steel" +
              " [&_.badge-dot]:bg-steel/60"
            ),
            cerrada: (
              "border-border-subtle bg-navy-light/40 text-steel/60" +
              " [&_.badge-dot]:bg-steel/40"
            ),

            /* ── Priority ── */
            critica: (
              "border-fire bg-fire text-white shadow-[0_0_12px_var(--color-fire)]" +
              " [&_.badge-dot]:bg-white"
            ),
            alta: (
              "border-fire bg-fire-muted text-fire-bright" +
              " [&_.badge-dot]:bg-fire"
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
              "border-border-fire/40 bg-fire/20 text-fire-bright",
            "hseq-en-revision":
              "border-border-gold/45 bg-gold/15 text-gold",
            "hseq-cerrado":
              "border-steel/30 bg-steel/10 text-steel/60",
            "hseq-vencido":
              "border-fire-bright/60 bg-fire-bright/25 text-white shadow-[0_0_10px_var(--color-fire-bright)]",
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
