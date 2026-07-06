-- AST/PTW MVP para bloqueo operacional de tareas criticas.

CREATE TYPE "RiskLevel" AS ENUM ('bajo', 'medio', 'alto', 'critico');
CREATE TYPE "AstStatus" AS ENUM ('borrador', 'en_revision', 'aprobado', 'requiere_revalidacion', 'cerrado');
CREATE TYPE "PermitType" AS ENUM ('caliente', 'izaje_critico', 'altura', 'loto', 'electrico', 'maquinaria', 'espacio_confinado');
CREATE TYPE "PermitStatus" AS ENUM ('borrador', 'aprobado', 'activo', 'suspendido', 'cerrado', 'vencido');

ALTER TABLE "WorkOrderTask"
ADD COLUMN "processArea" TEXT,
ADD COLUMN "critical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "requiresPermit" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "Ast" (
  "id" TEXT NOT NULL,
  "workOrderId" UUID NOT NULL,
  "workOrderTaskId" UUID,
  "area" TEXT NOT NULL,
  "equipmentId" UUID,
  "riskLevel" "RiskLevel" NOT NULL,
  "status" "AstStatus" NOT NULL DEFAULT 'borrador',
  "version" INTEGER NOT NULL DEFAULT 1,
  "supervisor" TEXT,
  "preStartChecks" TEXT,
  "evidence" TEXT,
  "changeReason" TEXT,
  "createdBy" TEXT,
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Ast_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AstStep" (
  "id" TEXT NOT NULL,
  "astId" TEXT NOT NULL,
  "stepOrder" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AstStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AstHazard" (
  "id" TEXT NOT NULL,
  "astStepId" TEXT NOT NULL,
  "hazardType" TEXT NOT NULL,
  "initialRisk" "RiskLevel" NOT NULL,
  "controls" TEXT NOT NULL,
  "residualRisk" "RiskLevel" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AstHazard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkPermit" (
  "id" TEXT NOT NULL,
  "type" "PermitType" NOT NULL,
  "workOrderId" UUID NOT NULL,
  "workOrderTaskId" UUID,
  "astId" TEXT NOT NULL,
  "area" TEXT NOT NULL,
  "equipmentId" UUID,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "status" "PermitStatus" NOT NULL DEFAULT 'borrador',
  "preconditions" TEXT,
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "suspendedReason" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkPermit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PermitChecklistItem" (
  "id" TEXT NOT NULL,
  "permitId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "checked" BOOLEAN NOT NULL DEFAULT false,
  "checkedBy" TEXT,
  "checkedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PermitChecklistItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EquipmentCertification" (
  "id" TEXT NOT NULL,
  "equipmentId" UUID NOT NULL,
  "certType" TEXT NOT NULL,
  "validFrom" TIMESTAMP(3),
  "validTo" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'vigente',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EquipmentCertification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Competency" (
  "id" TEXT NOT NULL,
  "companyId" UUID NOT NULL,
  "workerId" UUID NOT NULL,
  "competencyType" TEXT NOT NULL,
  "issuer" TEXT,
  "validTo" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Competency_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkOrderTask_critical_idx" ON "WorkOrderTask"("critical");
CREATE INDEX "WorkOrderTask_requiresPermit_idx" ON "WorkOrderTask"("requiresPermit");
CREATE INDEX "Ast_workOrderId_idx" ON "Ast"("workOrderId");
CREATE INDEX "Ast_workOrderTaskId_idx" ON "Ast"("workOrderTaskId");
CREATE INDEX "Ast_equipmentId_idx" ON "Ast"("equipmentId");
CREATE INDEX "Ast_riskLevel_idx" ON "Ast"("riskLevel");
CREATE INDEX "Ast_status_idx" ON "Ast"("status");
CREATE INDEX "AstStep_astId_idx" ON "AstStep"("astId");
CREATE INDEX "AstHazard_astStepId_idx" ON "AstHazard"("astStepId");
CREATE INDEX "AstHazard_initialRisk_idx" ON "AstHazard"("initialRisk");
CREATE INDEX "AstHazard_residualRisk_idx" ON "AstHazard"("residualRisk");
CREATE INDEX "WorkPermit_workOrderId_idx" ON "WorkPermit"("workOrderId");
CREATE INDEX "WorkPermit_workOrderTaskId_idx" ON "WorkPermit"("workOrderTaskId");
CREATE INDEX "WorkPermit_astId_idx" ON "WorkPermit"("astId");
CREATE INDEX "WorkPermit_equipmentId_idx" ON "WorkPermit"("equipmentId");
CREATE INDEX "WorkPermit_type_idx" ON "WorkPermit"("type");
CREATE INDEX "WorkPermit_status_idx" ON "WorkPermit"("status");
CREATE INDEX "WorkPermit_endAt_idx" ON "WorkPermit"("endAt");
CREATE INDEX "PermitChecklistItem_permitId_idx" ON "PermitChecklistItem"("permitId");
CREATE INDEX "PermitChecklistItem_checked_idx" ON "PermitChecklistItem"("checked");
CREATE INDEX "EquipmentCertification_equipmentId_idx" ON "EquipmentCertification"("equipmentId");
CREATE INDEX "EquipmentCertification_validTo_idx" ON "EquipmentCertification"("validTo");
CREATE INDEX "EquipmentCertification_status_idx" ON "EquipmentCertification"("status");
CREATE INDEX "Competency_companyId_idx" ON "Competency"("companyId");
CREATE INDEX "Competency_workerId_idx" ON "Competency"("workerId");
CREATE INDEX "Competency_competencyType_idx" ON "Competency"("competencyType");
CREATE INDEX "Competency_validTo_idx" ON "Competency"("validTo");

ALTER TABLE "Ast" ADD CONSTRAINT "Ast_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Ast" ADD CONSTRAINT "Ast_workOrderTaskId_fkey" FOREIGN KEY ("workOrderTaskId") REFERENCES "WorkOrderTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Ast" ADD CONSTRAINT "Ast_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AstStep" ADD CONSTRAINT "AstStep_astId_fkey" FOREIGN KEY ("astId") REFERENCES "Ast"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AstHazard" ADD CONSTRAINT "AstHazard_astStepId_fkey" FOREIGN KEY ("astStepId") REFERENCES "AstStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkPermit" ADD CONSTRAINT "WorkPermit_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkPermit" ADD CONSTRAINT "WorkPermit_workOrderTaskId_fkey" FOREIGN KEY ("workOrderTaskId") REFERENCES "WorkOrderTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkPermit" ADD CONSTRAINT "WorkPermit_astId_fkey" FOREIGN KEY ("astId") REFERENCES "Ast"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkPermit" ADD CONSTRAINT "WorkPermit_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PermitChecklistItem" ADD CONSTRAINT "PermitChecklistItem_permitId_fkey" FOREIGN KEY ("permitId") REFERENCES "WorkPermit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EquipmentCertification" ADD CONSTRAINT "EquipmentCertification_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Competency" ADD CONSTRAINT "Competency_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Competency" ADD CONSTRAINT "Competency_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
