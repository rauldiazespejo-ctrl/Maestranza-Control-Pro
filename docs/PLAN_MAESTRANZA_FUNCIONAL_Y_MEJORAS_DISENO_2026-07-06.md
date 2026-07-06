# Plan Integral — Maestranza Control Pro  
**Funcionalidades industriales + AST/PTW + Mejoras de diseño UI**  
Fecha: 2026-07-06

---

## 1) Objetivo ejecutivo

Consolidar en un solo plan:

1. Funcionalidades críticas para una maestranza industrial (Puentes Grúa, Tornería, Plegadoras/Prensas, CNC, soldadura/corte y procesos asociados).  
2. Módulo robusto de **AST** (Análisis Seguro de Trabajo) y **PTW** (Permisos de Trabajo).  
3. Mejoras de diseño ya conversadas para identidad visual:  
   - **Paleta rojo / azul / naranja / blanco**  
   - Eliminación de verde/emerald en UI crítica  
   - Transparencias, glassmorphism, mejor jerarquía visual y consistencia de estados.

---

## 2) Alcance funcional obligatorio (negocio)

## 2.1 Núcleo operacional (OT + planificación)
- Gestión integral de Órdenes de Trabajo (OT): creación, planificación, ejecución, cierre.
- Ruteo por centro de trabajo:
  - Puente grúa / Izaje
  - Tornería
  - Plegadora / Prensa
  - CNC
  - Soldadura y corte
  - Terminaciones / Pintura
  - QA/QC y liberación
- Carta Gantt por proyecto/OT/proceso.
- Trazabilidad de avance por operación, tarea y responsable.

## 2.2 Seguridad HSEQ
- AST obligatorio para tareas críticas.
- PTW tipificados por riesgo.
- Matriz de peligros/riesgos por proceso.
- Registro de incidentes y cuasi-incidentes.
- Acciones correctivas y verificación de cierre.

## 2.3 Equipos y mantenimiento
- Inventario de equipos críticos con estado operativo.
- Checklists de preuso (por tipo de equipo).
- Bloqueo operacional por falla / mantención pendiente.
- Certificaciones (equipo/accesorios) con vigencias y alertas.

## 2.4 Personas y competencias
- Matriz de competencias por rol y máquina.
- Habilitaciones vigentes (operador CNC, operador grúa, rigger, soldador, etc.).
- Asignaciones bloqueadas si no existe habilitación válida.

## 2.5 Calidad y documentación
- Plan de inspección y ensayo.
- Registros dimensionales y de proceso.
- Dossier final de OT: evidencias, certificados, liberaciones.

---

## 3) AST digital — definición funcional completa

## 3.1 Estructura de formulario AST
1. Identificación: OT, área, proceso, equipo, fecha/turno, supervisor.
2. Desglose de tarea (pasos secuenciales).
3. Peligros por paso (mecánico, eléctrico, térmico, químico, ergonómico, caída, atrapamiento, izaje).
4. Evaluación de riesgo inicial (probabilidad × severidad).
5. Controles requeridos (ingeniería, administrativos, EPP).
6. Riesgo residual.
7. Checklist preinicio (charla 5 min, permisos asociados, LOTO si aplica, inspecciones).
8. Firmas y aprobaciones.
9. Revalidación por cambio de condición.

## 3.2 Reglas de negocio AST
- No iniciar OT/tarea crítica sin AST aprobado.
- AST con versionado y trazabilidad de cambios.
- Adjuntos/evidencias obligatorias para tareas de alto riesgo.
- Si cambia condición crítica, AST pasa a “requiere revalidación”.

---

## 4) PTW digital — definición funcional completa

## 4.1 Tipos de permiso requeridos
- Trabajo en caliente.
- Izaje crítico / Puente grúa.
- Trabajo en altura.
- LOTO (energía peligrosa).
- Trabajo eléctrico.
- Intervención de maquinaria.
- Espacio confinado (si aplica).

## 4.2 Campos mínimos PTW
- Tipo de permiso, área, equipo, vigencia.
- AST relacionado (obligatorio).
- Condiciones previas y checklist.
- Aprobadores por rol.
- Estado: borrador → aprobado → activo → suspendido/cerrado.
- Causa de suspensión automática.

## 4.3 Reglas de negocio PTW
- No ejecutar tarea crítica sin PTW válido y vigente.
- Vencimiento automático inhabilita continuidad de tarea.
- Suspensión obligatoria por condición insegura.

---

## 5) Funcionalidades por área técnica

## 5.1 Puente grúa / izaje
- Validación de capacidad equipo vs carga.
- Accesorios certificados vigentes.
- Operador habilitado + rigger asignado.
- Checklist pre-izaje + zona de exclusión.

## 5.2 Tornería
- Setup seguro, sujeción de pieza.
- Parámetros clave y checklist operativo.
- Resguardos y paro de emergencia.
- Registro dimensional por etapa.

## 5.3 Plegadora/Prensa
- Matriz/punzón correctos y tonelaje.
- Control atrapamiento (barrera/enclavamiento).
- LOTO obligatorio para intervención.

## 5.4 CNC
- Gestión y control de versión de programa.
- Simulación y validación previa.
- Interlocks y condiciones de seguridad.
- Trazabilidad: programa + operador + pieza.

## 5.5 Soldadura/Corte
- PTW caliente + control de ignición.
- Ventilación y manejo de gases.
- WPS/PQR, calificación soldador.
- Evidencia de inspección NDT/VT según corresponda.

---

## 6) Mejoras de diseño UI acordadas (incluye lo ya conversado)

## 6.1 Principios visuales
- Paleta principal: **rojo + azul + naranja + blanco**.
- Evitar verde/emerald en estados críticos.
- Contraste AA mínimo en textos.
- Efectos de profundidad sutil:
  - transparencias
  - blur moderado
  - sombras suaves de color semántico.
- Diseño consistente en badges, alerts, cards y estados.

## 6.2 Semántica de color (estándar recomendado)
- **Error/Crítico**: rojo.
- **Info/Confirmación operacional**: azul.
- **Advertencia/Atención**: naranja.
- **Neutro/Contexto**: blanco/gris acero.

## 6.3 Componentes UI impactados
- `components/ui/badge.tsx`
  - estados `success/completada/hseq-cerrado` migrados a azul/neutro.
- `components/dashboard/TrendBadge.tsx`
  - positivos a azul (antes emerald), negativos en rojo.
- `components/dashboard/KPIStrip.tsx`
  - KPI “Completadas” migrado a azul.
- Barrido pendiente/continuo de `emerald/green` en:
  - Gantt
  - Órdenes
  - Trabajadores
  - Mensajes de éxito y leyendas de estado.

## 6.4 Glass/transparencia
- Cards con fondo translúcido + borde tenue + blur liviano.
- Badges de estado con alpha y glow controlado.
- Evitar saturación de sombras para mantener legibilidad.

---

## 7) Arquitectura de datos propuesta (Prisma orientativo)

Entidades nuevas o extendidas:

- `Ast`
  - id, workOrderId, taskRef, area, equipmentId, riskLevel, status, version, createdBy, approvedBy, approvedAt, updatedAt
- `AstStep`
  - id, astId, stepOrder, description
- `AstHazard`
  - id, astStepId, hazardType, initialRisk, controls, residualRisk
- `WorkPermit` (PTW)
  - id, type, workOrderId, astId, area, equipmentId, startAt, endAt, status, approvedBy, suspendedReason
- `PermitChecklistItem`
  - id, permitId, label, required, checked, checkedBy, checkedAt
- `EquipmentCertification`
  - id, equipmentId, certType, validFrom, validTo, status
- `Competency`
  - id, userId/workerId, competencyType, validTo, issuer
- `SafetyAuditLog` (o extensión `AuditLog`)
  - acción HSEQ, metadata estructurada JSON.

---

## 8) Server Actions y validaciones (objetivo técnico)

- Validación estricta con Zod para AST/PTW.
- Reglas de autorización con `requireAuth` + roles.
- Mensajería de error homogénea (evitar errores inconsistentes al usuario).
- `revalidatePath` coherente para vistas afectadas.
- Transacciones en operaciones críticas:
  - aprobar permiso + activar tarea
  - cierre de permiso + cierre de control.
- Auditoría obligatoria por acción sensible.

---

## 9) Flujo end-to-end recomendado (ejecución segura)

1. Crear OT.
2. Definir tareas y riesgos.
3. Generar AST.
4. Generar PTW según tipo de tarea.
5. Validar habilitaciones (persona/equipo/certificados).
6. Aprobar AST/PTW.
7. Habilitar ejecución.
8. Registrar evidencias durante ejecución.
9. Cerrar tareas + cierre de permiso.
10. Cierre OT + dossier.

---

## 10) KPIs (operación + seguridad + diseño/UX)

## 10.1 Operación/HSEQ
- % tareas críticas con AST aprobado antes de iniciar.
- % trabajos críticos con PTW vigente.
- Tasa de incidentes/cuasi-incidentes por área.
- Cumplimiento checklist preuso.
- Vencimientos de certificaciones y habilitaciones.
- OT atrasadas por causa de seguridad/equipo.

## 10.2 UX/consistencia visual
- % componentes críticos alineados a nueva paleta.
- # de apariciones remanentes de `emerald/green`.
- score de contraste y accesibilidad básica en vistas clave.

---

## 11) Backlog priorizado

## Prioridad Alta (inmediata)
1. Completar barrido de color en UI crítica (`emerald/green` → nuevo sistema).
2. Implementar módulos AST/PTW (MVP):
   - formularios
   - estados
   - aprobaciones
   - bloqueo de ejecución sin cumplimiento.
3. Integrar validación de habilitaciones y certificaciones.
4. Estandarizar errores y auditoría en server actions.

## Prioridad Media
5. Checklists específicos por equipo (grúa, CNC, torno, plegadora).
6. Dashboard HSEQ ampliado.
7. Reportes exportables de cumplimiento AST/PTW.

## Prioridad Baja (evolutiva)
8. Analítica predictiva de riesgos.
9. Recomendaciones automáticas por historial de incidentes.
10. Scoring de madurez de seguridad por área.

---

## 12) Criterios de aceptación de implementación

- Ninguna tarea crítica puede iniciar sin AST + PTW válidos (cuando aplique).
- Bloqueos automáticos funcionan para:
  - permiso vencido
  - condición insegura
  - habilitación/certificación no vigente.
- Auditoría completa en operaciones sensibles.
- UI crítica sin dependencias visuales en verde/emerald.
- Diseño consistente en dashboard, gantt, órdenes y trabajadores.
- Lint y typecheck en verde tras cambios.

---

## 13) Resumen ejecutivo final

Este plan integra lo conversado:  
- funcionalidad industrial real de maestranza,  
- seguridad operativa estructurada (AST/PTW),  
- y renovación visual coherente con identidad rojo/azul/naranja/blanco con transparencias.  

Con esto, el sistema queda alineado para operar como plataforma de gestión industrial segura, auditable y visualmente consistente.
