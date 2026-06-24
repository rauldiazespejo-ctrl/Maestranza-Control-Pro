import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectProps = React.ComponentProps<"select">;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "flex min-h-11 w-full appearance-none rounded-lg border border-border-subtle bg-navy-primary/80 px-3 py-2 pr-10 text-sm text-white shadow-sm transition-[border-color,background-color,box-shadow] duration-200",
            "hover:border-border-strong hover:bg-navy-light/65 focus-visible:border-gold focus-visible:bg-navy-light/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
