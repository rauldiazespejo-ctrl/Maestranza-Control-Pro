# Prompt Ejecutable: OT con Supervisor/Dotacion y Configuracion Empresa

Actua como ingeniero senior full-stack para ForgeOps. Trabaja en `/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro`.

## Objetivo
Completar funcionalidades operacionales faltantes:
1. Luego de crear una OT, el usuario debe poder asignar un supervisor y trabajadores a esa OT.
2. En Configuracion, el usuario administrador debe poder modificar los datos de empresa.

## Investigacion funcional esperada
- Una OT debe tener ficha operativa accesible por URL.
- El supervisor de OT debe provenir de trabajadores activos con perfil `supervisor`.
- La cuadrilla debe provenir de trabajadores activos, permanentes o spot.
- La asignacion debe registrar fecha inicio, termino y horas.
- Debe evitar duplicar el mismo trabajador en la misma OT.
- Configuracion debe permitir editar razon social, RUT, direccion, email, telefono y logo.
- Todo cambio sensible debe pasar por server actions con RBAC y auditoria.

## Implementacion
1. Crear ruta `app/(dashboard)/ordenes/[id]/page.tsx`.
2. Usar `OrdenDetailClient` como ficha de OT.
3. Redirigir al detalle al crear una OT nueva.
4. Filtrar responsable/supervisor a `profile=supervisor`.
5. Agregar accion `assignSupervisorToWorkOrder`.
6. Agregar schema/action de empresa `companySchema` y `saveCompany`.
7. Agregar formulario editable en Configuracion.
8. Ejecutar typecheck, lint, tests, build y desplegar si todo pasa.

## Criterios de aceptacion
- `/ordenes/[id]` responde 200 autenticado.
- Crear OT nueva lleva a su ficha.
- Ficha permite guardar supervisor y asignar trabajadores.
- Configuracion permite guardar datos de empresa.
- Health se mantiene verde.
