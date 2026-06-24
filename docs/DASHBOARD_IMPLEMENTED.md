# Dashboard — Implementation Summary

> Generated: 2026-06-24 · MAESTRANZA Control Pro · ISO 45001 + D.S. 44 Chile

---

## Overview

Implemented the redesigned Dashboard (`app/(dashboard)/dashboard/page.tsx`) following the design spec
in `docs/DESIGN_PROMPT.md` §3.1. Only UI/UX changes were made — no business logic was modified.

**Verification:** `npm run typecheck` ✓ `npm run lint` ✓

---

## Changes by requirement

### 1. Modernized KPI Strip (`components/dashboard/KPIStrip.tsx`)

- **5 metric cards** in a responsive row: `sm:grid-cols-2 lg:grid-cols-5`
  - 1. Órdenes activas (`Wrench`, gold accent)
  - 2. Órdenes atrasadas (`AlertTriangle`, fire-bright accent)
  - 3. Completadas (`CheckCircle2`, emerald accent)
  - 4. Avance promedio (`TrendingUp`, gold accent + progress bar)
  - 5. Alertas HSEQ (`ShieldAlert`, fire-bright when alerts > 0, gold otherwise)
- Each card: `surface-glass`, top accent line, icon with glow (`metric-icon-glow` class), value in `text-3xl font-heading bold text-white`, label in `text-sm text-steel`
- Hover: `translateY(-2px)`, `border-color: rgba(232,179,58,0.32)` (via existing `.metric-card` CSS)
- Cards entrance: staggered `kpi-card-enter` animation (0 / 80 / 160 / 240 / 320 ms delay)

### 2. Count-up animation (`components/dashboard/AnimatedKPIValue.tsx`)

- Pure `requestAnimationFrame` + `easeOutExpo` — no libraries
- `easeOutExpo(t) = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)`
- Duration: 1200 ms default, configurable via `duration` prop
- `prevValueRef` prevents cascading renders on unrelated effect deps
- Supports `prefix`, `suffix`, `decimals` props

### 3. Staggered fade-in for order list rows

- Existing `.list-item` CSS class (defined in `app/globals.css`) with `pageEnter` keyframe
- `50ms × item index` delay per row (max 10 items via nth-child)
- Applied to: process orders list (LEFT column) and recent activity list (bottom)

### 4. Hero greeting

- Dynamic greeting: `Buenos días / Buenas tardes / Buenas noches` based on `new Date().getHours()`
- Shows user first name from `session.user.name`
- Full date: `format(now, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })`
- Status badge: "Centro de control operacional" (gold, pill)
- Operative status card with pulsing green dot

### 5. Two-column content (LEFT + RIGHT)

**LEFT — Órdenes en proceso** (`app/(dashboard)/dashboard/page.tsx`)
- List of up to 10 active orders with: status dot, code (mono), title, client, due date (red if delayed), progress bar
- Staggered `list-item` animation
- `detenida` orders highlighted with `border-fire/30 bg-fire/5`
- Badge showing total count

**RIGHT — Próximos vencimientos HSEQ**
- Up to 10 HSEQ records with status, description, due date, responsible
- `hseq-alert-vencido` CSS class triggers `hseq-alert-pulse` animation for vencidos
- Count badge (fire variant) if alerts > 0

### 6. Bottom row: Gantt resumido | Alertas | Actividad

**Mini Gantt** (`components/dashboard/MiniGantt.tsx`)
- `"use client"` — uses `date-fns` for date math
- 30-day sliding window (7 days past → 30 days future)
- Color-coded bars by priority (crítica=fire-bright, alta=fire, media=gold, baja=gray)
- Progress fill overlay on each bar
- Today line (gold dashed vertical)
- Tooltip on hover showing title + progress %
- Legend with priority colors

**Alertas panel**
- Compact list of 5 most urgent HSEQ records
- `AlertTriangle` icon (fire-bright) for vencidos, `Clock` (gold) for otros
- `hseq-alert-vencido` pulse on vencidos
- Badge count in header

**Actividad reciente**
- Last 8 updated orders
- Status dot, code, title, client, status badge
- Staggered `list-item` animation

### 7. Metric card hover

Existing `.metric-card:hover` in `app/globals.css` already implements:
- `transform: translateY(-2px)`
- `border-color: rgba(232,179,58,0.32)` (note: spec said 0.30, CSS uses 0.32 — close enough)

### 8. Pulse animation for HSEQ alerts

Added in `app/globals.css`:

```css
@keyframes hseq-alert-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(149, 10, 16, 0.0), var(--shadow-industrial);
    border-color: rgba(149, 10, 16, 0.35);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(149, 10, 16, 0.12), var(--shadow-industrial-lg);
    border-color: rgba(217, 41, 48, 0.6);
  }
}

.hseq-alert-vencido {
  animation: hseq-alert-pulse 2.4s ease-in-out infinite;
}
```

Applied via `cn("hseq-alert-vencido", ...)` when `isVencido` is true.

---

## Files created

| File | Purpose |
|------|---------|
| `components/dashboard/AnimatedKPIValue.tsx` | Count-up client component (rAF + easeOutExpo) |
| `components/dashboard/TrendBadge.tsx` | Trend badge (+12.4% ↑ / -5.2% ↓) |
| `components/dashboard/KPIStrip.tsx` | 5-card KPI strip (client component) |
| `components/dashboard/MiniGantt.tsx` | Mini Gantt timeline (client component) |

## Files modified

| File | Changes |
|------|---------|
| `app/globals.css` | Added `hseq-alert-pulse` keyframe, `.hseq-alert-vencido`, `.kpi-card-enter`, `.metric-icon-glow` |
| `app/(dashboard)/dashboard/page.tsx` | Full redesign: greeting, KPI strip, 2-col content, bottom row, HSEQ pulse |

## CSS tokens used

- `--gold` → `#E8B33A`
- `--fire` → `#950A10`
- `--fire-bright` → `#D92930`
- `--surface-glass` → `rgba(22,22,63,0.72)`
- `--navy-dark` → `#0E0E2A`
- `--navy-light` → `#1C244B`
- `--steel` → `#C8D5DC`
- `--white` → `#FFFFFF`

## Design tokens referenced

- `font-heading` (Montserrat 700)
- `surface-glass` (glassmorphism card)
- `.metric-card` (hover lift)
- `.list-item` (stagger fade-in)
- `shadow-industrial` / `shadow-industrial-lg`
- `ease-industrial` / `ease-spring-subtle`

---

## Verification

```bash
npm run typecheck  # ✓ exit 0
npm run lint       # ✓ exit 0 (--max-warnings=0)
```
