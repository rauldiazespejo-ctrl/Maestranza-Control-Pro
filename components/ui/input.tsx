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
          "flex min-h-11 w-full rounded-lg border border-border-subtle bg-navy-primary/80 px-3 py-2 text-sm text-white shadow-sm transition-[border-color,background-color,box-shadow,transform] duration-200",
          "placeholder:text-muted-foreground",
          "hover:border-border-strong hover:bg-navy-light/65 focus-visible:border-border-gold focus-visible:bg-navy-light/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark",
          "disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-alert aria-[invalid=true]:ring-alert/50",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
