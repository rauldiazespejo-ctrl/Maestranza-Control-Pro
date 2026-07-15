"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X, ClipboardList, HardHat, Users, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { globalSearch } from "@/lib/actions/search";
import type { GlobalSearchResult } from "@/lib/actions/search";

/**
 * Componente de busqueda global con input, dropdown agrupado y shortcut Ctrl+K.
 * Se integra en el header del DashboardShell.
 */
export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<GlobalSearchResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  /** Cierra el buscador y limpia el estado */
  const closeSearch = React.useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults(null);
  }, []);

  // Shortcut Ctrl+K para abrir/cerrar busqueda
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        closeSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeSearch]);

  // Focar input al abrir
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Cerrar al hacer click fuera
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        closeSearch();
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, closeSearch]);

  // Debounced search — solo dispara si el query tiene 2+ caracteres
  React.useEffect(() => {
    if (query.trim().length < 2) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await globalSearch(query);
        setResults(data);
      } catch {
        setResults({ workOrders: [], workers: [], clients: [] });
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults(null);
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    closeSearch();
    router.push(path);
  };

  const hasResults =
    query.trim().length >= 2 &&
    results &&
    (results.workOrders.length > 0 ||
      results.workers.length > 0 ||
      results.clients.length > 0);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-9 gap-2 text-steel hover:text-white"
        onClick={() => setOpen(true)}
        aria-label="Búsqueda global (Control o Comando + K)"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="hidden text-xs sm:inline">Buscar…</span>
        <kbd className="hidden rounded border border-border-subtle bg-navy-dark px-1.5 py-0.5 text-[10px] font-mono text-steel md:inline">
          ⌘ K
        </kbd>
      </Button>

      {/* Dropdown */}
      {open && (
        <div className="fixed inset-x-0 top-16 z-50 mx-auto w-full max-w-xl px-4 sm:absolute sm:inset-auto sm:top-full sm:mt-2 sm:px-0">
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-navy-primary shadow-industrial-lg">
            {/* Input */}
            <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-steel" aria-hidden="true" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                name="global-search"
                autoComplete="off"
                placeholder="Buscar órdenes, trabajadores o clientes…"
                aria-label="Buscar en ForgeOps"
                className="border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => {
                    setQuery("");
                    setResults(null);
                  }}
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </Button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {loading && (
                <div className="px-4 py-6 text-center text-xs text-steel">
                  Buscando…
                </div>
              )}

              {!loading && !hasResults && query.trim().length >= 2 && (
                <div className="px-4 py-6 text-center text-xs text-steel">
                  No se encontraron resultados para &quot;{query}&quot;
                </div>
              )}

              {!loading && query.trim().length < 2 && (
                <div className="px-4 py-6 text-center text-xs text-steel">
                  Escribe al menos 2 caracteres para buscar
                </div>
              )}

              {results && results.workOrders.length > 0 && hasResults && (
                <div className="border-b border-border-subtle">
                  <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase text-steel">
                    <ClipboardList className="h-3 w-3" />
                  Órdenes
                  </div>
                  {results.workOrders.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => handleNavigate(`/ordenes/${o.id}`)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white transition-colors hover:bg-navy-light/50"
                    >
                      <span className="font-mono text-xs text-gold">
                        {o.code}
                      </span>
                      <span className="truncate">{o.title}</span>
                      <span className="ml-auto shrink-0 text-[10px] text-steel">
                        {o.status}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-ink-tertiary" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}

              {results && results.workers.length > 0 && hasResults && (
                <div className="border-b border-border-subtle">
                  <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase text-steel">
                    <HardHat className="h-3 w-3" />
                    Trabajadores
                  </div>
                  {results.workers.map((w) => (
                    <button
                      key={w.id}
                      onClick={() =>
                        handleNavigate(
                          `/trabajadores?search=${encodeURIComponent(w.name)}`,
                        )
                      }
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white transition-colors hover:bg-navy-light/50"
                    >
                      <span className="truncate">{w.name}</span>
                      <span className="ml-auto shrink-0 text-[10px] text-steel">
                        {w.position}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {results && results.clients.length > 0 && hasResults && (
                <div>
                  <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase text-steel">
                    <Users className="h-3 w-3" />
                    Clientes
                  </div>
                  {results.clients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() =>
                        handleNavigate(
                          `/clientes?search=${encodeURIComponent(c.name)}`,
                        )
                      }
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white transition-colors hover:bg-navy-light/50"
                    >
                      <span className="truncate">{c.name}</span>
                      {c.industry && (
                        <span className="ml-auto shrink-0 text-[10px] text-steel">
                          {c.industry}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border-subtle px-3 py-1.5 text-[10px] text-steel">
              <span>
                {(results?.workOrders.length ?? 0) +
                  (results?.workers.length ?? 0) +
                  (results?.clients.length ?? 0)}{" "}
                resultados
              </span>
              <span>Esc para cerrar</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
