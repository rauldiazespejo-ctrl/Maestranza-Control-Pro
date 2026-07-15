import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.ComponentProps<"input">;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "metal-control flex min-h-11 w-full rounded-lg border border-hairline px-3.5 py-2.5 text-sm text-white",
          "transition-[border-color,background-color,box-shadow,transform] duration-200",
          "placeholder:text-ink-tertiary",
          "hover:border-hairline-strong hover:bg-surface-3 focus-visible:border-gold/50 focus-visible:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/20 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
          "disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-alert aria-[invalid=true]:ring-alert/30",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
