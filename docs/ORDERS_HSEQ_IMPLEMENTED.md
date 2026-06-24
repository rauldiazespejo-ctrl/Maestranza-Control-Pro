# Órdenes y HSEQ — Implementación UI

Fecha: 2026-06-24
Proyecto: MAESTRANZA Control Pro
Auditoría: ISO 45001 + D.S. 44 Chile

---

## Resumen de cambios

Se modernizaron las interfaces de **Órdenes de trabajo** y **Módulo HSEQ** según el Design Prompt (`docs/DESIGN_PROMPT.md`), secciones 3.2 y 3.4. No se modificó lógica de negocio ni fetching de datos.

---

## 1. Badge Variants — `components/ui/badge.tsx`

Se agregaron 4 variantes nuevas para estados HSEQ:

| Variant | Color | Uso |
|---|---|---|
| `hseq-abierto` | fire (borde/texto) | Estado "abierto" |
| `hseq-en-revision` | gold (borde/texto) | Estado "en_revision" |
| `hseq-cerrado` | steel/50% (muted) | Estado "cerrado" |
| `hseq-vencido` | fire-bright + glow | Estado "vencido" con sombra luminosă |

```tsx
// Uso
<Badge variant="hseq-abierto">Abierto</Badge>
<Badge variant="hseq-vencido">Vencido</Badge>
```

---

## 2. Página Órdenes — `app/(dashboard)/ordenes/page.tsx` + `OrdenesClient.tsx`

### Diseño: Cards en grid

- **Layout**: Grid responsive `sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3`
- **Card hover**: `translateY(-2px)` + borde `gold/30%` + sombra industrial-lg
- **Código de orden**: `font-mono` en color gold
- **Título**: Truncado con `line-clamp`

### Badges de estado (coloreados según Design Prompt)

```tsx
const statusBadgeMap = {
  nueva: "fire",
  planificada: "gold",
  en_proceso: "fire",
  detenida: "destructive",
  revision: "gold",
  completada: "secondary",
  cerrada: "secondary",
};
```

### Barra de progreso con gradiente fire

```tsx
<div className="relative h-2 overflow-hidden rounded-full bg-navy-light">
  <div
    className="absolute inset-y-0 left-0 rounded-full
               bg-gradient-to-r from-fire to-fire-bright
               transition-all duration-500"
    style={{ width: `${order.progress}%` }}
  />
</div>
```

### Filtros activos como chips

- Se muestran chips con `X` para cada filtro activo
- Click en `X` limpia el filtro y actualiza la URL

### Empty state con CTA

Cuando no hay órdenes se muestra EmptyState + botón "Nueva orden" centrado.

---

## 3. Detalle de Orden — `components/ordenes/OrdenDetailClient.tsx`

### Badges de estado coloreados

- `nueva` → `fire`
- `planificada` → `gold`
- `en_proceso` → `fire`
- `detenida` → `destructive`
- `revision` → `gold`
- `completada/cerrada` → `secondary`

### Barra de progreso con gradiente fire

Misma implementación que en la lista de órdenes: gradiente horizontal `from-fire to-fire-bright`.

### Tabla de dotación

- Header: `bg-navy-light`, texto `steel` uppercase
- Rows: `divide-y divide-border-subtle`
- Row hover: `hover:bg-navy-light/30`

---

## 4. Dashboard HSEQ — `components/hseq/HseqClient.tsx`

### Estructura priorizada por urgencia

```
[VENCIDOS — ALERTA CRÍTICA]   ← fuego, borde pulsing, glow
[Abiertos]                    ← borde fire
[En revisión]                 ← borde gold
[Cerrados]                    ← borde steel/50%
```

### Sección VENCIDOS — Critical Alert

```css
border: rgba(149,10,16,0.42);
box-shadow: 0 0 16px rgba(149,10,16,0.35);
animation: critical-pulse (2s ease-in-out infinite);
```

Animación `@keyframes critical-pulse` aplicada inline con `<style>` tag:
- 0%/100%: `box-shadow: 0 0 12px rgba(149,10,16,0.35)`
- 50%: `box-shadow: 0 0 22px rgba(149,10,16,0.55)`

### Tarjetas de registro HSEQ

Cada tarjeta muestra:
- **Tipo** (con icono contextual): `Search` (inspección), `AlertTriangle` (incidente), `Shield` (matriz/acción), `ShieldCheck` (capacitación)
- **Norma**: Badge con color según norma
- **Estado**: Badge con variante HSEQ
- **Descripción**: `line-clamp-2`
- **Responsable**
- **Fecha de vencimiento**
- **Firma requerida**: Indicador dorado
- **Días vencidos**: Contador "Venció hace N días" en fire-bright
- **Botones de acción**: Editar + Eliminar

### Badge variants aplicados

```tsx
<Badge variant="hseq-abierto">Abierto</Badge>
<Badge variant="hseq-en-revision">En revisión</Badge>
<Badge variant="hseq-cerrado">Cerrado</Badge>
<Badge variant="hseq-vencido">Vencido</Badge>
```

### Quick action buttons

- **Editar**: Botón ghost con icono Pencil
- **Eliminar**: Botón ghost icono con Trash2 en fire-bright

---

## 5. Validación — TypeScript + ESLint

```bash
# typecheck — ✅ PASA (0 errores)
node ./node_modules/typescript/bin/tsc --noEmit

# lint — ✅ PASA en archivos modificados (0 errores, 0 warnings)
eslint components/hseq/HseqClient.tsx \
       components/ordenes/OrdenesClient.tsx \
       components/ordenes/OrdenDetailClient.tsx \
       components/ui/badge.tsx \
       components/dashboard/AnimatedKPIValue.tsx
```

> **Nota**: Warnings pre-existentes en `dashboard/page.tsx` y `GanttClient.tsx` no fueron abordados (no son parte de este scope).

---

## 6. Paleta de colores aplicada

| Token | Valor | Uso |
|---|---|---|
| `--fire` | `#950A10` | Estado nuevo/proceso, CTA principal |
| `--fire-bright` | `#D92930` | Hover fire, vencido, errores |
| `--gold` | `#E8B33A` | En revisión, planificada, highlights |
| `--steel` | `#C8D5DC` | Estados cerrados, metadata |
| `navy-primary` | `#16163F` | Fondo base cards |
| `navy-light` | `#1C244B` | Headers de tabla, hover |

---

## 7. Archivos modificados

| Archivo | Cambio |
|---|---|
| `components/ui/badge.tsx` | Nuevas variantes HSEQ |
| `components/ordenes/OrdenDetailClient.tsx` | Badges coloreados + gradiente progress |
| `components/ordenes/OrdenesClient.tsx` | Cards layout + filter chips |
| `components/hseq/HseqClient.tsx` | Priorización visual + tarjetas + Critical Alert |
| `components/dashboard/AnimatedKPIValue.tsx` | Fix pre-existing lint error (flushSync) |

---

## 8. Decisions de implementación

1. **Avatar stack**: No se implementó en la lista de órdenes porque `getWorkOrders()` no incluye `assignments` (los trabajadores asignados). El detalle de orden (`OrdenDetailClient.tsx`) ya soporta múltiples trabajadores — solo la lista los muestra por `responsible` único.

2. **Critical pulse animation**: Se implementó con `<style>` tag inline en `HseqClient.tsx` para evitar crear un nuevo archivo CSS global.

3. **Filtros activos**: Se muestran chips en la UI pero el filtering real usa `URLSearchParams` — se mantiene la UX de parámetros de URL.

4. **Gradiente progress bar**: Implementado con Tailwind `bg-gradient-to-r from-fire to-fire-bright` — sin CSS custom.
