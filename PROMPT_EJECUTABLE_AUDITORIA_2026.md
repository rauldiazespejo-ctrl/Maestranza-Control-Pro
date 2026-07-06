# Prompt Ejecutable de Auditoria y Correccion

Actua como auditor tecnico senior para `Maestranza-Control-Pro`, una app Next.js 16, React 19, Prisma 7, PostgreSQL y Auth.js v5. Trabaja en espanol y no declares cierre hasta tener una tabla de verificacion.

## Objetivo

Detectar errores reales, corregir los de bajo riesgo inmediatamente y documentar mejoras que requieran decision del dueno del sistema.

## Reglas de ejecucion

1. No revertir cambios locales existentes sin autorizacion.
2. Priorizar fallos que bloqueen build, typecheck, lint, Prisma, autenticacion, despliegue o auditoria HSEQ.
3. Aplicar cambios pequenos, verificables y alineados al stack actual.
4. No ejecutar fixes destructivos como `npm audit fix --force` si implican downgrades o breaking changes.
5. Reportar evidencia en tabla con comando, resultado e impacto.

## Checklist

| Area | Verificacion | Accion esperada |
|---|---|---|
| TypeScript | `npm run typecheck` | Corregir errores de tipos |
| Lint | `npm run lint` | Corregir warnings/errors |
| Prisma | `npx prisma validate` | Corregir schema/config |
| Build | `npm run build` | Corregir errores y warnings accionables |
| Tests | `npm run test` | Crear/corregir tests minimos si no hay cobertura |
| Seguridad | `npm audit --omit=dev --audit-level=moderate` | Documentar vulnerabilidades y no forzar downgrades |
| Next 16 | Revisar `middleware.ts` | Migrar a `proxy.ts` si aparece warning |
| Auth | Revisar secrets y `trustHost` | Evitar runtime prod sin secret |
| CI/CD | Revisar `.github/workflows` | Exigir typecheck, lint, tests y build antes de deploy |

## Ejecucion en este repo

1. Inspeccionar `git status --short`.
2. Ejecutar comandos de verificacion.
3. Corregir solo hallazgos verificables.
4. Repetir verificacion.
5. Entregar tabla final con estado verde/amarillo/rojo.
