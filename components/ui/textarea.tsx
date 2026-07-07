import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.ComponentProps<"textarea">;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "metal-brushed flex min-h-[80px] w-full rounded-lg border border-border-subtle px-3 py-2 text-sm text-white shadow-sm transition-[border-color,background-color,box-shadow,transform] duration-200",
          "placeholder:text-muted-foreground",
          "hover:border-border-strong hover:bg-navy-light/65",
          "focus-visible:border-gold focus-visible:bg-navy-light/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark",
          "disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-fire-bright aria-[invalid=true]:ring-fire-bright",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
