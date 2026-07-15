"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function SlideOver({ open, onClose, title, description, children, className }: SlideOverProps) {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          "metal-panel fixed right-0 top-0 z-[95] h-full w-full max-w-[480px] border-l shadow-industrial-lg transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border-subtle bg-navy-primary/95 px-6 py-4 backdrop-blur-sm">
          <div>
            <h2 className="font-heading text-lg font-semibold text-white">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-steel">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar panel" className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {/* Content */}
        <div className="h-[calc(100%-73px)] overflow-y-auto p-6">{children}</div>
      </div>
    </>
  );
}
