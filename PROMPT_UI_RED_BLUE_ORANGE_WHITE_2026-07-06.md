# Prompt — Red/Blue/Orange/White Visual System (Glass + Transparency)

## Objetivo
Rediseñar visualmente la app para abandonar acentos verdes y adoptar una identidad moderna industrial con:
- **Azul** (primario confiable)
- **Naranja** (acento de energía/acción)
- **Rojo** (alerta/criticidad)
- **Blanco** (legibilidad/contraste)
- **Transparencias, glassmorphism, glow sutil y profundidad por capas**

---

## Dirección visual
1. **Base Dark Técnica**
   - Fondo oscuro con gradientes fríos.
   - Superficies translúcidas con blur.
   - Rejilla sutil y halos luminosos para profundidad.

2. **Jerarquía cromática**
   - Primario: azul eléctrico.
   - Secundario/acento: naranja cálido.
   - Error/criticidad: rojo intenso.
   - Texto principal: blanco.
   - Texto secundario: gris azulado.

3. **Estados UX consistentes**
   - Éxito: azul-naranja positivo (sin verde).
   - Advertencia: naranja.
   - Error: rojo.
   - Neutro: steel/blanco opaco.

4. **Microinteracciones**
   - Hover con elevación + borde glow.
   - Focus ring azul translúcido.
   - Badges con borde + fondo alpha.
   - KPIs con transición suave y brillo puntual.

---

## Tokens recomendados (referenciales)
- Azul: `#2563EB`, `#60A5FA`
- Naranja: `#F97316`, `#FB923C`
- Rojo: `#DC2626`, `#EF4444`
- Blanco: `#FFFFFF`
- Superficies alpha: `rgba(15,23,42,0.72)` / `rgba(30,41,59,0.78)`

---

## Reglas de implementación
- No usar `emerald/green` en componentes de UI final.
- Mantener accesibilidad AA para texto y controles.
- Mantener consistencia entre badges, tablas, cards, toasts y estados.
- Evitar saturación: glow moderado, no “neón excesivo”.

---

## Entregables esperados
1. `globals.css` con tokens y efectos refinados.
2. Componentes clave (`Badge`, `TrendBadge`) alineados a nueva paleta.
3. Reemplazo de clases verdes visibles en secciones críticas.
4. Validación por `typecheck` y `lint`.
