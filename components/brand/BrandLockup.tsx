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
          "flex items-center gap-2 rounded-lg border border-border-subtle bg-navy-primary/70 p-2 shadow-industrial backdrop-blur-md",
          isLogin && "gap-3 p-3"
        )}
      >
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-navy-dark/60 px-2",
            isLogin ? "h-14 w-44" : "h-9 w-28 sm:w-32"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/boiler-logo-white.svg"
            alt="BOILER COMP S.A."
            className="h-full w-full object-contain p-1.5"
          />
        </div>
        <div className="h-8 w-px shrink-0 bg-border-subtle" aria-hidden="true" />
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-navy-dark/60 px-2",
            isLogin ? "h-14 w-32" : "h-9 w-20 sm:w-24"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/soldesp-logo-white.svg"
            alt="SOLDESP S.A."
            className="h-full w-full object-contain p-1.5"
          />
        </div>
      </div>

      {showProductName && (
        <div className={cn("min-w-0", isLogin ? "space-y-1" : "hidden xl:block")}>
          <p
            className={cn(
              "truncate font-heading font-bold text-white",
              isLogin ? "text-2xl" : "text-sm"
            )}
          >
            MAESTRANZA Control Pro
          </p>
          <p
            className={cn(
              "truncate text-steel",
              isLogin ? "text-sm" : "text-[11px]"
            )}
          >
            BOILER COMP S.A. / SOLDESP S.A.
          </p>
        </div>
      )}
    </div>
  );
}
