---
version: final-2026-07-15
name: ForgeOps
description: "Centro de control operacional industrial — oscuro, preciso y sobrio. El sistema prioriza lectura rápida de datos, estados visibles y densidad organizada. Acento dorado único sobre una escala navy de 4 niveles. Inspirado en la economía cromática de Linear y la calma tipográfica de Vercel/Geist."

colors:
  # ── Surface ladder (jerarquía por color, no por sombra) ──
  canvas: "#0A0F1C"
  surface-1: "#0F172A"
  surface-2: "#161F33"
  surface-3: "#1E293B"
  surface-4: "#273244"

  # ── Acento cromático único ──
  gold: "#E8B33A"
  gold-hover: "#F0C25A"
  gold-soft: "rgba(232, 179, 58, 0.12)"
  gold-border: "rgba(232, 179, 58, 0.38)"

  # ── Semánticos ──
  alert: "#E5484D"
  alert-dark: "#C9353B"
  alert-soft: "rgba(229, 72, 77, 0.14)"
  success: "#3DD68C"
  success-soft: "rgba(61, 214, 140, 0.12)"

  # ── Texto ──
  ink: "#FFFFFF"
  ink-muted: "#CBD5E1"
  ink-subtle: "#8B95A7"
  ink-tertiary: "#5F6B7E"

  # ── Bordes ──
  hairline: "rgba(203, 213, 225, 0.08)"
  hairline-strong: "rgba(203, 213, 225, 0.16)"
  hairline-gold: "rgba(232, 179, 58, 0.42)"

  # ── Backward-compat aliases (no romper código existente) ──
  navy-primary: "#0F172A"
  navy-dark: "#0A0F1C"
  navy-light: "#1E293B"
  cyan: "#5F7484"
  cyan-bright: "#9FB0BC"
  steel: "#CBD5E1"
  steel-dark: "#5F7484"
  fire: "#E5484D"
  fire-bright: "#F65A61"
  graphite: "#111827"
  iron: "#273244"
  metal-highlight: "#F8FAFC"
  white: "#FFFFFF"

  # ── Semantic tokens (shadcn-compatible) ──
  background: "#0A0F1C"
  foreground: "#FFFFFF"
  card: "#0F172A"
  card-foreground: "#FFFFFF"
  muted: "#1E293B"
  muted-foreground: "#8B95A7"
  border: "rgba(203, 213, 225, 0.08)"
  border-subtle: "rgba(203, 213, 225, 0.06)"
  border-strong: "rgba(203, 213, 225, 0.16)"
  border-gold: "rgba(232, 179, 58, 0.38)"
  border-cyan: "rgba(159, 176, 188, 0.38)"
  border-fire: "rgba(229, 72, 77, 0.38)"
  surface-glass: "rgba(15, 23, 42, 0.82)"
  surface-raised: "rgba(30, 41, 59, 0.88)"
  surface-muted: "rgba(203, 213, 225, 0.04)"
  surface-hover: "rgba(203, 213, 225, 0.08)"
  primary: "#E8B33A"
  primary-foreground: "#0A0F1C"
  secondary: "#1E293B"
  secondary-foreground: "#FFFFFF"
  accent: "#E8B33A"
  accent-foreground: "#0A0F1C"
  destructive: "#E5484D"
  destructive-foreground: "#FFFFFF"
  ring: "#E8B33A"
  input: "#1E293B"
  popover: "#161F33"
  popover-foreground: "#FFFFFF"
  gold-muted: "rgba(232, 179, 58, 0.18)"
  cyan-muted: "rgba(159, 176, 188, 0.14)"
  cyan-glow: "rgba(159, 176, 188, 0.15)"
  cyan-glow-hover: "rgba(159, 176, 188, 0.22)"
  fire-muted: "rgba(229, 72, 77, 0.16)"
  alert-dark-legacy: "#950A10"

typography:
  display-2xl:
    fontFamily: Montserrat
    fontSize: "2.75rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  display-xl:
    fontFamily: Montserrat
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  display-lg:
    fontFamily: Montserrat
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  display-md:
    fontFamily: Montserrat
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  headline:
    fontFamily: Montserrat
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body-lg:
    fontFamily: Poppins
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0px"
  body-md:
    fontFamily: Poppins
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0px"
  body-sm:
    fontFamily: Poppins
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0px"
  body-xs:
    fontFamily: Poppins
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0px"
  button:
    fontFamily: Poppins
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0px"
  caption:
    fontFamily: Poppins
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.02em"
  eyebrow:
    fontFamily: Poppins
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.06em"
  mono:
    fontFamily: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0px"

rounded:
  none: "0px"
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "9999px"
  full: "9999px"

spacing:
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
  section: "64px"

components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.canvas}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.gold-hover}"
    textColor: "{colors.canvas}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-outline:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
  button-destructive:
    backgroundColor: "{colors.alert-dark}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  card-default:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "20px"
  card-elevated:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "20px"
  card-interactive-hover:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
  text-input:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: "10px 14px"
  text-input-focused:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: "10px 14px"
  badge-default:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  status-badge:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  table-row:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
  table-row-hover:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
  table-header:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink-subtle}"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.none}"
  kpi-card:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "20px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-subtle}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  nav-item-active:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "10px 14px"

---

## Overview

ForgeOps es un centro de control operacional industrial. El sistema prioriza lectura rápida, estados visibles y densidad organizada para turnos largos. La interfaz usa un fondo navy profundo con una **escala de superficies de 4 niveles** (canvas → surface-1 → surface-2 → surface-3 → surface-4) que crea jerarquía visual sin depender de sombras pesadas.

El acento cromático es **dorado (#E8B33A)** — reservado para acciones primarias, navegación activa, foco y énfasis de decisión. No se usa dorado como fondo decorativo. Los estados semánticos (alerta roja, éxito verde) aparecen solo en badges y estados de error, nunca como atmósfera.

La tipografía usa **Montserrat** para títulos con tracking negativo proporcional al tamaño (-0.03em en display grande), y **Poppins** para cuerpo. Los datos numéricos y referencias técnicas usan monoespaciada con `tabular-nums` para evitar saltos visuales.

## Colors

### Paleta de superficies (surface ladder)
- **Canvas (#0A0F1C):** fondo principal — navy más profundo, reduce fatiga visual.
- **Surface-1 (#0F172A):** superficie base para cards, header, sidebar.
- **Surface-2 (#161F33):** superficie elevada para hover, cards destacados, inputs.
- **Surface-3 (#1E293B):** superficie secundaria para tablas, controles.
- **Surface-4 (#273244):** superficie máxima para popovers, dropdowns.

### Acento dorado
- **Gold (#E8B33A):** acciones primarias, navegación activa, foco, KPIs destacados.
- **Gold Hover (#F0C25A):** estado hover de botones primarios.
- **Gold Soft:** fondo sutil para badges dorados (12% opacidad).

### Semánticos
- **Alert (#E5484D):** errores, alertas HSEQ, estados destructivos.
- **Success (#3DD68C):** estados completados, verificaciones positivas.

### Texto
- **Ink (#FFFFFF):** títulos, valores clave, texto principal.
- **Ink Muted (#CBD5E1):** texto secundario de alta legibilidad.
- **Ink Subtle (#8B95A7):** texto terciario, labels, captions.
- **Ink Tertiary (#5F6B7E):** texto deshabilitado, placeholders.

## Typography

La tipografía usa dos voces: **Montserrat** para títulos (peso 600-700, tracking negativo) y **Poppins** para cuerpo (peso 400-600, tracking neutro). El tracking negativo en títulos es proporcional al tamaño: -0.03em en 2.75rem, escalando hasta 0 en body.

Los datos numéricos en KPIs, tablas y métricas usan `font-variant-numeric: tabular-nums` con familia monoespaciada para evitar saltos visuales durante actualizaciones.

El eyebrow (labels en mayúsculas) usa tracking positivo +0.06em — contraste deliberado contra el tracking negativo de los títulos.

## Layout

El shell fijo compacto: header de 64px, sidebar de 256px (desktop), contenedor máximo de 1600px. Ritmo de espaciado base 4px con tokens de 4/8/12/16/24/32/48/64px.

En mobile, la navegación libera espacio vertical con drawer compacto. El contenido no debe competir con texturas de fondo — la grilla sutil se reserva para el canvas, no para superficies elevadas.

## Elevation & Depth

La profundidad se crea con la **surface ladder** (cambio de color), no con sombras pesadas. Las sombras son sutiles y stacked:

| Nivel | Tratamiento | Uso |
|-------|-------------|-----|
| 0 | Canvas plano | Body, hero text |
| 1 | Surface-1 + hairline 1px | Cards por defecto |
| 2 | Surface-2 + hairline-strong | Cards hover, inputs focused |
| 3 | Surface-3 + shadow sutil | Popovers, dropdowns |
| 4 | Surface-4 + shadow stacked | Modals, dialogs |

Las sombras usan offsets pequeños apilados con inset hairline — nunca un solo drop-shadow grande.

## Shapes

| Token | Valor | Uso |
|-------|-------|-----|
| xs (4px) | Chips, status dots |
| sm (6px) | Badges pequeños, tags |
| md (8px) | Botones, inputs |
| lg (12px) | Cards, contenedores |
| xl (16px) | Modals, panels grandes |
| pill | Badges, status pills |

## Components

### Buttons
- **button-primary:** dorado sobre canvas, esquinas 8px, altura mínima 40px. Hover aclara el dorado. Active escala a 0.98.
- **button-secondary:** surface-2 con hairline, texto blanco.
- **button-outline:** transparente con borde sutil, texto muted.
- **button-ghost:** transparente, solo texto, hover muestra surface-2.
- **button-destructive:** alert rojo, texto blanco.

### Cards
- **card-default:** surface-1, hairline 1px, radius 12px. Hover sutil (translateY -2px + border dorado tenue).
- **card-elevated:** surface-2 para cards destacados.

### Inputs
- **text-input:** surface-2, hairline, radius 8px. Focus: border dorado + ring dorado de 4px a 16% opacidad.

### Navigation
- **nav-item:** transparente, texto subtle. Hover: surface-2.
- **nav-item-active:** surface-2 + texto blanco + icono dorado + barra lateral dorada de 3px.

### Tables
- Header sticky con surface-1, eyebrow uppercase.
- Rows alternan canvas/surface-1. Hover: surface-2 + barra dorada izquierda de 3px.

## Do's and Don'ts

### Do
- Usar la surface ladder para jerarquía — canvas → surface-1 → surface-2 → surface-3.
- Reservar dorado para acciones primarias, foco y navegación activa.
- Aplicar tracking negativo en títulos (-0.02em a -0.03em en display).
- Usar tabular-nums + font-mono en datos numéricos y tablas.
- Mantener sombras sutiles y stacked con inset hairline.

### Don'ts
- No usar texturas repeating-linear-gradient en cards o surfaces elevadas.
- No aplicar drop-shadows de más de 24px de blur.
- No introducir un segundo acento cromático (naranja, verde brillante, azul eléctrico).
- No usar dorado como fondo de sección o card completo.
- No escalar títulos con tracking positivo (excepto eyebrow/caption en mayúsculas).
