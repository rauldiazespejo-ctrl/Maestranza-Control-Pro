import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  /** 0–100 */
  value: number;
  /** Accessible label — required when value is non-zero */
  label?: string;
  /** Show a shimmer sweep on the fill */
  shimmer?: boolean;
  className?: string;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, label, shimmer = false, className }, ref) => {
    const clamped = Math.min(100, Math.max(0, value));

    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-1.5", className)}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? `Progreso: ${clamped}%`}
      >
        {/* Track */}
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-navy-dark">
          {/* Fill — gradient fire → fire-bright */}
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full",
              "bg-gradient-to-r from-fire to-fire-bright",
              "transition-[width] duration-500 ease-out"
            )}
            style={{ width: `${clamped}%` }}
          >
            {/* Shimmer sweep overlay */}
            {shimmer && (
              <div
                className="absolute inset-0 overflow-hidden rounded-full"
                aria-hidden="true"
              >
                <div
                  className={cn(
                    "h-full w-1/2 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]",
                    "bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  )}
                />
              </div>
            )}
          </div>
        </div>

        {/* Optional label row */}
        {label && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-steel">{label}</span>
            <span className="text-xs font-semibold text-white">{clamped}%</span>
          </div>
        )}
      </div>
    );
  }
);
ProgressBar.displayName = "ProgressBar";

export { ProgressBar };
