# Prompt Corregido Ejecutado

Actua como ingeniero senior full-stack y lider UI/UX para ForgeOps. Trabaja en `/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro`.

## Objetivo
Identificar causas raiz de las fallas visibles en produccion, corregirlas sin introducir regresiones, mejorar de forma importante el diseno de la app y desplegar/verificar el resultado.

## Evidencia inicial
- Capturas muestran `Error al cargar el panel` en `/ordenes`, `/trabajadores` y `/hseq`.
- Produccion: `https://maestranza-control-pro.vercel.app`.
- Usuario autenticado: Raul Andres Diaz espejo, rol `ADMIN`.

## Plan ejecutable
1. Revisar logs reales de Vercel para obtener errores del servidor y digest asociados.
2. Cruzar logs contra `schema.prisma`, migraciones y consultas Prisma.
3. Corregir la causa raiz en migraciones, no ocultar el error en UI.
4. Endurecer `/api/health` para detectar deriva de esquema critica.
5. Revisar riesgos de conexion serverless y ajustar pool PostgreSQL.
6. Aplicar mejora UI/UX compartida siguiendo `ui-ux-pro-max`: accesibilidad, navegacion compacta, contraste, touch targets, densidad operacional.
7. Generar `DESIGN.md` como fuente semantica del sistema visual.
8. Ejecutar `prisma validate`, migraciones, typecheck, lint, tests y build.
9. Desplegar a produccion y verificar rutas afectadas autenticadas.
10. Entregar tabla de verificacion, causa raiz y archivos modificados.

## Criterios de aceptacion
- `/ordenes`, `/trabajadores` y `/hseq` no deben renderizar error boundary.
- `/api/health` debe responder `healthy` con `database: ok` y `schema: ok`.
- No debe haber filtracion de credenciales en URL.
- La navegacion debe ser mas compacta, consistente y accesible.
- El resultado final debe incluir tabla de evidencia.
