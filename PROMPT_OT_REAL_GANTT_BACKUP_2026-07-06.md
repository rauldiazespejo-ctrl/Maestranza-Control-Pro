# Prompt ejecutado: OT real, carta Gantt y respaldo

Actua como ingeniero senior de producto para ForgeOps, aplicando criterio operacional de maestranza, fabricacion, soldadura, QA/QC, HSEQ e ingenieria.

## Contexto
- El archivo real `REG-M2-006-CORP ACTIVACION DE ORDEN TRABAJO 2026.xlsx` contiene una activacion de OT con cliente, numero de OT, HH proyectadas, solicitante, planta, fechas, proyecto, material y procesos de fabricacion e ingenieria.
- La OT real usada como referencia incluye: cliente NORACID, OT 2116, 450 HH proyectadas, fecha inicio 2026-04-22, fecha entrega 2026-05-14, proyecto `Fabricacion SERPENTIN DE CALEFACCION`, material `AC carbono`.
- La app debe permitir que una OT tenga supervisor, trabajadores asignados y carta Gantt operacional.

## Objetivo
Implementar una mejora que permita generar una carta Gantt desde una OT usando procesos reales de fabricacion e ingenieria, sin duplicar tareas si se ejecuta dos veces, y respaldar los avances en Git local y GitHub.

## Requisitos funcionales
1. Crear un catalogo reusable de procesos basado en la OT real:
   - Detallamiento tecnico.
   - Ingenieria de diseno y fabricacion.
   - Preparacion de material.
   - Ensamble.
   - Soldadura.
   - Acabado superficial.
   - QA/QC.
   - Preparacion para despacho.
2. Agregar una accion de servidor para generar tareas Gantt desde una OT.
3. Si la OT no tiene proyecto asociado, crear uno automaticamente y vincularlo.
4. Usar fechas de inicio y entrega de la OT para calendarizar los procesos.
5. Registrar auditoria de generacion.
6. Agregar boton en detalle de OT para generar carta Gantt.
7. Agregar panel en Carta Gantt para seleccionar una OT y generar procesos.
8. Verificar con typecheck, lint, tests, build y prueba productiva.
9. Respaldar todo con commit local y push a GitHub.

## Criterios de aceptacion
- La app compila sin errores.
- El Gantt puede generarse desde OT y desde la vista Gantt.
- La generacion es idempotente: no duplica tareas existentes.
- La UI muestra mensaje claro de tareas creadas u omitidas.
- El respaldo local y remoto queda trazable con hash de commit.
