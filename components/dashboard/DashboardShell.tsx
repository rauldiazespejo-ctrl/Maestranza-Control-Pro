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

  const initials = (user.name ?? user.email ?? "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="app-shell-bg min-h-screen">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 h-20 border-b border-border-subtle bg-navy-primary/82 shadow-industrial-sm backdrop-blur-xl">
        <div className="flex h-full items-center justify-between gap-3 px-3 sm:px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link
              href="/dashboard"
              className="min-w-0"
              aria-label="Ir al dashboard de MAESTRANZA Control Pro"
            >
              <BrandLockup showProductName />
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 sm:inline-flex">
              <Circle className="h-2 w-2 fill-current animate-pulse" />
              EN VIVO
            </span>

            <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-navy-light/78 px-2 py-1.5 shadow-industrial-sm backdrop-blur-md sm:px-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-xs font-bold text-navy-dark">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden flex-col md:flex">
                <span className="max-w-[140px] truncate text-xs font-semibold text-white">
                  {user.name ?? user.email}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-steel">
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
      <aside className="fixed inset-y-0 left-0 top-20 z-40 hidden w-72 flex-col border-r border-border-subtle bg-navy-primary/72 shadow-industrial-sm backdrop-blur-xl lg:flex">
        <div className="border-b border-border-subtle p-4">
          <p className="text-[11px] font-semibold uppercase text-steel">
            Panel operacional
          </p>
          <div className="mt-2 h-px w-full industrial-divider" />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-[background-color,border-color,color] duration-200",
                  active
                    ? "border border-fire-bright/25 bg-fire/10 text-white shadow-industrial-sm"
                    : "border border-transparent text-steel hover:border-border-subtle hover:bg-navy-light/70 hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    active ? "text-gold" : "text-steel group-hover:text-white"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border-subtle p-4">
          <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-navy-dark/32 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-light text-xs font-bold text-white">
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
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[min(20rem,86vw)] transform border-r border-border-subtle bg-navy-primary/94 shadow-industrial backdrop-blur-xl transition-transform duration-200 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex min-h-20 items-center justify-between gap-3 border-b border-border-subtle px-4">
          <BrandLockup showProductName={false} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-fire-bright/25 bg-fire/10 text-white"
                    : "border-transparent text-steel hover:border-border-subtle hover:bg-navy-light hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    active ? "text-fire-bright" : "text-steel group-hover:text-white"
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
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-h-screen pt-20 lg:ml-72">
        <div className="p-4 sm:p-5 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
