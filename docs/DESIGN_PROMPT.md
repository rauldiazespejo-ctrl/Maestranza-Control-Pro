# MAESTRANZA Control Pro — Design Prompt

> **Prompt de diseño gráfico para UI/UX de la aplicación de gestión industrial HSEC.**
> Contexto: BOILER COMP S.A. · SOLDESP S.A. · Auditoría ISO 45001 + D.S. 44 Chile · Next.js + Tailwind CSS v4 · Dark mode only.

---

## 1. Identidad de marca

### 1.1 Personalidad

**"Precisión industrial con autoridad gerencial."**
No es una app genérica de productividad. Es una herramienta de control HSEC para una maestranza que trabaja con calderas, soldadura de alta presión y auditorías mineras. Debe sentirse: **robusta, confiable, profesional, técnica y moderna**, sin ser fría. Como entrar a una sala de control bien diseñada.

- **Autoritaria** — jerarquía visual clara, datos prominentes, decisiones rápidas
- **Tecnica** — métricas reales, estados claros, auditorías trazables
- **Confiable** — información siempre visible, nunca oculta, feedbacks inmediatos
- **Industrial** — referencias visuales de acero, fuego, caldera, presión

### 1.2 Paleta de color (tokens reales del proyecto)

```css
/* === COLOR SYSTEM === */
--navy-dark:    #0E0E2A;   /* Fondo base, fondo profundo */
--navy-primary: #16163F;   /* Fondo de cards, panel base */
--navy-light:   #1C244B;   /* Cards elevadas, bordes activos */

--fire:         #950A10;   /* Accent primario — fuego, alertas, CTAs */
--fire-bright:  #D92930;   /* Hover state del fire, estados críticos */
--fire-muted:   rgba(149,10,16,0.18); /* Backgrounds de alertas */

--gold:         #E8B33A;   /* Accent secundario — highlights, warnings, progreso */
--gold-muted:   rgba(232,179,58,0.18); /* Background de notificaciones */

--steel:        #C8D5DC;   /* Texto secundario, labels, metadata */
--white:        #FFFFFF;   /* Texto principal sobre dark */

/* === SURFACE TOKENS === */
--surface-glass:  rgba(22,22,63,0.72);   /* Cards con blur — backdrop-filter: blur(16px) */
--surface-raised: rgba(28,36,75,0.82);   /* Cards elevadas sin blur */
--surface-muted:  rgba(200,213,220,0.08); /* Backgrounds sutiles */
--surface-hover:  rgba(200,213,220,0.11); /* Hover state de filas/items */

/* === BORDER TOKENS === */
--border-subtle:  rgba(200,213,220,0.12); /* Borde default de cards */
--border-strong:  rgba(200,213,220,0.22); /* Borde activo, selected */
--border-fire:    rgba(149,10,16,0.42);   /* Borde de alertas fire */
--border-gold:    rgba(232,179,58,0.42);  /* Borde de warnings gold */
```

### 1.3 Tipografía

```css
/* Títulos y headers */
--font-heading: 'Montserrat', ui-sans-serif, system-ui;
font-weight: 700 para h1-h2, 600 para h3-h4, 500 para h5

/* Cuerpo y UI */
--font-sans: 'Poppins', ui-sans-serif, system-ui;
font-weight: 400 regular, 500 medium, 600 semibold

/* Código, RUT, IDs técnicos */
--font-mono: ui-monospace, 'SF Mono', 'Menlo', monospace;
font-weight: 400
```

**Fluid typography scale (clamp):**
```css
--text-xs:   clamp(0.7rem,  0.65rem + 0.25vw, 0.8rem);   /* Labels tiny */
--text-sm:   clamp(0.8rem,  0.75rem + 0.25vw, 0.875rem); /* Metadata */
--text-base: clamp(0.9rem,  0.8rem  + 0.5vw,  1rem);     /* Cuerpo */
--text-lg:   clamp(1.1rem,  1rem    + 0.5vw,  1.25rem);  /* Subtítulos */
--text-xl:   clamp(1.4rem,  1.2rem  + 1vw,    1.75rem);  /* Títulos sección */
--text-2xl:  clamp(1.8rem,  1.5rem  + 1.5vw,  2.5rem);  /* Títulos página */
--text-3xl:  clamp(2.4rem,  2rem    + 2vw,     3.5rem);  /* Hero metrics */
```

### 1.4 Forma y espaciado

```css
/* Border radius — industrial, no redondeado blando */
--radius-sm: 4px;   /* Inputs, small elements */
--radius-md: 6px;   /* Buttons, chips */
--radius-lg: 8px;   /* Cards, panels */
--radius-xl: 12px;  /* Modales, overlays grandes */

/* Spacing scale — basado en múltiplos de 4px */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;

/* Sombras — profundidad industrial */
--shadow-card: 0 10px 28px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04);
--shadow-card-lg: 0 18px 48px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06);
--shadow-focus: 0 0 0 4px rgba(232,179,58,0.18); /* Focus ring gold */
```

---

## 2. Sistema de diseño atómico

### 2.1 Atoms (elementos base)

**Buttons:**
```
Variantes:
- PRIMARY:   bg: fire (#950A10) → hover: fire-bright (#D92930)
             text: white, font-weight: 600, px-6 py-3, radius-md
             transition: scale(1.02) on hover, scale(0.98) on press
             box-shadow: 0 4px 12px rgba(149,10,16,0.35)

- SECONDARY: bg: navy-light (#1C244B), border: border-subtle
             text: white, hover: bg: surface-hover

- GHOST:     bg: transparent, text: steel, hover: bg: surface-muted

- DESTRUCTIVE: bg: fire-bright con glow sutil

- Estados: loading spinner (gold), disabled (opacity-50, cursor-not-allowed)
           disabled NUNCA pierde el estilo visual (solo opacity, sin desaparecer)
```

**Inputs:**
```
Base: bg: navy-dark (#0E0E2A), border: border-subtle, radius-sm
      text: white, placeholder: steel/50%
      focus: border-gold, shadow-focus, sin outline

Padding: px-3 py-2.5 (44px altura total para touch target)
```

**Badges / Status chips:**
```
Estados de orden:
- nueva:      border-fire-subtle, text-fire-bright, dot fire
- planificada: border-gold, text-gold, dot gold
- en_proceso: border-steel, text-steel, dot steel, pulse animation
- detenida:   border-fire/50%, text-fire, dot fire (static)
- revision:    border-gold/50%, text-gold, dot gold
- completada:  border-steel/40%, text-steel, check icon
- cerrada:     border-subtle, text-steel/60%, muted

Prioridad:
- critica: bg-fire con glow
- alta:    border-fire, text-fire
- media:   border-gold, text-gold
- baja:    border-subtle, text-steel
```

**Progress bars:**
```
Track: bg: navy-dark, height: 6px, radius-full
Fill:  gradient fire → fire-bright (horizontal)
       animación: width transition 600ms ease-industrial
       cuando 100%: fill gold por 1s antes de marcar verde
```

### 2.2 Molecules (componentes compuestos)

**Metric Card:**
```
Estructura:
┌─────────────────────────────────┐
│ [Icon]  Título                 │
│          valueGrande            │
│          +12.4% ↑ / subtítulo   │
└─────────────────────────────────┘

bg: surface-glass (blur 16px)
border: 1px border-subtle
border:hover: border-gold/30%
transform: translateY(-2px) on hover
transition: 220ms ease-industrial
shimmer: gradient sutil sobre el fill de barras de progreso
```

**Data Table:**
```
Header: bg: navy-light, text: steel uppercase xs, sticky top
Rows:   border-b border-subtle, hover: bg: surface-hover
Cells:  text: white para contenido, text: steel para metadata
Empty:  EmptyState con icono + mensaje + CTA
Sorting: icono chevron en header, orden asc/desc
Selection: checkbox con accent gold cuando selected
Pagination: bottom-fixed, "Mostrando 1-15 de 47"
```

**Slide-over / Drawer:**
```
Width: 480px (mobile: full)
Entry: slide from right, 300ms ease-industrial
bg: surface-glass con blur en backdrop
Header sticky con título + close button
```

**Modal:**
```
Centered, max-width según contenido
bg: surface-raised
Border: border-subtle, radius-xl
Backdrop: bg: navy-dark/80% con blur(8px)
Entry: scale(0.95)→scale(1) + opacity, 250ms
Escape key + click outside para cerrar
```

**Toast / Notification:**
```
Posición: bottom-right, stack vertical
Types: success (gold), error (fire), info (steel), warning (gold)
Entry: slide from right + fade
Auto-dismiss: 5s, hover pausa timer
Max visible: 3, resto en cola
```

### 2.3 Organisms (módulos completos)

**Sidebar Navigation:**
```
Width: 260px collapsed: 64px (icon-only)
bg: surface-raised, border-right: border-subtle
Logo area: 60px altura, logo BOILER COMP
Nav items: icon (gold) + label, active: bg: surface-hover + border-left fire
Hover: bg: surface-muted
Sections: divididas por módulo (Operaciones / HSEQ / Config)
Collapse button: bottom-fixed, chevron
```

**Dashboard Hero / KPI Strip:**
```
Full-width, gradient top sutil fire
4-5 metric cards en row (responsive: 2 en tablet, 1 en mobile)
Valor principal: text-3xl font-heading bold white
Label: text-sm steel
Trend badge: +/-% con flecha + color

KPI cards deben tener:
- Icon contextual en círculo con glow sutil
- Progress bar integrada (ej: OT completadas / total)
- Tooltip en hover con más detalle
```

**Gantt Chart:**
```
Timeline header: sticky, meses/semanas
Barras: bg: gradient fire o gold según prioridad
Hover: tooltip con detalles de la tarea
Dependencies: líneas conectoras steel/40%
Today line: línea vertical gold punteada
Scroll horizontal en container overflow-x-auto
```

---

## 3. Módulos — Guía de diseño por página

### 3.1 Dashboard principal

```
Layout:
┌─────────┬──────────────────────────────────────────┐
│         │ [Greeting] "Buenos días, [nombre]"  fecha │
│ Sidebar │ ───────────────────────────────────────── │
│         │ [KPI Strip] 5 metric cards              │
│         │ ───────────────────────────────────────── │
│         │ [Contenido 2-col]                        │
│         │  Left: Órdenes en proceso (listado)     │
│         │  Right: Próximos vencimientos HSEQ       │
│         │ ───────────────────────────────────────── │
│         │ [Bottom row]                             │
│         │  Gantt resumido | Alertas | Actividad   │
└─────────┴──────────────────────────────────────────┘

Micro-interactions:
- KPI cards: count-up animation on load (números suben desde 0)
- Lista de órdenes: staggered fade-in, 50ms delay por item
- Alertas: pulse animation sutil en el borde cuando hay vencidos
```

### 3.2 Órdenes de trabajo

```
Page header: título + filtros (estado, prioridad, cliente, fechas)
Toolbar: [Nueva OT] PRIMARY button + search + filtros activos como chips

Listado:
- Tabla responsive: código, título, cliente, estado, prioridad,
  responsable(s), fechas, progreso
- Múltiples responsables: avatar stack (max 3 + "+N")
- Estado con color badge
- Fila clickeable → abre detalle
- Empty state: "Sin órdenes que coincidan con los filtros"

Detalle de OT (slide-over o página):
- Header con código + título + badges
- Info grid: cliente, proyecto, fechas, costos
- Tabs: [Dotación] [Tareas] [Documentos] [HSEQ] [Auditoría]
- Dotación: tabla con trabajadores asignados + botón "Agregar"
  MÚLTIPLES trabajadores por OT — mostrar todos como lista
  Botón "+ Asignar trabajador" abre modal con select
- Tareas: checklist con progress bar
- Documentos: grid de thumbnails + upload zone
- HSEQ: registros asociados
- Auditoría: timeline de cambios
```

### 3.3 Trabajadores

```
Page header + [Nuevo trabajador] + búsqueda

Cards en grid (3 cols desktop, 2 tablet, 1 mobile):
- Avatar: iniciales en círculo con gradiente fire
- Nombre + cargo
- RUT en mono
- Especialidad + certificaciones
- Estado: badge (activo/inactivo)
- Hover: lift effect + border gold

Detalle:
- Info personal + contacto
- Historial de asignaciones a OT
- Certificaciones con fechas de vencimiento
- Alertas si certificación próxima a vencer
```

### 3.4 HSEQ (lo más crítico visualmente)

```
Dashboard HSEQ con priorización por urgencia:

┌─────────────────────────────────────────────────────┐
│ [Título] Registros HSEQ         [Nuevo registro]   │
│                                                     │
│ [Filtros] Tipo | Norma | Estado | Responsable      │
│                                                     │
│ [Vencidos] ← ALERTA CRÍTICA                        │
│ ┌─────────────────────────────────────────────────┐│
│ │ ⚠️ [ MATRIZ_RIESGO · ISO_45001 · VENCIDO ]     ││
│ │ Descripción del registro...                     ││
│ │ Responsable · Venció hace 3 días                ││
│ │ [Acciones rápidas: Ver, Cerrar]                  ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ [Abiertos]                                          │
│ [En revisión]                                       │
│ [Cerrados recientemente]                            │
└─────────────────────────────────────────────────────┘

Estados HSEQ con colores:
- abierto:  fire, borde fire
- en_revision: gold, borde gold
- cerrado:  steel/50%, check verde
- vencido:  fire-bright, borde fire, glow, animación de alerta

Formulario de registro HSEQ:
- Tipo (select con iconos: inspección, incidente, capacitación...)
- Norma (ISO 45001, ISO 9001, ISO 14001, D.S. 44)
- Descripción (textarea, requerido)
- Responsable (select trabajadores)
- Fecha de registro (default: hoy)
- Fecha de vencimiento
- Archivo adjunto (drag & drop zone)
- Requiere firma (toggle)
```

### 3.5 Clientes

```
Cards de cliente con logo placeholder + datos:
- Nombre, RUT, industria
- Contactos (expandir para ver)
- Órdenes activas count
- Monto total estimado
- Click → detalle con historial de órdenes

Detalle cliente:
- Header con logo + info
- Tabs: [Órdenes] [Proyectos] [Contactos] [Documentos]
```

### 3.6 Gantt

```
Full-width timeline interactivo:
- Zoom: día / semana / mes
- Navegación temporal (prev/next)
- Today highlight
- Bars arrastrables (drag para mover fechas)
- Filtros: proyecto, responsable, estado
- Click en bar → abre detalle de OT
- Tooltips ricos en hover
```

### 3.7 Reportes

```
Filtros: rango de fechas, cliente, módulo
Cards de métricas agregadas (ingresos, OT, HSEQ)
Gráficos:
- Órdenes por estado (donut chart, paleta fire-gold-steel)
- Avance mensual (bar chart con gradiente)
- HSEQ por norma (horizontal bar)
- Líneas de tiempo de OT completadas
Exportar: PDF button (importante para auditoría)
```

### 3.8 Portal Cliente

```
Diseño separado del admin:
- Header minimal con logo cliente
- Vista solo lectura de sus órdenes
- Estados simplificados
- Documentos públicos para descarga
- Mensaje de contacto con área de soporte
```

### 3.9 Login

```
Split layout (desktop):
┌──────────────────────┬──────────────────────────────┐
│ Left panel (40%)     │ Right panel (60%)            │
│ Logo BOILER COMP      │ Login form                   │
│ Tagline:              │ Email + Password             │
│ "Control profesional  │ [Iniciar sesión]             │
│ para maestranzas      │                              │
│ industriales"         │ ¿Olvidaste tu contraseña?    │
│                      │                              │
│ [Gráfico sutil de     │                              │
│ caldera/industria]    │                              │
└──────────────────────┴──────────────────────────────┘

Mobile: logo centered arriba, form centrado

Form:
- Input focus: gold ring
- Button: full width, fire gradient
- Error: mensaje inline en rojo fire
- Loading: spinner en button
```

---

## 4. Animaciones y micro-interacciones

### 4.1 Principio rector

**"Animación con propósito: informar, no entretener."**
En una app industrial de control, las animaciones comunican estado, atención y progreso. No son decorativas.

### 4.2 Transiciones de página

```css
/* Page entry — fade + slide up sutil */
.page-enter {
  animation: pageEnter 300ms ease-out both;
}
@keyframes pageEnter {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Stagger en listas — 50ms por item */
.list-item:nth-child(1) { animation-delay: 0ms; }
.list-item:nth-child(2) { animation-delay: 50ms; }
.list-item:nth-child(3) { animation-delay: 100ms; }
/* ... hasta 10 items máximo stagger */
```

### 4.3 Hover states

```css
/* Cards — lift sutil */
.card:hover {
  transform: translateY(-2px);
  border-color: rgba(232,179,58,0.30);
  box-shadow: 0 18px 48px rgba(0,0,0,0.28);
  transition: all 220ms cubic-bezier(0.2,0.8,0.2,1);
}

/* Buttons — scale + glow */
.btn-primary:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(149,10,16,0.45);
}
.btn-primary:active {
  transform: scale(0.98);
}

/* Links — underline con delay */
.nav-link::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background: gold;
  transition: width 200ms ease;
}
.nav-link:hover::after {
  width: 100%;
}
```

### 4.4 Loading states

```css
/* Skeleton — shimmer de derecha a izquierda */
.skeleton {
  background: linear-gradient(
    90deg,
    navy-dark 0%,
    navy-light 50%,
    navy-dark 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

/* Skeleton de tabla — filas completas con anchos variables */
.skeleton-row:nth-child(1) { width: 60%; }
.skeleton-row:nth-child(2) { width: 80%; }
.skeleton-row:nth-child(3) { width: 45%; }
```

### 4.5 Feedback de acciones

```css
/* Toast entry — slide from right */
.toast-enter {
  animation: toastIn 300ms cubic-bezier(0.34,1.56,0.64,1) both;
}
@keyframes toastIn {
  from { opacity: 0; transform: translateX(100%); }
  to   { opacity: 1; transform: translateX(0); }
}

/* Success — flash gold border */
.success-flash {
  animation: successFlash 600ms ease-out;
}
@keyframes successFlash {
  0%   { border-color: gold; box-shadow: 0 0 20px rgba(232,179,58,0.5); }
  100% { border-color: border-subtle; box-shadow: none; }
}

/* Error shake */
.error-shake {
  animation: shake 400ms ease-out;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-6px); }
  40%       { transform: translateX(6px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}
```

### 4.6 Count-up para métricas

```javascript
// KPI count-up on mount
const duration = 1200;
const start = performance.now();
const end = targetValue;

function tick(now) {
  const elapsed = now - start;
  const progress = Math.min(elapsed / duration, 1);
  // easeOutExpo
  const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
  current = Math.round(ease * end);
  // render current
  if (progress < 1) requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
```

### 4.7 Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
  .skeleton { animation: none; }
}
```

---

## 5. Layout y estructura

### 5.1 Grid system

```css
/* App shell */
.app-shell {
  display: grid;
  grid-template-columns: 260px 1fr;  /* Sidebar | Content */
  grid-template-rows: 60px 1fr;       /* Header | Main */
}

/* Sidebar collapsed */
.app-shell.collapsed {
  grid-template-columns: 64px 1fr;
}

/* Responsive */
@media (max-width: 1024px) {
  .app-shell {
    grid-template-columns: 1fr;
  }
  .sidebar {
    transform: translateX(-100%);
    transition: transform 300ms ease;
  }
  .sidebar.open {
    transform: translateX(0);
  }
}

/* Page max-width */
.page-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: var(--space-6);
}

@media (max-width: 640px) {
  .page-container {
    padding: var(--space-4);
  }
}
```

### 5.2 Background pattern

```css
/* Industrial grid pattern — líneas sutiles de fondo */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image:
    repeating-linear-gradient(
      0deg,
      rgba(200,213,220,0.018) 0 1px,
      transparent 1px 84px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(200,213,220,0.014) 0 1px,
      transparent 1px 96px
    );
  pointer-events: none;
  z-index: 0;
}
```

---

## 6. Responsive breakpoints

```css
/* Mobile first */
/* sm:  640px  — large phones */
/* md:  768px  — tablets */
/* lg:  1024px — laptops */
/* xl:  1280px — desktops */
/* 2xl: 1536px — large screens */

.mobile-menu-button: hidden > lg
.sidebar: visible > lg, hidden < lg (hamburger)
metric-cards: 1 col < sm, 2 col < md, 3-4 col > lg
tables: horizontal scroll < md, columns collapse priority
gantt: full-width horizontal scroll
```

---

## 7. Accesibilidad

```css
/* Focus visible — siempre visible */
:focus-visible {
  outline: 2px solid gold;
  outline-offset: 2px;
  border-radius: 2px;
}

/* Color contrast — todos los textos pasan WCAG AA mínimo 4.5:1 */
/* Steel (#C8D5DC) sobre navy-dark (#0E0E2A) = 8.2:1 ✓ */
/* White (#FFFFFF) sobre fire (#950A10) = 5.1:1 ✓ */

/* Screen reader — contenido oculto visualmente pero accesible */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border-width: 0;
}

/* ARIA labels en iconos */
<button aria-label="Cerrar panel">
<nav aria-label="Navegación principal">
<table role="table" aria-label="Órdenes de trabajo">
```

---

## 8. Estados y edge cases

### 8.1 Empty states

Cada módulo debe tener un empty state personalizado:

```
Dashboard vacío: "Sin actividad reciente. Crea tu primera orden de trabajo."
Órdenes vacío:  "No hay órdenes. [Crear primera orden]" + ilustración de caldera
Trabajadores vacío: "Sin trabajadores registrados. [Agregar trabajador]"
HSEQ vacío:     "Sin registros HSEQ. [Crear primer registro]" + icono escudo
```

### 8.2 Loading states

- **Inicial**: skeleton completo de la página
- **Tabla**: skeleton de filas (5-8 rows)
- **Detail**: skeleton de campos de info
- **Nunca spinner de league** — solo skeleton o progress

### 8.3 Error states

- **Form validation**: inline bajo el campo, texto fire, icono X
- **Fetch error**: toast error + retry button
- **404**: página personalizada con navegación
- **403**: "Sin permisos para esta acción" + volver

---

## 9. Iconografía

```css
/* Lucide React — stroke: 1.5px, size: 20px default */
/* Siempre SVG inline — no emoji, no img */

/* Categorías de iconos: */
Engineer: HardHat, Wrench, Settings, Cog
Safety:   Shield, ShieldCheck, AlertTriangle, AlertCircle, Lock
Work:     ClipboardList, ClipboardCheck, FileText, Briefcase
People:   Users, UserCheck, UserPlus, UserCog
Calendar: Calendar, Clock, Timer
Status:   CheckCircle, XCircle, AlertTriangle, PauseCircle
Finance:  DollarSign, TrendingUp, TrendingDown, CreditCard
Navigation: ChevronRight, ChevronDown, ArrowRight, ArrowLeft
```

---

## 10. Checklist pre-lanzamiento de UI

```
□ Todos los botones tienen feedback visual (hover, active, disabled, loading)
□ Todos los formularios tienen validación inline + mensaje de error
□ Todas las tablas tienen empty state
□ Todos los estados de loading tienen skeleton
□ Responsive: funciona en 375px, 768px, 1024px, 1440px
□ Color contrast: todos los textos pasan WCAG AA
□ Focus visible: tab navigation funciona en toda la app
□ Reduced motion: respetado si el usuario lo prefiere
□ Dark mode: 100% dark — ningún texto claro sobre fondo claro
□ Tasa de frames: 60fps en scroll y animaciones
□ Touch targets: mínimo 44x44px en móvil
□ Skeleton loading: sin layout shift (CLS < 0.1)
□ Errores: todos capturados y mostrados al usuario, no console.error
□ Navegación: breadcrumb donde la profundidad > 2 niveles
□ Tooltips: en iconos, badges, métricas abreviadas
□ Portales: sidebar diferente del admin (minimal, solo lectura)
```
