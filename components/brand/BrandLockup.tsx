import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLockupProps {
  variant?: "header" | "login" | "sidebar";
  className?: string;
  showProductName?: boolean;
}

function PartnerMarks({ expanded }: { expanded: boolean }) {
  return (
    <div className={cn("flex items-center", expanded ? "gap-4" : "gap-2")} aria-label="Una plataforma de Boiler Comp y Soldesp">
      <div className={cn("flex items-center justify-center overflow-hidden rounded-md bg-white", expanded ? "h-14 w-44 p-2" : "h-7 w-[78px] p-1")}>
        <Image src="/brand/partners/logo-boilercomp-horizontal.jpg" alt="Boiler Comp" width={1600} height={491} className="h-full w-full object-contain" priority={expanded} />
      </div>
      <span className={cn("bg-hairline-strong", expanded ? "h-10 w-px" : "h-5 w-px")} aria-hidden="true" />
      <div className={cn("flex items-center justify-center", expanded ? "h-14 w-32" : "h-7 w-14")}>
        <Image src="/brand/partners/logo-soldesp-full.png" alt="Soldesp" width={743} height={429} className="h-full w-full object-contain" priority={expanded} />
      </div>
    </div>
  );
}

export function BrandLockup({ variant = "header", className, showProductName = true }: BrandLockupProps) {
  const isLogin = variant === "login";
  const isSidebar = variant === "sidebar";

  if (isLogin) {
    return (
      <div className={cn("relative z-10 flex flex-col items-start gap-5", className)}>
        <PartnerMarks expanded />
        {showProductName && (
          <div>
            <p className="font-heading text-3xl font-bold tracking-[-0.03em] text-white">Maestranza Modelo <span className="text-gold">PRO</span></p>
            <p className="mt-1 text-sm font-medium text-ink-muted">Control operacional compartido</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <div className={cn("metal-brushed metal-bevel flex shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-surface-3 font-heading text-xs font-bold tracking-tight text-white", isSidebar ? "h-9 w-9" : "h-10 w-10")} aria-hidden="true">
        M<span className="text-gold">P</span>
      </div>
      {showProductName && (
        <div className="hidden min-w-0 xl:block">
          <p className="truncate font-heading text-sm font-bold tracking-tight text-white">Maestranza Modelo <span className="text-gold">PRO</span></p>
          <PartnerMarks expanded={false} />
        </div>
      )}
    </div>
  );
}
