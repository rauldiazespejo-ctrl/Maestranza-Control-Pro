# Mejoras Gráficas — Maestranza Control Pro

## Objetivo
Consolidar una identidad visual **industrial premium sobria**, reduciendo el estilo neón/cian intenso y mejorando consistencia, legibilidad y jerarquía visual en toda la app.

---

## Cambios aplicados

### 1) Tema global (`app/globals.css`)
- Rebalanceo de paleta principal hacia tonos sobrios (acero/navy/ámbar/alerta).
- Reducción de saturación en gradientes y efectos de brillo.
- Ajuste de tokens semánticos (`--color-primary`, `--color-ring`, sombras de foco y botones).
- Atenuación de superficies tipo “neon” para evitar glow dominante.
- Mejora de contraste en estados de interacción sin perder accesibilidad visual.

### 2) Componentes UI base
#### `components/ui/button.tsx`
- Focus ring unificado y más sobrio.
- Variantes `default`, `destructive` y `accent` con menor agresividad visual.
- Sombras simplificadas para evitar efecto neón.

#### `components/ui/card.tsx`
- Hover más contenido (`hover:-translate-y-0.5`) y sombra industrial discreta.
- Menor ruido visual en elevación.

#### `components/ui/input.tsx`
- Normalización de foco e inválido.
- Estados de error migrados a esquema `alert` más limpio y consistente.

#### `components/ui/badge.tsx`
- Revisión de variantes críticas y semánticas.
- Eliminación de combinaciones con brillo excesivo.
- Consistencia en bordes/fondos para estados de riesgo y HSEQ.

### 3) Dashboard y navegación
#### `components/dashboard/TrendBadge.tsx`
- Reemplazo de estilo glow por badges con borde y fondo sutil.
- Mejor lectura en estados positivo/negativo/neutral.

#### `components/dashboard/KPIStrip.tsx`
- Corrección de implementación de línea de acento (uso correcto de clases Tailwind).
- Ajuste de iconografía/acento para evitar dominancia neón.

#### `components/dashboard/DashboardShell.tsx`
- Eliminación de clases activas cian-bright en navegación.
- Estado activo migrado a dorado sobrio (`text-gold`, `border-border-gold`).
- Badge “Sistema operacional” llevado a tratamiento visual sobrio sin glow cian.

---

## Beneficios obtenidos
- Identidad visual más profesional y coherente con contexto industrial.
- Menor fatiga visual en sesiones largas.
- Mejor consistencia entre layout, componentes y estados de interacción.
- Base más mantenible para futuras iteraciones de diseño.

---

## Pendientes recomendados (siguiente iteración)
1. Barrido final de clases legacy (`cyan`, `fire`, `neon`) en módulos de negocio restantes.
2. Validación visual exhaustiva por flujo:
   - Login
   - Dashboard
   - Órdenes
   - Trabajadores
   - Gantt
   - HSEQ
   - Configuración
   - Portal cliente
3. Cierre técnico con evidencias completas de:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test`
   - `npm run build`
4. Redespliegue productivo y registro de URL final en documentación.

---

## Rama de respaldo
- `blackboxai/respaldo-ui-industrial-2026-07-06`

## Commit de respaldo
- `feat(ui): hardening visual industrial sobrio and global theme refinements`
