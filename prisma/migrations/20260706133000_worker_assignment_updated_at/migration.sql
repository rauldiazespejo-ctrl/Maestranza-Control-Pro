-- Corrige deriva entre schema.prisma y la base productiva.
-- WorkerAssignment tiene updatedAt en Prisma, pero la migracion inicial
-- creo la tabla sin esta columna.
ALTER TABLE "WorkerAssignment"
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
