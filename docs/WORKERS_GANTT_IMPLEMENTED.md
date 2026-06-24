# Workers & Gantt — Implementation Notes

> **Fecha:** 2026-06-24
> **Proyecto:** MAESTRANZA Control Pro
> **Auditoría:** ISO 45001 + D.S. 44 Chile · Teck CDA CDA-BBLL-2026

---

## 1. Resumen de cambios

### Nuevos archivos

| Archivo | Descripción |
|---|---|
| `components/ui/slide-over.tsx` | Componente SlideOver reutilizable — panel lateral deslizante desde la derecha, 480px, backdrop blur, header sticky, cierre por ESC o click |

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `components/trabajadores/TrabajadoresClient.tsx` | Table → Card grid (3/2/1 cols) + worker detail SlideOver |
| `components/gantt/GanttClient.tsx` | Gantt chart modernizado con timeline, bars, tooltips, zoom |

---

## 2. SlideOver Component

**Ubicación:** `components/ui/slide-over.tsx`

```tsx
<SlideOver
  open={isOpen}
  onClose={handleClose}
  title="Título"
  description="Subtítulo"
>
  {children}
</SlideOver>
```

**Características:**
- 480px width, full height
- Slide desde la derecha, 300ms ease
- Backdrop: `bg-black/60 backdrop-blur-sm`
- Header sticky con título + descripción + botón cerrar (X)
- Cierre por: botón X, click fuera, tecla `Escape`
- `role="dialog" aria-modal="true"`
- `z-index: [90 backdrop, 95 panel]`

---

## 3. Trabajadores — Card Grid

### Worker Card (`WorkerCard`)

Cada tarjeta muestra:

```
┌─────────────────────────────────┐
│  [Avatar]  Nombre              │
│  gradient  Cargo               │
│  fire      RUT (mono)    [Badge]│
│                                 │
│  🛡️ Especialidad                │
│  Certificaciones (truncadas)    │
│  📅 Venc. crítico: fecha       │
└─────────────────────────────────┘
```

**Avatar:**
- Iniciales en círculo, 56×56px
- `background: linear-gradient(135deg, #950A10, #D92930)`
- Texto blanco bold

**Grid responsive:**
- `grid-cols-1` mobile
- `grid-cols-2` tablet (sm)
- `grid-cols-3` desktop (lg)

**Hover:**
- `translateY(-2px)`
- `border-color: rgba(232,179,58,0.30)`
- `shadow-industrial-lg`

### Worker Detail SlideOver

Se abre al hacer click en cualquier tarjeta:

**Secciones:**
1. Header con avatar, nombre, posición, RUT, badge estado
2. Contacto (teléfono + email) con iconos gold
3. Datos (especialidad, vencimiento crítico) — grid 2 cols
4. Certificaciones con estado visual:
   - Verde (`text-emerald-400`) → vigentes
   - Amarillo (`text-gold`) → vence en ≤30 días
   - Rojo (`text-fire-bright`) → vencido
5. Asignaciones activas (max 8) + historial (max 5)

---

## 4. Gantt — Timeline Modernizado

### Layout

```
┌──────────┬────────────────────────────────────────────┐
│ TAREA    │ [Mes 1]    [Mes 2]    [Mes 3]    [Hoy]  │
├──────────┼────────────────────────────────────────────┤
│ Task 1   │ ████████████████░░░░░░░░░░░░░░░░░░░░░░░ │
│ Task 2   │ ░░░░░░░░████████████████████████░░░░░░░ │
│ ...      │ ...                                        │
└──────────┴────────────────────────────────────────────┘
```

### Barra de tareas — colores por estado

| Estado | Gradiente |
|---|---|
| Retrasada | `linear-gradient(90deg, #950A10, #D92930)` |
| En progreso | `linear-gradient(90deg, #E8B33A, #F0C860)` |
| Completada | `linear-gradient(90deg, #16a34a, #4ade80)` |
| Pendiente | `linear-gradient(90deg, #C8D5DC, #e2e8ed)` |

**Progreso:** overlay semitransparente blanco sobre la barra, width = `progress%`

### Línea hoy

```css
border-left: 2px dashed #E8B33A;
```

Calculada dinámicamente según la posición de la fecha actual en el rango visible.

### Tooltip en hover

Se muestra al hacer hover sobre cualquier fila. Contenido:
- Nombre de tarea
- Badge de estado
- Proyecto
- Responsable (si existe)
- Fechas de inicio y término
- Avance con barra de progreso
- Barra de progreso visual dentro del tooltip

### Zoom controls

Tres niveles: **Día / Semana / Mes**

- **Día:** cada celda = 1 día, ancho 32px
- **Semana:** cada celda = 1 semana, ancho 100px
- **Mes:** cada celda = 1 mes, ancho 140px

Navegación temporal: ← Anterior, → Siguiente, **Hoy** (resetea a semana actual)

### Leyenda

Barra de colores + "Hoy" en la parte inferior de la tarjeta Gantt.

---

## 5. Decisiones de diseño

### Workers

- **Avatar gradient fire:** requerido por el spec (sección 3.3) — `linear-gradient(135deg, #950A10, #D92930)`
- **RUT en mono:** `font-mono` para datos técnicos/identificadores
- **Certificaciones:** se parsean del string `certifications` (separados por coma). Cada una se muestra con estado visual según `criticalExpires`
- **Sin cambios en lógica de negocio:** no se modificó `lib/actions/workers`, ni el schema Prisma, ni validaciones Zod

### Gantt

- **Prioridad derivada de estado:** como `GanttTask` en Prisma no tiene campo `priority`, los colores se derivan del `status` (ver tabla arriba)
- **`containerWidth` vía ResizeObserver:** para evitar acceder `ref.current` durante render (violación react-hooks), se usa estado + observer
- **Sin dependencias visuales:** no se implementaron líneas de dependencia entre tareas (el spec las menciona pero no estaban en el código original)
- **Scroll horizontal:** `overflow-x-auto` en wrapper, con `min-width` calculada dinámicamente

---

## 6. Verificación

```bash
# Typecheck
node node_modules/.bin/tsc --noEmit   # ✓ PASS

# Lint (--max-warnings=0)
node node_modules/.bin/eslint . --max-warnings=0   # ✓ PASS (sin warnings ni errors en archivos modificados)
```

---

## 7. Tokens CSS utilizados

| Token | Valor | Uso |
|---|---|---|
| `--fire` / `bg-fire` | `#950A10` | Avatar, bars (retrasada) |
| `--fire-bright` | `#D92930` | Errores, badge fire |
| `--gold` | `#E8B33A` | Iconos, border hover, today line, bars (en_progreso) |
| `--steel` | `#C8D5DC` | Texto secundario, metadata |
| `--navy-primary` | `#16163F` | Background cards |
| `--surface-glass` | `rgba(22,22,63,0.72)` | Cards con blur |
| `--border-subtle` | `rgba(200,213,220,0.12)` | Bordes default |
| `shadow-industrial` | CSS custom | Sombras de cards |

---

## 8. Componentes UI utilizados

| Componente | Archivo | Props usadas |
|---|---|---|
| `Badge` | `components/ui/badge.tsx` | variant: default, secondary, fire, gold, success |
| `Card` | `components/ui/card.tsx` | Contenedor base |
| `Button` | `components/ui/button.tsx` | variant: ghost, secondary; sizes: icon |
| `Input` | `components/ui/input.tsx` | text, date, number, email |
| `Select` | `components/ui/select.tsx` | selects del form |
| `Dialog` | `components/ui/dialog.tsx` | Formulario crear/editar |
| `SlideOver` | `components/ui/slide-over.tsx` | **Nuevo** — detalle de trabajador |
| `EmptyState` | `components/ui/EmptyState.tsx` | Estados vacíos |

---

*Documento generado el 2026-06-24 ·raul.diaz@soldesp.cl · HSEC · BOILER COMP S.A. · SOLDESP S.A.*
