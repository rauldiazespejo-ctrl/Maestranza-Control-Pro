# Atoms Implementados — MAESTRANZA Control Pro

> Fecha: 2026-06-24 · Auditoría ISO 45001 + D.S. 44 Chile

---

## Resumen

Sistema de diseño atómico implementado siguiendo `docs/DESIGN_PROMPT.md`. Solo se modificaron estilos y componentes de UI — ninguna lógica de negocio alterada. Todos los tokens usan la paleta existente (`--fire`, `--gold`, `--steel`, `--navy-dark`, etc.).

---

## 1. `app/globals.css` — Tokens del sistema

### Fluid Typography Scale (`clamp()`)

| Token | clamp() | Uso |
|---|---|---|
| `--text-xs` | `clamp(0.7rem, 0.65rem + 0.25vw, 0.8rem)` | Labels tiny |
| `--text-sm` | `clamp(0.8rem, 0.75rem + 0.25vw, 0.875rem)` | Metadata |
| `--text-base` | `clamp(0.9rem, 0.8rem + 0.5vw, 1rem)` | Cuerpo |
| `--text-lg` | `clamp(1.1rem, 1rem + 0.5vw, 1.25rem)` | Subtítulos |
| `--text-xl` | `clamp(1.4rem, 1.2rem + 1vw, 1.75rem)` | Títulos sección |
| `--text-2xl` | `clamp(1.8rem, 1.5rem + 1.5vw, 2.5rem)` | Títulos página |
| `--text-3xl` | `clamp(2.4rem, 2rem + 2vw, 3.5rem)` | Hero metrics |

### Spacing Scale (múltiplos de 4px)

| Token | Valor |
|---|---|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-10` | `40px` |
| `--space-12` | `48px` |
| `--space-16` | `64px` |

### Shadow Tokens (industriales)

| Token | Descripción |
|---|---|
| `--shadow-card` | Cards base — `0 10px 28px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04)` |
| `--shadow-card-lg` | Cards hover/elevadas — `0 18px 48px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)` |
| `--shadow-focus` / `--shadow-focus-gold` | Focus ring gold — `0 0 0 4px rgba(232,179,58,0.18)` |
| `--shadow-btn-fire` | Botón fire — `0 4px 12px rgba(149,10,16,0.35)` |
| `--shadow-btn-fire-hover` | Botón fire hover — `0 4px 16px rgba(149,10,16,0.45)` |

### Color Tokens adicionales

| Token | Valor |
|---|---|
| `--color-fire-muted` | `rgba(149,10,16,0.18)` |
| `--color-gold-muted` | `rgba(232,179,58,0.18)` |
| `--color-border-fire` | `rgba(149,10,16,0.42)` |
| `--color-border-gold` | `rgba(232,179,58,0.42)` |

### Animaciones (keyframes)

| Nombre | Definición |
|---|---|
| `shimmer` | Skeleton shimmer — `background-position -200% → 200%`, 1.5s infinite |
| `pulse-dot` | Dot de estado — `opacity 1→0.4, scale 1→0.75`, 2s infinite |
| `progress-fire` | Barra de progreso — `width 0% → fill`, 600ms ease-out |
| `pageEnter` | Entrada de página — `opacity 0+translateY(8px) → opacity 1+translateY(0)` |

### `.skeleton` utility

```css
.skeleton {
  background: linear-gradient(90deg, var(--color-navy-dark) 0%, var(--color-navy-light) 50%, var(--color-navy-dark) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### Stagger list animation

`.list-item` con `animation-delay: 0ms … 450ms` (10 items máximo) usando `pageEnter`.

### `prefers-reduced-motion`

Cubre **todas** las animaciones. En `reduce`:
- `animation-duration: 0.01ms`, `transition-duration: 0.01ms`
- `.skeleton { animation: none; background-position: 0 0; }`

---

## 2. `components/ui/button.tsx` — Botones

### Variantes (sin cambios en lógica)

| Variante | Estilo |
|---|---|
| `default` | fire bg + `--shadow-btn-fire`, hover `--shadow-btn-fire-hover` |
| `secondary` | navy-light/85 bg + border-subtle |
| `outline` | border-subtle bg transparente |
| `ghost` | bg transparente, text steel |
| `destructive` | fire-bright bg |
| `accent` | gold bg text navy-dark |

### Interacciones implementadas

| Estado | Implementación |
|---|---|
| **Hover** | `scale(1.02)` — `hover:enabled:scale-[1.02]` |
| **Active** | `scale(0.98)` — `active:enabled:scale-[0.98]` |
| **Disabled** | `opacity-50` + `pointer-events-none` — `disabled:opacity-50 disabled:pointer-events-none` |
| **Loading** | Nuevo prop `loading?: boolean`. Muestra `<Loader2 className="h-4 w-4 animate-spin text-gold" />` + `aria-busy`. Deshabilita interacción. |
| **Focus** | `focus-visible:ring-2 focus-visible:ring-gold` (inheritado) |

### Props añadidas

```tsx
loading?: boolean  // default: undefined
```

---

## 3. `components/ui/input.tsx` — Inputs

### Estado Focus (ya implementado — sin cambios)

| Aspecto | Valor |
|---|---|
| Border focus | `border-gold` |
| Ring focus | `focus-visible:ring-2 focus-visible:ring-gold` |
| Shadow focus | `focus-visible:ring-offset-navy-dark` |

El `focus-visible:ring-gold` proporciona el efecto visual equivalente al `--shadow-focus` token.

---

## 4. `components/ui/badge.tsx` — Badges y Status Chips

### Variantes existentes (preservadas)

`default`, `secondary`, `outline`, `fire`, `gold`, `success`, `destructive`, `hseq-abierto`, `hseq-en-revision`, `hseq-cerrado`, `hseq-vencido`

### Nuevas variantes de estado de orden

| Variante | Border | Background | Text | Dot | Extra |
|---|---|---|---|---|---|
| `nueva` | `--border-fire` | `fire-muted` | `fire-bright` | fire | — |
| `planificada` | `--border-gold` | `gold-muted` | gold | gold | — |
| `en_proceso` | steel/50% | navy-light | steel | steel | `animate-[pulse-dot_2s_ease-in-out_infinite]` |
| `detenida` | fire/50% | `fire-muted` | fire | fire | — |
| `revision` | gold/50% | `gold-muted` | gold | gold | — |
| `completada` | steel/40% | navy-light | steel | steel/60% | `<CheckCircle className="h-3 w-3" />` |
| `cerrada` | `border-subtle` | navy-light/40 | steel/60% | steel/40% | — |

### Nuevas variantes de prioridad

| Variante | Border | Background | Text | Dot | Extra |
|---|---|---|---|---|---|
| `critica` | fire | fire | white | white | `shadow-[0_0_12px_rgba(149,10,16,0.55)]` glow |
| `alta` | fire | `fire-muted` | `fire-bright` | fire | — |
| `media` | `--border-gold` | `gold-muted` | gold | gold | — |
| `baja` | `border-subtle` | navy-light | steel | steel | — |

### Estructura del dot

```tsx
{["nueva", "planificada", "en_proceso", ...].includes(variant) && (
  <span className="badge-dot inline-block h-1.5 w-1.5 rounded-full" />
)}
```

El selector `[&_.badge-dot]` aplica color y animación directamente desde el token del variante.

---

## 5. `components/ui/progress.tsx` — Progress Bar (NUEVO)

### Componente creado

```tsx
interface ProgressBarProps {
  value: number;        // 0–100
  label?: string;       // Texto opcional al lado
  shimmer?: boolean;    // Sweep shimmer animado
  className?: string;
}
```

### Implementación

| Aspecto | Detalle |
|---|---|
| Track | `bg-navy-dark`, `h-1.5`, `rounded-full` |
| Fill | `bg-gradient-to-r from-fire to-fire-bright`, `transition-[width] duration-500 ease-out` |
| Shimmer (opcional) | Div interno con `animate-[shimmer_1.8s_ease-in-out_infinite]` |
| Accesibilidad | `role="progressbar"`, `aria-valuenow`, `aria-label` |

---

## 6. `components/ui/card.tsx` — Cards

### Cambios aplicados

| Aspecto | Antes | Después |
|---|---|---|
| Hover lift | No | `hover:-translate-y-0.5` |
| Hover border | No | `hover:border-[rgba(232,179,58,0.30)]` |
| Hover shadow | No | `hover:shadow-[var(--shadow-card-lg)]` |
| Surface | `surface-glass` (blur 16px) | Sin cambios — `surface-glass` ya tiene `backdrop-filter: blur(16px)` |
| Transition | `transition-[...]` | `transition-all duration-200` |

---

## 7. Verificación

### typecheck
```bash
npx tsc --noEmit --skipLibCheck  # ✓ Sin errores
```

### lint
```bash
npx eslint components/ui/button.tsx components/ui/badge.tsx components/ui/card.tsx components/ui/progress.tsx --max-warnings=0  # ✓ Sin errores
```

---

## 8. Notas de implementación

- **No se tocó lógica de negocio** — solo estilos, props y nuevos componentes atómicos.
- **Tokens existentes** usados en todo momento: `--fire`, `--fire-muted`, `--gold`, `--gold-muted`, `--steel`, `--navy-dark`, `--navy-light`, `--border-fire`, `--border-gold`, `--shadow-focus`, `--shadow-card-lg`, etc.
- **Tailwind v4 `@theme inline`** — todos los tokens están declarados como variables CSS en el bloque `@theme` y accesibles via `var(--token)`.
- **clsx para concatenación** — usado en todos los componentes para combinación condicional de clases.
- **ARIA** — `aria-busy`, `aria-disabled`, `role="progressbar"`, `aria-valuenow` correctamente implementados.
- **Skeleton** — `.skeleton` utility class lista para usar en cualquier lugar: `<div className="skeleton h-4 w-3/4" />`.
