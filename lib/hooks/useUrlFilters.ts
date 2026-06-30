"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

/**
 * Filtros validos para las tablas de la aplicacion.
 */
export type TableFilterKey = "status" | "priority" | "search" | "type" | "norm" | "from" | "to" | "projectId";

/**
 * Hook para sincronizar filtros de tablas con query params de la URL.
 * @param validKeys - Lista de keys de filtros validos para esta pagina.
 * @returns Estado actual de los filtros y funciones para actualizarlos.
 *
 * @example
 * ```tsx
 * const { filters, setFilter, removeFilter, clearAll } = useUrlFilters(["status", "priority", "search"]);
 * ```
 */
export function useUrlFilters(validKeys: TableFilterKey[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const validKeySet = React.useMemo(() => new Set(validKeys), [validKeys]);

  /**
   * Obtiene los filtros actuales desde los query params de la URL.
   */
  const filters = React.useMemo(() => {
    const result: Partial<Record<TableFilterKey, string>> = {};
    validKeys.forEach((key) => {
      const value = searchParams.get(key);
      if (value !== null && value !== "") {
        result[key] = value;
      }
    });
    return result;
  }, [searchParams, validKeys]);

  /**
   * Verifica si hay filtros activos.
   */
  const hasFilters = React.useMemo(() => Object.keys(filters).length > 0, [filters]);

  /**
   * Actualiza un filtro sincronizandolo con la URL.
   * @param key - Key del filtro a actualizar.
   * @param value - Nuevo valor del filtro.
   */
  const setFilter = React.useCallback(
    (key: TableFilterKey, value: string) => {
      if (!validKeySet.has(key)) return;
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router, validKeySet]
  );

  /**
   * Elimina un filtro de la URL.
   * @param key - Key del filtro a eliminar.
   */
  const removeFilter = React.useCallback(
    (key: TableFilterKey) => {
      if (!validKeySet.has(key)) return;
      const params = new URLSearchParams(searchParams.toString());
      params.delete(key);
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router, validKeySet]
  );

  /**
   * Elimina todos los filtros de la URL.
   */
  const clearAll = React.useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    validKeys.forEach((key) => params.delete(key));
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router, validKeys]);

  return { filters, hasFilters, setFilter, removeFilter, clearAll };
}
