import { cn } from "@/lib/utils";

interface BrandLockupProps {
  variant?: "header" | "login" | "sidebar";
  className?: string;
  showProductName?: boolean;
}

export function BrandLockup({
  variant = "header",
  className,
  showProductName = true,
}: BrandLockupProps) {
  const isLogin = variant === "login";
  const isSidebar = variant === "sidebar";

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3",
        isLogin && "flex-col text-center",
        className
      )}
    >
      <div
        className={cn(
          "metal-brushed metal-bevel relative flex shrink-0 items-center justify-center overflow-hidden border border-steel/25 bg-slate-950/80 backdrop-blur-md",
          isLogin ? "h-20 w-20 rounded-2xl p-3" : "h-11 w-11 rounded-xl p-2",
          isSidebar && "h-10 w-10 rounded-lg"
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(223,175,59,0.20),transparent_45%)]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/forgeops-mark.svg"
          alt="ForgeOps"
          className="relative h-full w-full object-contain"
        />
      </div>

      {showProductName && (
        <div className={cn("min-w-0", isLogin ? "space-y-1.5" : "hidden xl:block")}>
          <p
            className={cn(
              "truncate font-heading font-bold tracking-normal text-white",
              isLogin ? "text-3xl" : "text-base"
            )}
          >
            ForgeOps
          </p>
          <p
            className={cn(
              "truncate font-medium text-steel/85",
              isLogin ? "text-sm" : "text-[11px]"
            )}
          >
            Operaciones, trazabilidad y control
          </p>
        </div>
      )}
    </div>
  );
}
