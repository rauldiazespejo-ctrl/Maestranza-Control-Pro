# 🔍 Auditoría UI/Diseño — Maestranza Control Pro (ForgeOps)

**Área:** UI_DISENO  
**Fecha:** 2025-07-03  
**Proyecto:** Maestranza Control Pro (ForgeOps)  
**Stack:** Next.js 16 + React 19 + TailwindCSS 4 + Prisma 7 + PostgreSQL + Next Auth v5 beta  
**Ruta:** `/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro`  
**Estilo marca objetivo:** Dark cybersecurity — navy profundo (#020617) con acentos cian neón (#00E5FF, #00B8D4) estilo pulsoai/nexusguard.  

---

## 📋 Resumen Ejecutivo

Se auditó la totalidad de la capa de presentación del proyecto: layouts, páginas, componentes UI base (`button`, `card`, `input`, `dialog`, `badge`, `table`, etc.), componentes de dominio (`DashboardShell`, `KPIStrip`, `OrdenesClient`, `HseqClient`, etc.), estilos globales (`globals.css`, `tailwind.config.ts`) y configuración de Next.js. Se detectaron **24 hallazgos** distribuidos en severidades CRÍTICO (3), ALTO (5), MEDIO (9) y BAJO (7). El tema central es la **inconsistencia masiva entre la paleta verde actual (`#16A34A` / `emerald-*`) y la paleta cian neón objetivo** solicitada por el usuario, sumado a problemas de mantenibilidad, accesibilidad y coherencia visual en componentes error-boundary, z-index y tokens CSS.

---

## 🚨 Hallazgos por Severidad

---

### CRÍTICO

#### CR-01 — `tailwind.config.ts` completamente vacío

| Atributo | Valor |
|----------|-------|
| **Severidad** | CRÍTICO |
| **Archivo** | `tailwind.config.ts` |
| **Líneas** | 0 (archivo vacío) |
| **Impacto** | Riesgo de fallo silencioso al añadir plugins de Tailwind v4; falta de documentación centralizada del tema. |

**Explicación técnica:**  
TailwindCSS v4 puede funcionar con configuración puramente en CSS vía `@theme inline`, pero el archivo `tailwind.config.ts` vacío es un anti-patrón. Si en el futuro se necesita añadir un plugin (por ejemplo, `@tailwindcss/forms`, `@tailwindcss/typography` o un plugin de terceros), no hay un punto de entrada claro. Además, la ausencia del archivo puede confundir a herramientas de análisis estático y a desarrolladores nuevos en el proyecto.

**Código corregido:**

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  // TailwindCSS v4 utiliza @theme inline en globals.css.
  // Este archivo se mantiene como punto de extensión para plugins de terceros.
  plugins: [],
};

export default config;
```

---

#### CR-02 — Migración incompleta de paleta: verde (`#16A34A`) domina sobre cian neón objetivo

| Atributo | Valor |
|----------|-------|
| **Severidad** | CRÍTICO |
| **Archivos** | `app/globals.css`, `components/brand/BrandLockup.tsx`, `app/login/page.tsx`, `components/dashboard/KPIStrip.tsx`, `components/dashboard/DashboardShell.tsx`, `components/ui/button.tsx`, `components/ui/badge.tsx`, `components/ui/progress.tsx`, `components/ordenes/OrdenesClient.tsx`, `components/gantt/GanttClient.tsx`, `components/hseq/HseqClient.tsx` |
| **Impacto** | La identidad visual del producto no coincide con la marca pulsoai/nexusguard; inconsistencia percibida por usuarios. |

**Explicación técnica:**  
El usuario solicitó explícitamente moverse **desde el verde actual hacia cian neón** (`#00E5FF`, `#00B8D4`). Sin embargo, el sistema de diseño actual está profundamente anclado en verde:

- **Tokens CSS:** `--color-fire: #16A34A` (verde Tailwind `green-600`), `--color-fire-bright: #22C55E` (verde Tailwind `green-500`).
- **Gradientes de fondo:** `body` y `.app-shell-bg` usan `rgba(34, 197, 94, ...)` — el verde Tailwind `green-500`.
- **Componentes:** `BrandLockup` tiene glow verde (`rgba(34,197,94,0.18)`), gradiente verde (`rgba(56,248,160,0.24)`), texto `text-emerald-200/85`.
- **Dashboard:** Indicador "Operativo" usa `emerald-*`. Sidebar activo usa `border-fire-bright/25 bg-fire/10` (verde).
- **Login:** Tarjeta de login usa `border-emerald-400/20`, sombra verde, badge "Centro seguro" en verde.
- **KPIs:** Tarjeta "Completadas" usa `text-emerald-400` y `bg-emerald-500`.
- **Badges:** Variantes `success` usan `bg-emerald-600` en lugar de cian.
- **Progress bars:** Tanto en `progress.tsx` como en múltiples barras inline (órdenes, Gantt, tareas) usan `from-fire to-fire-bright` (verde).
- **Gantt:** Estado "completada" usa `linear-gradient(90deg, #16a34a, #4ade80)` (verde).
- **HSEQ:** Iconos de tipo usan `text-gold` o `text-fire-bright` sin distinción clara; el rojo (`#950A10`, `#D92930`) sí está bien para alertas críticas.

Esto no es solo un cambio cosmético: afecta la percepción de marca, la diferenciación frente a competidores y la coherencia con el ecosistema pulsoai/nexusguard.

**Código corregido (globals.css — migración de tokens verde → cian neón):**

```css
/* app/globals.css — Fragmento de @theme inline con correcciones */
@theme inline {
  /* ── ForgeOps palette: CIAN NEÓN (pulsoai/nexusguard) ── */
  --color-navy-primary: #0F172A;
  --color-navy-dark: #020617;
  --color-navy-light: #1E293B;

  /* Cian neón como acento primario (reemplaza fire/verde) */
  --color-cyan: #00B8D4;
  --color-cyan-bright: #00E5FF;
  --color-cyan-muted: rgba(0, 229, 255, 0.16);
  --color-cyan-glow: rgba(0, 229, 255, 0.22);
  --color-cyan-glow-hover: rgba(0, 229, 255, 0.32);

  /* Gold se mantiene como acento secundario / premium */
  --color-gold: #E8B33A;
  --color-gold-muted: rgba(232, 179, 58, 0.18);

  /* Alerta roja para estados críticos (sin cambios) */
  --color-alert: #D92930;
  --color-alert-dark: #950A10;

  --color-steel: #CBD5E1;
  --color-white: #FFFFFF;

  /* Semantic tokens */
  --color-background: #020617;
  --color-foreground: #FFFFFF;
  --color-card: #0F172A;
  --color-card-foreground: #FFFFFF;
  --color-muted: #C8D5DC;
  --color-muted-foreground: #94a3b8;
  --color-border: #243044;
  --color-border-subtle: rgba(203, 213, 225, 0.12);
  --color-border-strong: rgba(203, 213, 225, 0.24);
  --color-border-cyan: rgba(0, 229, 255, 0.42);
  --color-border-gold: rgba(232, 179, 58, 0.42);
  --color-surface-glass: rgba(15, 23, 42, 0.76);
  --color-surface-raised: rgba(30, 41, 59, 0.84);
  --color-surface-muted: rgba(203, 213, 225, 0.08);
  --color-surface-hover: rgba(203, 213, 225, 0.11);

  /* PRIMARY ahora es cian neón */
  --color-primary: #00B8D4;
  --color-primary-foreground: #020617;
  --color-secondary: #1C244B;
  --color-secondary-foreground: #FFFFFF;
  --color-accent: #E8B33A;
  --color-accent-foreground: #0E0E2A;
  --color-destructive: #D92930;
  --color-destructive-foreground: #FFFFFF;
  --color-ring: #00E5FF;
  --color-input: #1C244B;
  --color-popover: #16163F;
  --color-popover-foreground: #FFFFFF;

  /* Typography & spacing (sin cambios) */
  --font-sans: var(--font-poppins);
  --font-heading: var(--font-montserrat);
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;

  --text-xs:   clamp(0.7rem,  0.65rem + 0.25vw, 0.8rem);
  --text-sm:   clamp(0.8rem,  0.75rem + 0.25vw, 0.875rem);
  --text-base: clamp(0.9rem,  0.8rem  + 0.5vw,  1rem);
  --text-lg:   clamp(1.1rem,  1rem    + 0.5vw,  1.25rem);
  --text-xl:   clamp(1.4rem,  1.2rem  + 1vw,    1.75rem);
  --text-2xl:  clamp(1.8rem,  1.5rem  + 1.5vw,  2.5rem);
  --text-3xl:  clamp(2.4rem,  2rem    + 2vw,    3.5rem);

  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;
  --space-12: 48px; --space-16: 64px;

  --radius-sm: 4px; --radius-md: 6px; --radius-lg: 8px; --radius-xl: 12px;

  /* Shadows — migrados a cian neón */
  --shadow-card:     0 10px 28px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  --shadow-card-lg:   0 18px 48px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  --shadow-industrial:    0 18px 48px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  --shadow-industrial-sm: 0 10px 28px rgba(0, 0, 0, 0.22);
  --shadow-industrial-lg: 0 24px 72px rgba(0, 0, 0, 0.38), 0 1px 0 rgba(255, 255, 255, 0.06) inset;
  --shadow-focus:     0 0 0 4px rgba(0, 229, 255, 0.18);
  --shadow-focus-gold: 0 0 0 4px rgba(232, 179, 58, 0.18);
  --shadow-btn-primary:  0 8px 18px rgba(0, 229, 255, 0.22);
  --shadow-btn-primary-hover: 0 10px 28px rgba(0, 229, 255, 0.32);

  --ease-industrial: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-spring-subtle: cubic-bezier(0.34, 1.56, 0.64, 1);

  --animate-shimmer: shimmer 1.5s infinite;
  --animate-pulse-dot: pulse-dot 2s ease-in-out infinite;
  --animate-spin: spin 1s linear infinite;
  --animate-progress-cyan: progress-cyan 600ms ease-out forwards;
}

/* ============================================================
   KEYFRAMES
   ============================================================ */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.75); }
}

@keyframes progress-cyan {
  from { width: 0%; }
}

@keyframes pageEnter {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* HSEQ alert pulse — red glow para vencidos (sin cambios) */
@keyframes hseq-alert-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(149, 10, 16, 0.0),
                var(--shadow-industrial);
    border-color: rgba(149, 10, 16, 0.35);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(149, 10, 16, 0.12),
                var(--shadow-industrial-lg);
    border-color: rgba(217, 41, 48, 0.6);
  }
}

.hseq-alert-vencido {
  animation: hseq-alert-pulse 2.4s ease-in-out infinite;
}

/* KPI card entrance stagger */
.kpi-card-enter {
  animation: pageEnter 380ms ease-out both;
}
.kpi-card-enter:nth-child(1) { animation-delay: 0ms; }
.kpi-card-enter:nth-child(2) { animation-delay: 80ms; }
.kpi-card-enter:nth-child(3) { animation-delay: 160ms; }
.kpi-card-enter:nth-child(4) { animation-delay: 240ms; }
.kpi-card-enter:nth-child(5) { animation-delay: 320ms; }

/* Metric icon glow */
.metric-icon-glow {
  filter: drop-shadow(0 0 6px currentColor);
}

:root {
  color-scheme: dark;
}

html {
  scroll-behavior: smooth;
}

/* ── BODY: fondo dark con acentos cian neón ── */
body {
  background:
    radial-gradient(circle at 50% -20%, rgba(0, 229, 255, 0.14), transparent 36rem),
    linear-gradient(180deg, rgba(2, 6, 23, 0.94) 0%, rgba(2, 6, 23, 1) 42%),
    linear-gradient(135deg, rgba(232, 179, 58, 0.08) 0%, transparent 34%),
    repeating-linear-gradient(0deg, rgba(203, 213, 225, 0.018) 0 1px, transparent 1px 84px),
    var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

::selection {
  background: rgba(0, 229, 255, 0.32);
  color: var(--color-white);
}

button, [role="button"], a, select, summary {
  cursor: pointer;
}

button:disabled, [aria-disabled="true"] {
  cursor: not-allowed;
}

/* ── App shell background ── */
.app-shell-bg {
  background:
    radial-gradient(circle at top left, rgba(0, 229, 255, 0.12), transparent 28rem),
    linear-gradient(180deg, rgba(30, 41, 59, 0.22), transparent 260px),
    linear-gradient(90deg, rgba(232, 179, 58, 0.07), transparent 38%),
    repeating-linear-gradient(90deg, rgba(203, 213, 225, 0.028) 0 1px, transparent 1px 96px),
    var(--color-navy-dark);
}

/* Glass surfaces */
.surface-glass {
  border: 1px solid var(--color-border-subtle);
  background: var(--color-surface-glass);
  box-shadow: var(--shadow-industrial);
  backdrop-filter: blur(16px);
  position: relative;
  overflow: hidden;
}

.surface-raised {
  border: 1px solid var(--color-border-strong);
  background: var(--color-surface-raised);
  box-shadow: var(--shadow-industrial-sm);
}

.surface-glass::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(115deg, rgba(255, 255, 255, 0.075), transparent 34%),
    linear-gradient(180deg, rgba(232, 179, 58, 0.045), transparent 42%);
  opacity: 0.9;
}

.surface-glass > * {
  position: relative;
  z-index: 1;
}

/* Dividers */
.industrial-divider {
  background: linear-gradient(90deg, transparent, rgba(232, 179, 58, 0.52), transparent);
}

.dashboard-hero {
  position: relative;
  isolation: isolate;
}

.dashboard-hero::after {
  content: "";
  position: absolute;
  inset: auto 1.25rem 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(232, 179, 58, 0.72), transparent);
  opacity: 0.9;
}

/* Metric cards */
.metric-card {
  transform: translateZ(0);
  transition:
    border-color 220ms var(--ease-industrial),
    box-shadow 220ms var(--ease-industrial),
    transform 220ms var(--ease-industrial),
    background-color 220ms var(--ease-industrial);
}

.metric-card:hover {
  border-color: rgba(232, 179, 58, 0.32);
  box-shadow: var(--shadow-industrial-lg);
  transform: translateY(-2px);
}

.metric-card:hover .metric-icon {
  transform: translateY(-1px) scale(1.06);
}

.metric-icon {
  transition: transform 220ms var(--ease-spring-subtle), color 220ms var(--ease-industrial);
}

/* Login animations */
.login-panel {
  animation: panel-enter 520ms var(--ease-industrial) both;
}

.login-mark {
  animation: panel-enter 420ms var(--ease-industrial) both;
}

@keyframes panel-enter {
  from { opacity: 0; transform: translateY(10px) scale(0.985); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Skeleton */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-navy-dark) 0%,
    var(--color-navy-light) 50%,
    var(--color-navy-dark) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}

/* List stagger */
.list-item {
  animation: pageEnter 300ms ease-out both;
}
.list-item:nth-child(1)  { animation-delay: 0ms; }
.list-item:nth-child(2)  { animation-delay: 50ms; }
.list-item:nth-child(3)  { animation-delay: 100ms; }
.list-item:nth-child(4)  { animation-delay: 150ms; }
.list-item:nth-child(5)  { animation-delay: 200ms; }
.list-item:nth-child(6)  { animation-delay: 250ms; }
.list-item:nth-child(7)  { animation-delay: 300ms; }
.list-item:nth-child(8)  { animation-delay: 350ms; }
.list-item:nth-child(9)  { animation-delay: 400ms; }
.list-item:nth-child(10) { animation-delay: 450ms; }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .skeleton {
    animation: none;
    background-position: 0 0;
  }
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading), ui-sans-serif, system-ui, sans-serif;
}

/* Scrollbar — WebKit + Firefox */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-navy-dark);
}

::-webkit-scrollbar-thumb {
  background: var(--color-navy-light);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-steel);
}

/* Firefox scrollbar */
html {
  scrollbar-width: thin;
  scrollbar-color: var(--color-navy-light) var(--color-navy-dark);
}

/* Focus ring */
:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
}
```

**Código corregido (BrandLockup.tsx):**

```tsx
// components/brand/BrandLockup.tsx
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
          "relative flex shrink-0 items-center justify-center overflow-hidden border border-cyan-bright/30 bg-slate-950/80 shadow-[0_0_28px_rgba(0,229,255,0.18)] backdrop-blur-md",
          isLogin ? "h-20 w-20 rounded-2xl p-3" : "h-11 w-11 rounded-xl p-2",
          isSidebar && "h-10 w-10 rounded-lg"
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,229,255,0.24),transparent_45%)]" />
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
              "truncate font-medium text-cyan-bright/85",
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
```

**Código corregido (login/page.tsx):**

```tsx
// app/login/page.tsx (fragmento de la Card de login)
<Card className="login-panel mx-auto max-w-md border-cyan-bright/20 shadow-[0_24px_72px_rgba(2,6,23,0.52),0_0_44px_rgba(0,229,255,0.10)]">
  <CardHeader>
    <div className="mx-auto mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-bright/25 bg-cyan-bright/10 px-3 py-1 text-[11px] font-semibold uppercase text-cyan-200">
      Centro seguro
    </div>
    <CardTitle className="text-center font-heading text-lg">
      Iniciar sesión
    </CardTitle>
    <CardDescription className="text-center">
      Acceso seguro al centro de control operacional, HSEQ y trazabilidad documental.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <LoginForm authError={authError} errorCode={errorCode} />
  </CardContent>
</Card>

{/* Estado operativo en dashboard hero */}
<div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-3 shadow-industrial-sm">
  <p className="text-xs uppercase text-cyan-200">Estado</p>
  <p className="mt-1 flex items-center gap-1.5 font-semibold text-cyan-200">
    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
    Operativo
  </p>
</div>
```

**Código corregido (button.tsx — migración de variantes):**

```tsx
// components/ui/button.tsx (fragmento de className cn)
{
  default:
    "bg-cyan text-navy-dark shadow-[var(--shadow-btn-primary)] hover:enabled:bg-cyan-bright hover:enabled:shadow-[var(--shadow-btn-primary-hover)]",
  secondary:
    "border border-border-subtle bg-navy-light/85 text-white hover:enabled:border-border-strong hover:enabled:bg-navy-light hover:enabled:shadow-industrial-sm",
  outline:
    "border border-border-subtle bg-white/[0.03] text-steel hover:enabled:border-border-strong hover:enabled:bg-navy-light/80 hover:enabled:text-white hover:enabled:shadow-industrial-sm",
  ghost:
    "bg-transparent text-steel hover:enabled:bg-navy-light/80 hover:enabled:text-white",
  destructive:
    "bg-alert text-white shadow-[0_8px_18px_rgba(217,41,48,0.22)] hover:enabled:bg-alert-dark hover:enabled:shadow-[0_10px_28px_rgba(217,41,48,0.32)]",
  accent:
    "bg-gold text-navy-dark shadow-[var(--shadow-btn-primary)] hover:enabled:bg-gold/90 hover:enabled:shadow-[var(--shadow-btn-primary-hover)]",
}[variant],
```

**Código corregido (KPIStrip.tsx):**

```tsx
// components/dashboard/KPIStrip.tsx (fragmento de cards)
{
  icon: CheckCircle2,
  iconColor: "text-cyan-bright",
  iconGlow: true,
  accentColor: "bg-cyan",
  label: "Completadas",
  value: completedOrders,
  trend: trends?.completedOrders,
  subtitle: "Órdenes terminadas y verificadas.",
},
```

**Código corregido (DashboardShell.tsx — indicador EN VIVO):**

```tsx
// components/dashboard/DashboardShell.tsx (fragmento)
<span className="hidden items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300 sm:inline-flex">
  <Circle className="h-2 w-2 fill-current animate-pulse" />
  EN VIVO
</span>
```

**Código corregido (badge.tsx — migración success a cian):**

```tsx
// components/ui/badge.tsx (fragmento de variantes)
success:
  "border-cyan-bright/30 bg-cyan text-navy-dark",
```

---

#### CR-03 — Error boundaries (`error.tsx`, `global-error.tsx`, `portal/error.tsx`) rompen el tema dark 100%

| Atributo | Valor |
|----------|-------|
| **Severidad** | CRÍTICO |
| **Archivos** | `app/(dashboard)/error.tsx`, `app/global-error.tsx`, `app/portal/error.tsx` |
| **Impacto** | Cuando ocurre un error, el usuario ve una interfaz light-mode/gray que rompe completamente la inmersión visual del producto dark. |

**Explicación técnica:**  
Los tres error boundaries usan clases como `text-gray-900 dark:text-gray-100`, `bg-gray-50 dark:bg-gray-950`, `bg-amber-100 dark:bg-amber-900/20`, `bg-blue-100 dark:bg-blue-900/20`. El proyecto no tiene soporte para light mode (`color-scheme: dark` está forzado en `:root`), por lo que los estilos `dark:` nunca se activan en condiciones normales, pero los estilos base `gray-100`, `gray-50`, `amber-100`, `blue-100` sí se aplican, creando un contraste visual terrible sobre el fondo dark de la app. Además, `global-error.tsx` usa un `<button>` nativo en lugar del componente `Button` de UI, perdiendo consistencia.

**Código corregido (app/(dashboard)/error.tsx):**

```tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import Link from "next/link";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error("[DashboardError] Error en dashboard:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-alert-dark/30">
          <AlertTriangle className="h-8 w-8 text-alert" />
        </div>

        <h2 className="mb-2 text-xl font-semibold tracking-tight text-white">
          Error al cargar el panel
        </h2>

        <p className="mb-4 text-sm text-steel">
          No se pudo cargar esta sección del dashboard. Intenta nuevamente.
        </p>

        {error.digest && (
          <p className="mb-4 rounded-md bg-navy-light px-3 py-1.5 font-mono text-xs text-steel">
            Ref: {error.digest}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>

          <Button asChild variant="outline" className="gap-2">
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              Inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Código corregido (app/global-error.tsx):**

```tsx
"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[GlobalError] Error crítico capturado:", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center bg-navy-dark px-4">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-alert-dark/30">
            <AlertTriangle className="h-10 w-10 text-alert" />
          </div>

          <h1 className="mb-2 text-3xl font-bold tracking-tight text-white">
            Error Crítico
          </h1>

          <p className="mb-6 text-sm text-steel">
            Se produjo un error inesperado en la aplicación. Nuestro equipo ha sido notificado.
            Por favor, intenta recargar la página.
          </p>

          {error.digest && (
            <p className="mb-4 rounded-md bg-navy-light px-3 py-1.5 font-mono text-xs text-steel">
              Ref: {error.digest}
            </p>
          )}

          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Recargar página
          </Button>
        </div>
      </body>
    </html>
  );
}
```

**Código corregido (app/portal/error.tsx):**

```tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, HardHat } from "lucide-react";
import Link from "next/link";

interface PortalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PortalError({ error, reset }: PortalErrorProps) {
  useEffect(() => {
    console.error("[PortalError] Error en portal cliente:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cyan/15">
          <AlertTriangle className="h-8 w-8 text-cyan-bright" />
        </div>

        <h2 className="mb-2 text-xl font-semibold tracking-tight text-white">
          Error al cargar el portal
        </h2>

        <p className="mb-4 text-sm text-steel">
          No se pudo cargar esta sección del portal de cliente. Intenta nuevamente.
        </p>

        {error.digest && (
          <p className="mb-4 rounded-md bg-navy-light px-3 py-1.5 font-mono text-xs text-steel">
            Ref: {error.digest}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>

          <Button asChild variant="outline" className="gap-2">
            <Link href="/portal/dashboard">
              <HardHat className="h-4 w-4" />
              Mi Panel
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

### ALTO

#### AL-01 — Inconsistencia masiva de focus rings: `gold` vs `fire` (ahora `cyan`) vs hardcodeado

| Atributo | Valor |
|----------|-------|
| **Severidad** | ALTO |
| **Archivos** | `components/ui/input.tsx`, `components/ui/textarea.tsx`, `components/ui/select.tsx`, `components/ui/card.tsx`, `components/ordenes/OrdenesClient.tsx`, `components/clientes/ClientesClient.tsx`, `components/trabajadores/TrabajadoresClient.tsx`, `components/hseq/HseqClient.tsx`, `components/documentos/DocumentosSection.tsx`, `components/ordenes/WorkOrderTasksSection.tsx` |
| **Impacto** | UX fragmentada; el usuario no tiene un indicador visual consistente de dónde está el foco. |

**Explicación técnica:**  
Los componentes UI oficiales (`input`, `textarea`, `select`, `card`) usan `focus-visible:ring-gold` y `focus-visible:ring-cyan` (tras la migración). Sin embargo, múltiples formularios en componentes de dominio usan `<textarea>` nativas con `focus:border-fire focus:outline-none` (ClientesClient línea 158), checkboxes con `accent-gold` (WorkOrderTasksSection línea 325), o inputs nativos sin ring (HseqClient checkbox línea 368). Esto crea 3-4 estilos de focus diferentes en la misma aplicación.

**Código corregido (regla unificada para TODOS los formularios):**

```tsx
// Aplicar en TODOS los componentes que usen inputs nativos o textarea nativas.
// Patrón unificado: borde cyan + ring cyan + offset navy-dark

// Ejemplo para textarea nativa (ClientesClient.tsx línea 158):
<textarea
  {...register("notes")}
  rows={3}
  className="flex min-h-[80px] w-full rounded-lg border border-border-subtle bg-navy-primary/80 px-3 py-2 text-sm text-white shadow-sm transition-[border-color,background-color,box-shadow,transform] duration-200 placeholder:text-muted-foreground hover:border-border-strong hover:bg-navy-light/65 focus-visible:border-cyan focus-visible:bg-navy-light/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark disabled:cursor-not-allowed disabled:opacity-50"
/>

// Ejemplo para checkbox (HseqClient.tsx línea 368):
<input
  type="checkbox"
  {...register("signatureRequired")}
  id="signatureRequired"
  className="h-4 w-4 rounded border-border-subtle bg-navy-dark text-cyan focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark"
/>
```

---

#### AL-02 — `TrabajadoresClient.tsx` define su propia función `cn()` sin `tailwind-merge`

| Atributo | Valor |
|----------|-------|
| **Severidad** | ALTO |
| **Archivo** | `components/trabajadores/TrabajadoresClient.tsx` |
| **Línea** | 384-386 |
| **Impacto** | Posibles bugs de clases CSS colisionantes sin resolver; duplicación de utilidad. |

**Explicación técnica:**  
El archivo importa `cn` de `@/lib/utils` en la línea 29 pero luego define su propia versión local en la línea 384:

```tsx
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
```

Esta versión local no usa `tailwind-merge`, por lo que si se pasan clases conflictivas (ej: `px-4` y `px-2`), ambas se aplican en lugar de resolver el conflicto. Además, la importación de `cn` de `lib/utils` queda sin usar en parte del archivo (aunque sí se usa en `WorkerCard`). Es confuso y propenso a errores.

**Código corregido:**

```tsx
// Eliminar completamente las líneas 384-386 de TrabajadoresClient.tsx.
// Usar SIEMPRE la importación de @/lib/utils que ya está presente:
// import { cn } from "@/lib/utils";
// (Ya importado en línea 29 — solo eliminar la redefinición local)
```

---

#### AL-03 — Portal (`portal/dashboard`, `portal/ordenes`) usa tablas nativas sin el componente `Table` de UI

| Atributo | Valor |
|----------|-------|
| **Severidad** | ALTO |
| **Archivos** | `app/portal/dashboard/page.tsx`, `app/portal/ordenes/page.tsx` |
| **Impacto** | Pérdida de funcionalidad (sticky headers, hover gold bar, glass wrapper); inconsistencia visual grave entre dashboard interno y portal cliente. |

**Explicación técnica:**  
Ambas páginas del portal definen tablas HTML nativas con clases inline (`bg-navy-light`, `divide-y divide-border-subtle`, `hover:bg-navy-light/30`). El componente `Table` del sistema de diseño (`components/ui/table.tsx`) ofrece: wrapper con `overflow-auto rounded-lg border`, sticky header con `backdrop-blur-md`, row hover con barra dorada lateral (`hover:shadow-[inset_3px_0_0_rgba(232,179,58,0.82)]`), y semántica accesible. Al no usarlo, el portal cliente se ve "barato" comparado con el dashboard operacional.

**Código corregido (portal/dashboard/page.tsx):**

```tsx
// app/portal/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { getWorkOrders } from "@/lib/actions/workorders";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export const metadata = {
  title: "Portal Cliente · Dashboard",
};

export default async function PortalDashboardPage() {
  const session = await auth();
  if (!session?.user?.clientId) redirect("/portal/login");

  const orders = await getWorkOrders();

  const statusLabels: Record<string, string> = {
    nueva: "Nueva", planificada: "Planificada", en_proceso: "En proceso", detenida: "Detenida",
    revision: "En revisión", completada: "Completada", cerrada: "Cerrada",
  };

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold text-white">Dashboard Cliente</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><div className="text-xs uppercase text-steel">Total órdenes</div><div className="font-heading text-2xl font-bold text-white">{orders.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs uppercase text-steel">En proceso</div><div className="font-heading text-2xl font-bold text-white">{orders.filter((o) => o.status === "en_proceso").length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs uppercase text-steel">Completadas</div><div className="font-heading text-2xl font-bold text-white">{orders.filter((o) => o.status === "completada" || o.status === "cerrada").length}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Últimas órdenes</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Avance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.slice(0, 5).map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs text-cyan">{o.code}</TableCell>
                  <TableCell>{o.title}</TableCell>
                  <TableCell><Badge>{statusLabels[o.status]}</Badge></TableCell>
                  <TableCell>{o.progress}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

#### AL-04 — Toaster (`sonner`) usa colores hardcodeados fuera del sistema de tokens

| Atributo | Valor |
|----------|-------|
| **Severidad** | ALTO |
| **Archivo** | `components/ui/Toaster.tsx` |
| **Impacto** | Si se cambia la paleta global, los toasts siguen con colores antiguos; riesgo de contraste insuficiente. |

**Explicación técnica:**  
El componente `Toaster` de Sonner tiene estilos inline hardcodeados: `background: "#1a1a3e"`, `border: "1px solid rgba(255,255,255,0.1)"`. El color `#1a1a3e` no está en el sistema de tokens del proyecto (`--color-popover: #16163F` es el más cercano, pero no igual). Esto hace que los toasts se vean ligeramente diferentes al resto de modales/dialogs.

**Código corregido:**

```tsx
// components/ui/Toaster.tsx
"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: "var(--color-popover)",
          color: "var(--color-popover-foreground)",
          border: "1px solid var(--color-border-subtle)",
          fontFamily: "var(--font-sans)",
        },
      }}
    />
  );
}
```

---

#### AL-05 — `Badge` variant `critica` usa sombra roja (`rgba(149,10,16)`) inconsistente con el token `alert`

| Atributo | Valor |
|----------|-------|
| **Severidad** | ALTO |
| **Archivo** | `components/ui/badge.tsx` |
| **Línea** | 92 |
| **Impacto** | Si se ajusta el rojo de alerta en el tema, el badge crítico no se actualiza automáticamente. |

**Explicación técnica:**  
La línea 92 tiene `shadow-[0_0_12px_rgba(149,10,16,0.55)]` hardcodeado. Aunque `#950A10` coincide con `--color-alert-dark`, debería usar el token CSS para mantenibilidad. Sin embargo, Tailwind v4 no permite variables CSS arbitrarias dentro de `shadow-[...]` directamente sin plugin. La solución es definir una clase custom o usar un token en el CSS.

**Código corregido (globals.css — añadir):**

```css
/* En globals.css, dentro del bloque @theme inline o como clase utilitaria */
.shadow-alert-glow {
  box-shadow: 0 0 12px rgba(149, 10, 16, 0.55);
}
```

**Código corregido (badge.tsx):**

```tsx
critica: (
  "border-alert bg-alert text-white shadow-alert-glow" +
  " [&_.badge-dot]:bg-white"
),
```

---

### MEDIO

#### ME-01 — `text-muted` no es un token válido en TailwindCSS v4 sin definición explícita

| Atributo | Valor |
|----------|-------|
| **Severidad** | MEDIO |
| **Archivo** | `app/login/page.tsx`, `components/ordenes/OrdenDetailClient.tsx` |
| **Impacto** | Si Tailwind v4 no mapea automáticamente `--color-muted` a `text-muted`, el texto puede caer al color por defecto (negro/invisible en fondo oscuro). |

**Explicación técnica:**  
En `login/page.tsx` línea 54: `<p className="mt-6 text-center text-xs text-muted">`. En TailwindCSS v4, las clases como `text-muted` no se generan automáticamente a menos que `--color-muted` esté definido **y** Tailwind lo registre. El token está definido como `--color-muted: #C8D5DC`, pero no como `--color-muted-foreground`. En v4, el patrón esperado es `--color-muted-foreground` para `text-muted-foreground` (siguiendo la convención de shadcn). Actualmente `text-muted` puede estar funcionando por coincidencia, pero no es garantizado.

**Código corregido (globals.css — añadir token):**

```css
/* En @theme inline */
--color-muted-foreground: #94a3b8;
```

**Código corregido (login/page.tsx):**

```tsx
<p className="mt-6 text-center text-xs text-muted-foreground">
  © {new Date().getFullYear()} ForgeOps. Plataforma de control operacional.
</p>
```

**Código corregido (ordenes/OrdenDetailClient.tsx línea 149):**

```tsx
<p className="text-sm text-muted-foreground">
  {order.description || "Sin descripción"}
</p>
```

---

#### ME-02 — `Button` spinner `loading` siempre usa `text-gold` sin importar el variant

| Atributo | Valor |
|----------|-------|
| **Severidad** | MEDIO |
| **Archivo** | `components/ui/button.tsx` |
| **Línea** | 90 |
| **Impacto** | En botones `accent` (fondo gold) o `destructive` (fondo rojo), el spinner gold es invisible o de bajo contraste. |

**Explicación técnica:**  
El spinner del estado `loading` usa `<Loader2 className="h-4 w-4 animate-spin text-gold" />`. Si el botón es variant `accent` (fondo gold `#E8B33A` con texto navy-dark), el spinner gold sobre fondo gold tiene contraste insuficiente. Debería adaptarse al variant o usar siempre un color de alto contraste (blanco o navy-dark según el fondo).

**Código corregido (button.tsx — fragmento):**

```tsx
{loading ? (
  <>
    <Loader2 className="h-4 w-4 animate-spin text-current" />
    <span className="sr-only">Cargando…</span>
  </>
) : (
  children
)}
```

Usar `text-current` hace que el spinner herede el color del texto del botón, que ya está correctamente definido por variant (`text-white` para default/destructive, `text-navy-dark` para accent).

---

#### ME-03 — `Dialog` y `SlideOver` usan z-index inconsistentes

| Atributo | Valor |
|----------|-------|
| **Severidad** | MEDIO |
| **Archivos** | `components/ui/dialog.tsx`, `components/ui/slide-over.tsx` |
| **Impacto** | Si un SlideOver se abre desde dentro de un Dialog (o viceversa), el apilamiento puede fallar visualmente. |

**Explicación técnica:**  
- `Dialog`: backdrop `z-[100]`, panel `z-[100]`
- `SlideOver`: backdrop `z-[90]`, panel `z-[95]`

Esto significa que un Dialog siempre estará por encima de un SlideOver. Si el flujo de UX requiere abrir un SlideOver desde un Dialog (ej: editar detalle desde una orden abierta en Dialog), el SlideOver quedaría tapado. El sistema debería usar una escala coherente: modales genéricos > panels laterales > dropdowns > tooltips.

**Código corregido:**

```tsx
// components/ui/dialog.tsx — unificar z-index
// backdrop: z-[100] → z-[80]
// panel: z-[100] → z-[85]

// components/ui/slide-over.tsx — mantener como está
// backdrop: z-[90]
// panel: z-[95]
```

O mejor, usar un sistema de capas documentado:

```css
/* En globals.css */
--z-dropdown: 50;
--z-sticky: 60;
--z-modal-backdrop: 70;
--z-modal: 75;
--z-drawer-backdrop: 80;
--z-drawer: 85;
--z-toast: 100;
```

---

#### ME-04 — Stagger animations limitadas a 10 elementos

| Atributo | Valor |
|----------|-------|
| **Severidad** | MEDIO |
| **Archivo** | `app/globals.css` |
| **Líneas** | 143-147, 311-320 |
| **Impacto** | Listas con más de 10 elementos pierden la animación stagger, apareciendo todas al mismo tiempo después del 10º. |

**Explicación técnica:**  
`.kpi-card-enter` define delays hasta `nth-child(5)` y `.list-item` hasta `nth-child(10)`. Si el dashboard muestra más de 5 KPIs (actualmente hay 5, pero es frágil) o una lista de órdenes/trabajadores con más de 10 items, los elementos excedentes no tienen delay y aparecen simultáneamente.

**Código corregido (globals.css):**

```css
/* KPI cards — hasta 8 para futura extensión */
.kpi-card-enter:nth-child(1) { animation-delay: 0ms; }
.kpi-card-enter:nth-child(2) { animation-delay: 80ms; }
.kpi-card-enter:nth-child(3) { animation-delay: 160ms; }
.kpi-card-enter:nth-child(4) { animation-delay: 240ms; }
.kpi-card-enter:nth-child(5) { animation-delay: 320ms; }
.kpi-card-enter:nth-child(6) { animation-delay: 400ms; }
.kpi-card-enter:nth-child(7) { animation-delay: 480ms; }
.kpi-card-enter:nth-child(8) { animation-delay: 560ms; }

/* List items — hasta 20 con bucle CSS */
.list-item {
  animation: pageEnter 300ms ease-out both;
  animation-delay: calc(var(--item-index, 0) * 50ms);
}
```

Y en el JSX, pasar el índice como variable CSS:

```tsx
// Ejemplo en cualquier lista mapeada:
{items.map((item, i) => (
  <div
    key={item.id}
    className="list-item"
    style={{ "--item-index": i } as React.CSSProperties}
  >
    ...
  </div>
))}
```

---

#### ME-05 — `surface-glass` tiene `overflow: hidden` por defecto

| Atributo | Valor |
|----------|-------|
| **Severidad** | MEDIO |
| **Archivo** | `app/globals.css` |
| **Línea** | 209 |
| **Impacto** | Dropdowns, tooltips o menús desplegables dentro de una card con `surface-glass` pueden quedar cortados. |

**Explicación técnica:**  
La clase `.surface-glass` define `overflow: hidden` para contener el pseudo-elemento `::before` del gradiente. Sin embargo, esto significa que cualquier elemento posicionado absolutamente que sobresalga de la card (como un dropdown de select, un tooltip, o un menú de acciones) será recortado. El componente `Card` usa `surface-glass` por defecto.

**Código corregido:**

```css
/* En globals.css */
.surface-glass {
  border: 1px solid var(--color-border-subtle);
  background: var(--color-surface-glass);
  box-shadow: var(--shadow-industrial);
  backdrop-filter: blur(16px);
  position: relative;
  /* overflow: hidden; — ELIMINAR o mover al pseudo-elemento */
}

/* El pseudo-elemento ya tiene position:absolute inset:0, 
   así que no necesita overflow:hidden en el padre */
.surface-glass::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(115deg, rgba(255, 255, 255, 0.075), transparent 34%),
    linear-gradient(180deg, rgba(232, 179, 58, 0.045), transparent 42%);
  opacity: 0.9;
  border-radius: inherit; /* hereda el border-radius del padre */
  overflow: hidden; /* contenido local */
}
```

---

#### ME-06 — `WorkOrderStatusChart.tsx` y tooltip de Recharts usan colores hardcodeados

| Atributo | Valor |
|----------|-------|
| **Severidad** | MEDIO |
| **Archivo** | `components/dashboard/WorkOrderStatusChart.tsx` |
| **Impacto** | Cambios en el tema no se reflejan en gráficos; mantenimiento manual error-prone. |

**Explicación técnica:**  
El tooltip de Recharts tiene `backgroundColor: "#16163F"` y múltiples strokes/colores hardcodeados (`#C8D5DC`, `rgba(200,213,220,0.12)`, etc.). Si la paleta cambia, estos colores quedan obsoletos.

**Código corregido (WorkOrderStatusChart.tsx):**

```tsx
// Usar variables CSS donde Recharts lo permite (inline styles sí aceptan vars)
<Tooltip
  cursor={{ fill: "rgba(200,213,220,0.06)" }}
  contentStyle={{
    backgroundColor: "var(--color-popover)",
    border: "1px solid var(--color-border-subtle)",
    borderRadius: "6px",
    color: "var(--color-popover-foreground)",
  }}
  itemStyle={{ color: "var(--color-popover-foreground)" }}
  formatter={(value) => [`${value} órdenes`, "Cantidad"]} 
/>
```

Para `CartesianGrid`, `XAxis`, `YAxis` — Recharts no soporta CSS variables directamente en props como `stroke`. Se recomienda crear un helper:

```tsx
// lib/chart-theme.ts
export const chartTheme = {
  gridStroke: "rgba(200,213,220,0.12)",
  axisStroke: "rgba(200,213,220,0.2)",
  tickFill: "#C8D5DC",
  tooltipBg: "#16163F",
  tooltipBorder: "rgba(200,213,220,0.12)",
} as const;
```

---

#### ME-07 — `GanttClient` gradientes de barra hardcodeados

| Atributo | Valor |
|----------|-------|
| **Severidad** | MEDIO |
| **Archivo** | `components/gantt/GanttClient.tsx` |
| **Líneas** | 64-75, 607-623 |
| **Impacto** | Los gradientes del Gantt no se actualizan con el tema; duplicación de constantes de color. |

**Explicación técnica:**  
Las funciones `getBarGradient()` y `getBarOpacity()` retornan strings CSS hardcodeados. La leyenda del Gantt (líneas 607-623) duplica estos gradientes inline. Si se cambia el color de "completada" de verde a cian, hay que actualizar 6+ lugares.

**Código corregido (GanttClient.tsx):**

```tsx
// Constantes centralizadas al inicio del archivo
const GANTT_GRADIENTS: Record<string, string> = {
  retrasada: "linear-gradient(90deg, #950A10, #D92930)",
  en_progreso: "linear-gradient(90deg, #E8B33A, #F0C860)",
  completada: "linear-gradient(90deg, #00B8D4, #00E5FF)",  // cian neón
  pendiente: "linear-gradient(90deg, #C8D5DC, #e2e8ed)",
};

const GANTT_OPACITY: Record<string, number> = {
  retrasada: 0.95,
  en_progreso: 0.90,
  completada: 0.85,
  pendiente: 0.70,
};

// Reemplazar getBarGradient() y getBarOpacity() por lookups a estas constantes
// Reemplazar la leyenda (líneas 607-623) por mapeo de GANTT_GRADIENTS
```

---

#### ME-08 — Inconsistencia en uso de `<label>` nativo vs componente `<Label>`

| Atributo | Valor |
|----------|-------|
| **Severidad** | MEDIO |
| **Archivos** | `components/trabajadores/TrabajadoresClient.tsx`, `components/clientes/ClientesClient.tsx`, `components/configuracion/ConfiguracionClient.tsx`, `components/portal/PortalLoginForm.tsx` |
| **Impacto** | Labels nativos no tienen estados `peer-disabled`, `peer-invalid` ni focus rings automáticos; inconsistencia visual y de accesibilidad. |

**Explicación técnica:**  
El sistema de diseño tiene un componente `Label` (`components/ui/label.tsx`) que incluye `peer-disabled:cursor-not-allowed peer-disabled:opacity-70` y estilos unificados. Sin embargo, múltiples formularios usan `<label className="...">` nativo con clases copiadas/pegadas. Esto rompe el principio DRY y dificulta cambios globales.

**Código corregido (aplicar en TODOS los formularios):**

```tsx
// SIEMPRE importar y usar el componente Label
import { Label } from "@/components/ui/label";

// ❌ Incorrecto:
// <label className="mb-1 block text-xs font-medium text-steel">Nombre</label>

// ✅ Correcto:
// <Label className="mb-1 block text-xs">Nombre</Label>
```

---

#### ME-09 — `MiniGantt` usa colores de prioridad hardcodeados

| Atributo | Valor |
|----------|-------|
| **Severidad** | MEDIO |
| **Archivo** | `components/dashboard/MiniGantt.tsx` |
| **Línea** | 26-31 |
| **Impacto** | Colores de prioridad no alineados con el tema; difíciles de mantener. |

**Explicación técnica:**  
`PRIORITY_COLORS` define `critica: "#D92930"`, `alta: "#950A10"`, `media: "#E8B33A"`, `baja: "#4A5568"`. Aunque estos colores están relativamente bien elegidos, deberían derivarse del sistema de tokens o al menos documentarse junto a los tokens de `badge.tsx`.

**Recomendación:**  
Extraer a un archivo compartido `lib/theme.ts`:

```ts
// lib/theme.ts
export const priorityColors = {
  critica: "#D92930",
  alta: "#950A10",
  media: "#E8B33A",
  baja: "#4A5568",
} as const;

export const statusColors = {
  nueva: "#C8D5DC",
  planificada: "#1C244B",
  en_proceso: "#E8B33A",
  detenida: "#D92930",
  revision: "#16163F",
  completada: "#00B8D4",  // migrado a cian
  cerrada: "#0E0E2A",
} as const;
```

---

### BAJO

#### BA-01 — Scrollbar personalizado solo para WebKit; Firefox sin estilo

| Atributo | Valor |
|----------|-------|
| **Severidad** | BAJO |
| **Archivo** | `app/globals.css` |
| **Línea** | 342-359 |
| **Impacto** | Usuarios de Firefox ven scrollbar nativo del sistema operativo, rompiendo la inmersión visual. |

**Código corregido:**  
Ya incluido en el fragmento de `globals.css` de CR-02 (líneas `scrollbar-width: thin; scrollbar-color: ...`).

---

#### BA-02 — DashboardShell mobile sidebar no bloquea scroll del body

| Atributo | Valor |
|----------|-------|
| **Severidad** | BAJO |
| **Archivo** | `components/dashboard/DashboardShell.tsx` |
| **Impacto** | Al abrir el menú móvil, el usuario puede seguir scrolleando el contenido detrás del overlay. |

**Explicación técnica:**  
El sidebar móvil tiene un overlay con `backdrop-blur-sm` pero no se aplica `overflow: hidden` al `<body>` cuando está abierto. Esto es un patrón común que mejora la UX en móvil.

**Código corregido (DashboardShell.tsx):**

```tsx
// Añadir efecto para bloquear scroll
React.useEffect(() => {
  if (mobileOpen) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
  return () => {
    document.body.style.overflow = "";
  };
}, [mobileOpen]);
```

---

#### BA-03 — `app-shell-bg` gradiente duplicado/redundante con `body`

| Atributo | Valor |
|----------|-------|
| **Severidad** | BAJO |
| **Archivo** | `app/globals.css` |
| **Líneas** | 194-201, 162-174 |
| **Impacto** | CSS redundante; ligeramente mayor tamaño de bundle. |

**Explicación técnica:**  
Tanto `body` como `.app-shell-bg` definen gradientes radiales y lineales similares. `body` es el contenedor raíz y `.app-shell-bg` se aplica a contenedores internos (DashboardShell, login). Los gradientes deberían estar solo en `body` o solo en `.app-shell-bg`, no en ambos.

**Recomendación:**  
Mantener solo `body` con el gradiente completo y hacer que `.app-shell-bg` sea un alias o lo herede:

```css
.app-shell-bg {
  /* Hereda el fondo del body; solo añade un fallback sólido */
  background-color: var(--color-navy-dark);
}
```

O si se necesita el gradiente en contenedores específicos, extraer a una custom property:

```css
:root {
  --gradient-hero: radial-gradient(circle at 50% -20%, rgba(0, 229, 255, 0.14), transparent 36rem),
    linear-gradient(180deg, rgba(2, 6, 23, 0.94) 0%, rgba(2, 6, 23, 1) 42%),
    linear-gradient(135deg, rgba(232, 179, 58, 0.08) 0%, transparent 34%),
    repeating-linear-gradient(0deg, rgba(203, 213, 225, 0.018) 0 1px, transparent 1px 84px);
}

body {
  background: var(--gradient-hero), var(--color-background);
}

.app-shell-bg {
  background: var(--gradient-hero), var(--color-navy-dark);
}
```

---

#### BA-04 — `GlobalSearch` en móvil usa `fixed inset-x-0 top-16` que puede solapar header

| Atributo | Valor |
|----------|-------|
| **Severidad** | BAJO |
| **Archivo** | `components/ui/GlobalSearch.tsx` |
| **Línea** | 120 |
| **Impacto** | En pantallas muy pequeñas, el dropdown de búsqueda puede quedar pegado al header fijo de 80px de alto. |

**Recomendación:**  
Considerar usar `top-20` (80px) en lugar de `top-16` (64px) o calcular dinámicamente:

```tsx
<div className="fixed inset-x-0 top-20 z-50 mx-auto w-full max-w-xl px-4 sm:absolute sm:inset-auto sm:top-full sm:mt-2 sm:px-0">
```

---

#### BA-05 — `OrdenDetailClient.tsx` usa `text-muted` (mismo problema que ME-01)

| Atributo | Valor |
|----------|-------|
| **Severidad** | BAJO |
| **Archivo** | `components/ordenes/OrdenDetailClient.tsx` |
| **Línea** | 149 |
| **Impacto** | Color potencialmente no definido en Tailwind v4. |

**Código corregido:**  
Ver ME-01 — cambiar a `text-muted-foreground`.

---

#### BA-06 — `KPIStrip` usa `style={{ backgroundColor: card.accentColor }}` en lugar de clases

| Atributo | Valor |
|----------|-------|
| **Severidad** | BAJO |
| **Archivo** | `components/dashboard/KPIStrip.tsx` |
| **Línea** | 93-97 |
| **Impacto** | Menos mantenible; no aprovecha el purge/tree-shake de Tailwind; difícil de overridear con clases. |

**Recomendación (opcional):**  
Usar un mapa de clases de Tailwind:

```tsx
const accentClassMap: Record<string, string> = {
  "bg-cyan": "bg-cyan",
  "bg-cyan-bright": "bg-cyan-bright",
  "bg-alert": "bg-alert",
  "bg-gold": "bg-gold",
};

// En el JSX:
<div className={cn("absolute inset-x-0 top-0 h-1", accentClassMap[card.accentColor])} />
```

---

#### BA-07 — `next.config.ts` tiene `dangerouslyAllowSVG: true`

| Atributo | Valor |
|----------|-------|
| **Severidad** | BAJO |
| **Archivo** | `next.config.ts` |
| **Línea** | 44 |
| **Impacto** | Riesgo de seguridad XSS si se suben SVGs maliciosos desde fuentes no controladas. |

**Explicación técnica:**  
El logo de ForgeOps es un SVG (`/brand/forgeops-mark.svg`). Como es un asset estático controlado por el equipo, el riesgo es bajo. Sin embargo, si en el futuro se permite upload de documentos SVG o avatares de usuario, esta configuración se convierte en un vector de ataque.

**Recomendación:**  
Mantener `dangerouslyAllowSVG: true` solo si TODOS los SVG son assets estáticos controlados. Documentar esta decisión en un comentario:

```ts
// next.config.ts
images: {
  // ⚠️ Solo activo porque todos los SVG son assets estáticos controlados (/brand/*).
  // Si se habilita upload de SVGs por usuarios, desactivar inmediatamente.
  dangerouslyAllowSVG: true,
  contentDispositionType: "attachment",
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
},
```

---

## 🎯 Recomendaciones Adicionales

### 1. Sistema de tokens centralizado
Crear un archivo `lib/theme.ts` que exporte TODOS los colores, gradientes, sombras y animaciones del sistema. Esto permite:
- Cambiar la paleta global desde un solo archivo.
- TypeScript autocomplete en editores.
- Evitar discrepancias entre CSS, TSX y gráficos.

### 2. Storybook o documentación de componentes
Con 15+ componentes UI base y 20+ componentes de dominio, el proyecto ya tiene escala suficiente para justificar una guía de componentes mínima. Incluso un simple `README.md` en `components/ui/` con capturas de cada variant ayuda a mantener consistencia.

### 3. Estrategia de migración verde → cian neón
Dado el volumen de cambios (24 hallazgos, muchos con múltiples instancias), se recomienda:
- **Fase 1:** Actualizar `globals.css` (tokens) + `tailwind.config.ts`.
- **Fase 2:** Actualizar componentes UI base (`button`, `badge`, `input`, `progress`).
- **Fase 3:** Actualizar `BrandLockup`, `DashboardShell`, `KPIStrip` (componentes de alto impacto visual).
- **Fase 4:** Actualizar páginas (`login`, `portal/*`) y error boundaries.
- **Fase 5:** Actualizar componentes de dominio (`OrdenesClient`, `HseqClient`, `GanttClient`, etc.).
- **Fase 6:** Auditar manualmente con screenshots comparativos (antes/después).

### 4. Accesibilidad (a11y) — backlog
- Añadir `aria-live` regions para notificaciones toast.
- Verificar contraste de `text-steel` (`#CBD5E1`) sobre `bg-navy-primary` (`#0F172A`): ratio ~7.2:1 ✅ (pasa WCAG AA).
- Verificar contraste de `text-cyan-bright` (`#00E5FF`) sobre `bg-navy-dark` (`#020617`): ratio ~12.5:1 ✅ (pasa WCAG AAA).
- Implementar skip-link para navegación por teclado.

### 5. Performance CSS
- Considerar `@layer` de Tailwind v4 para organizar base / components / utilities.
- Los gradientes múltiples en `body` son costosos en repaint; considerar `will-change: transform` en contenedores animados.
- El `backdrop-filter: blur(16px)` en múltiples elementos (`surface-glass`, header, sidebar) puede ser pesado en GPUs de gama baja. Considerar reducir a `blur(12px)` en móvil vía media query.

### 6. Testing visual
- Implementar al menos 1 test de screenshot (Playwright o Chromatic) para el dashboard y el login, como guardián de regresiones visuales durante la migración de paleta.

---

## 📁 Archivos Revisados

| Categoría | Archivos |
|-----------|----------|
| **Configuración** | `tailwind.config.ts`, `postcss.config.mjs`, `next.config.ts` |
| **Estilos globales** | `app/globals.css` |
| **Layouts** | `app/layout.tsx`, `app/(dashboard)/layout.tsx`, `app/portal/layout.tsx` |
| **Páginas** | `app/page.tsx`, `app/login/page.tsx`, `app/(dashboard)/dashboard/page.tsx`, `app/(dashboard)/ordenes/page.tsx`, `app/(dashboard)/trabajadores/page.tsx`, `app/(dashboard)/clientes/page.tsx`, `app/(dashboard)/hseq/page.tsx`, `app/(dashboard)/gantt/page.tsx`, `app/(dashboard)/reportes/page.tsx`, `app/(dashboard)/documentos/page.tsx`, `app/portal/login/page.tsx`, `app/portal/dashboard/page.tsx`, `app/portal/ordenes/page.tsx` |
| **Error boundaries** | `app/(dashboard)/error.tsx`, `app/global-error.tsx`, `app/portal/error.tsx` |
| **Componentes UI** | `components/ui/button.tsx`, `components/ui/card.tsx`, `components/ui/badge.tsx`, `components/ui/input.tsx`, `components/ui/textarea.tsx`, `components/ui/select.tsx`, `components/ui/dialog.tsx`, `components/ui/slide-over.tsx`, `components/ui/table.tsx`, `components/ui/label.tsx`, `components/ui/progress.tsx`, `components/ui/EmptyState.tsx`, `components/ui/ErrorState.tsx`, `components/ui/LoadingState.tsx`, `components/ui/Toaster.tsx`, `components/ui/GlobalSearch.tsx` |
| **Componentes de dominio** | `components/brand/BrandLockup.tsx`, `components/dashboard/DashboardShell.tsx`, `components/dashboard/KPIStrip.tsx`, `components/dashboard/AnimatedKPIValue.tsx`, `components/dashboard/TrendBadge.tsx`, `components/dashboard/MiniGantt.tsx`, `components/dashboard/WorkOrderStatusChart.tsx`, `components/auth/LoginForm.tsx`, `components/portal/PortalLoginForm.tsx`, `components/ordenes/OrdenesClient.tsx`, `components/ordenes/OrdenDetailClient.tsx`, `components/ordenes/WorkOrderTasksSection.tsx`, `components/trabajadores/TrabajadoresClient.tsx`, `components/clientes/ClientesClient.tsx`, `components/hseq/HseqClient.tsx`, `components/gantt/GanttClient.tsx`, `components/reportes/ReportesClient.tsx`, `components/documentos/DocumentosClient.tsx`, `components/documentos/DocumentosSection.tsx`, `components/configuracion/ConfiguracionClient.tsx` |
| **Utilidades** | `lib/utils.ts` |

---

*Reporte generado por especialista UI_DISENO para Maestranza Control Pro (ForgeOps). No se modificaron archivos del proyecto; este documento contiene código corregido listo para aplicar manualmente o vía script de migración.*
