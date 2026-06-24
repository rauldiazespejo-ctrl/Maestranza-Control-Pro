import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ComponentProps<"button"> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "accent";
  size?: "default" | "sm" | "lg" | "icon";
  /** Show a gold spinning loader and disable interactions */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "default", size = "default", loading, children, disabled, ...props },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark",
          /* hover: scale(1.02) — disabled just dims, no transform */
          "hover:enabled:scale-[1.02]",
          /* active: scale(0.98) */
          "active:enabled:scale-[0.98]",
          /* disabled: opacity-50, no pointer events */
          "disabled:opacity-50 disabled:pointer-events-none",
          {
            default:
              "bg-fire text-white shadow-[var(--shadow-btn-fire)] hover:enabled:bg-fire-bright hover:enabled:shadow-[var(--shadow-btn-fire-hover)]",
            secondary:
              "border border-border-subtle bg-navy-light/85 text-white hover:enabled:border-border-strong hover:enabled:bg-navy-light hover:enabled:shadow-industrial-sm",
            outline:
              "border border-border-subtle bg-white/[0.03] text-steel hover:enabled:border-border-strong hover:enabled:bg-navy-light/80 hover:enabled:text-white hover:enabled:shadow-industrial-sm",
            ghost:
              "bg-transparent text-steel hover:enabled:bg-navy-light/80 hover:enabled:text-white",
            destructive:
              "bg-fire-bright text-white shadow-[var(--shadow-btn-fire)] hover:enabled:bg-fire hover:enabled:shadow-[var(--shadow-btn-fire-hover)]",
            accent:
              "bg-gold text-navy-dark shadow-[var(--shadow-btn-fire)] hover:enabled:bg-gold/90 hover:enabled:shadow-[var(--shadow-btn-fire-hover)]",
          }[variant],
          {
            default: "min-h-10 px-6 py-3 text-sm",
            sm: "min-h-9 px-3 py-2 text-xs",
            lg: "min-h-11 px-8 py-3 text-base",
            icon: "h-10 w-10 shrink-0",
          }[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-gold" />
            <span className="sr-only">Cargando…</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
