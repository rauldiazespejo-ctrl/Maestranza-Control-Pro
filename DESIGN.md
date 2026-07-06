# Design System: ForgeOps
**Project ID:** local-maestranza-control-pro

## 1. Visual Theme & Atmosphere
ForgeOps debe sentirse como un centro de control operacional industrial: oscuro, preciso, sobrio y preparado para turnos largos. La interfaz prioriza lectura rapida, estados visibles y densidad organizada. El fondo es navy profundo con una grilla muy sutil; los acentos cian indican interaccion y sistema activo, mientras que el dorado queda reservado para jerarquia secundaria o enfasis premium.

## 2. Color Palette & Roles
- **Navy de Sala de Control (#020617):** fondo principal de la app; reduce fatiga visual y permite que estados y datos resalten.
- **Navy Operacional Elevado (#0F172A):** superficie base para header, sidebar y cards.
- **Slate Tecnico (#1E293B):** superficie secundaria para tablas, usuario, controles y hover.
- **Cian de Sistema Activo (#00B8D4):** acciones primarias y controles interactivos.
- **Cian Brillante de Foco (#00E5FF):** foco accesible, navegacion activa, bordes destacados y glow contenido.
- **Dorado de Prioridad (#E8B33A):** enfasis secundario, informacion de valor y acentos de decision.
- **Rojo Critico (#D92930):** errores, alertas HSEQ y estados destructivos.
- **Acero Legible (#CBD5E1):** texto secundario de alta legibilidad sobre fondos oscuros.
- **Blanco Operativo (#FFFFFF):** titulos, valores clave y texto principal.

## 3. Typography Rules
La tipografia usa una voz SaaS industrial: titulos fuertes con peso 600-700 y cuerpo claro con line-height comodo. Los tamanos deben ser estables por breakpoint y no escalar con el ancho del viewport. Los datos numericos y referencias usan monoespaciada para evitar saltos visuales. El tracking amplio se reserva para etiquetas cortas en mayusculas, nunca para parrafos o botones largos.

## 4. Component Stylings
* **Buttons:** esquinas moderadas de 6px, altura minima tactil de 40-44px, estados hover/active sin mover el layout. La accion primaria usa cian con texto navy; acciones secundarias usan superficies slate con borde visible.
* **Cards/Containers:** paneles glass sobrios con blur moderado, borde fino y elevacion suave. Hover cian sutil solo cuando la tarjeta es interactiva o agrupadora.
* **Inputs/Forms:** fondos navy elevados, borde visible, labels persistentes y focus ring cian de alto contraste.
* **Navigation:** sidebar denso y predecible en desktop; drawer compacto en mobile. El item activo debe combinar borde, fondo, icono y barra lateral, no depender solo del color.
* **Feedback/Error:** estados de error deben explicar causa y recuperacion. Las pantallas de error muestran referencia tecnica, pero el health check debe detectar deriva de esquema antes de que el usuario lo vea.

## 5. Layout Principles
El contenido se organiza en un shell fijo compacto: header de 64px, sidebar de 256px y contenedor maximo de 1600px para tableros densos. La grilla de fondo no debe competir con tablas ni formularios. Mantener ritmo 4/8px, superficies sin cards anidadas innecesarias y botones/iconos con area interactiva suficiente. En mobile, la navegacion debe liberar espacio vertical y evitar que el usuario quede mirando una pantalla vacia con un header dominante.
