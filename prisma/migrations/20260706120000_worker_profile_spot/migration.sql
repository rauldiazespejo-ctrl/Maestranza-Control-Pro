-- CreateEnum
CREATE TYPE "WorkerProfile" AS ENUM ('empleado', 'supervisor');

-- CreateEnum
CREATE TYPE "WorkerEngagement" AS ENUM ('permanente', 'spot');

-- AlterTable
ALTER TABLE "Worker"
ADD COLUMN "profile" "WorkerProfile" NOT NULL DEFAULT 'empleado',
ADD COLUMN "engagement" "WorkerEngagement" NOT NULL DEFAULT 'permanente',
ADD COLUMN "canCreateWorkers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "canAssignWorkOrders" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "spotDescription" TEXT;

-- CreateIndex
CREATE INDEX "Worker_profile_idx" ON "Worker"("profile");

-- CreateIndex
CREATE INDEX "Worker_engagement_idx" ON "Worker"("engagement");
