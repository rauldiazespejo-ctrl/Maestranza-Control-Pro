"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  HardHat,
  BarChart3,
  FileText,
  ShieldAlert,
  Settings,
  Menu,
  X,
  LogOut,
  Circle,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand/BrandLockup";

interface DashboardShellProps {
  user: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
  children: React.ReactNode;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Órdenes", href: "/ordenes", icon: ClipboardList },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Trabajadores", href: "/trabajadores", icon: HardHat },
  { label: "Gantt", href: "/gantt", icon: BarChart3 },
  { label: "Reportes", href: "/reportes", icon: FileText },
  { label: "HSEQ", href: "/hseq", icon: ShieldAlert },
  { label: "Configuración", href: "/configuracion", icon: Settings },
];

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const mobileNavId = React.useId();

  React.useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  const initials = (user.name ?? user.email ?? "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="app-shell-bg control-center-shell min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-cyan focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-navy-dark"
      >
        Saltar al contenido
      </a>

      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-border-subtle bg-navy-primary/90 shadow-industrial-sm backdrop-blur-xl">
        <div className="flex h-full items-center justify-between gap-3 px-3 sm:px-4 lg:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
              aria-controls={mobileNavId}
              aria-expanded={mobileOpen}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link
              href="/dashboard"
              className="min-w-0"
              aria-label="Ir al dashboard de ForgeOps"
            >
              <BrandLockup showProductName />
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden min-h-9 items-center gap-2 rounded-full border border-cyan-bright/30 bg-cyan-muted px-3 text-xs font-semibold text-cyan-bright shadow-[0_0_24px_rgba(0,229,255,0.12)] sm:inline-flex">
              <Circle className="h-2 w-2 fill-current animate-pulse" aria-hidden="true" />
              Sistema operacional
            </span>

            <div className="flex min-h-10 items-center gap-2 rounded-lg border border-border-subtle bg-navy-light/70 px-2 shadow-industrial-sm backdrop-blur-md sm:min-w-64 sm:px-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gold text-xs font-bold text-navy-dark">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden min-w-0 flex-col md:flex">
                <span className="truncate text-xs font-semibold text-white">
                  {user.name ?? user.email}
                </span>
                <span className="text-[10px] uppercase text-steel">
                  {user.role}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-steel hover:text-white"
                onClick={() => signOut({ callbackUrl: "/login" })}
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 top-16 z-40 hidden w-64 flex-col border-r border-border-subtle bg-navy-primary/78 shadow-industrial-sm backdrop-blur-xl lg:flex">
        <div className="border-b border-border-subtle p-3">
          <p className="px-2 text-[11px] font-semibold uppercase text-steel">
            Panel operacional
          </p>
          <div className="mt-2 h-px w-full industrial-divider" />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Navegación principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-[background-color,border-color,box-shadow,color] duration-200",
                  active
                    ? "border border-cyan-bright/35 bg-cyan-muted text-white shadow-[inset_3px_0_0_rgba(0,229,255,0.88),0_10px_28px_rgba(0,0,0,0.18)]"
                    : "border border-transparent text-steel hover:border-border-subtle hover:bg-navy-light/70 hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    active ? "text-cyan-bright" : "text-steel group-hover:text-white"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border-subtle p-3">
          <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-navy-dark/42 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-navy-light text-xs font-bold text-white">
              {initials}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-xs font-semibold text-white">
                {user.name ?? user.email}
              </span>
              <span className="truncate text-[10px] text-steel">
                {user.email}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        id={mobileNavId}
        aria-label="Menú principal móvil"
        aria-hidden={!mobileOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[min(20rem,86vw)] transform border-r border-border-subtle bg-navy-primary/96 shadow-industrial backdrop-blur-xl transition-transform duration-200 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex min-h-16 items-center justify-between gap-3 border-b border-border-subtle px-4">
          <BrandLockup showProductName={false} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
            aria-controls={mobileNavId}
            aria-expanded={mobileOpen}
            tabIndex={mobileOpen ? undefined : -1}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="space-y-1 p-3" aria-label="Navegación principal móvil">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? "page" : undefined}
                tabIndex={mobileOpen ? undefined : -1}
                className={cn(
                  "group flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-cyan-bright/35 bg-cyan-muted text-white"
                    : "border-transparent text-steel hover:border-border-subtle hover:bg-navy-light hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    active ? "text-cyan-bright" : "text-steel group-hover:text-white"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t border-border-subtle p-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signOut({ callbackUrl: "/login" })}
            tabIndex={mobileOpen ? undefined : -1}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main id="main-content" className="min-h-screen pt-16 lg:ml-64">
        <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-5 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
