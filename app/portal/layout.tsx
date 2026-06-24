import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";
import { BrandLockup } from "@/components/brand/BrandLockup";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    return <>{children}</>;
  }
  if (session.user.role !== "CLIENT") redirect("/dashboard");

  return (
    <div className="app-shell-bg min-h-screen">
      <header className="border-b border-border-subtle bg-navy-primary/82 shadow-industrial-sm backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/portal/dashboard" aria-label="Ir al dashboard cliente">
            <BrandLockup showProductName={false} />
          </Link>
          <nav className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
              Portal Cliente · {session.user.name}
            </span>
            <Link href="/portal/dashboard" className="text-sm font-medium text-steel hover:text-white">Dashboard</Link>
            <Link href="/portal/ordenes" className="text-sm font-medium text-steel hover:text-white">Mis órdenes</Link>
            <form action={async () => {
              "use server";
              await signOut({ redirectTo: "/portal/login" });
            }}>
              <Button type="submit" variant="ghost" size="sm" className="gap-1 text-steel hover:text-white"><LogOut className="h-4 w-4" /> Salir</Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 sm:p-6">{children}</main>
    </div>
  );
}
