DROP TABLE IF EXISTS "TaskProgressUpdate" CASCADE;
DROP TABLE IF EXISTS "LaborEntry" CASCADE;
ALTER TABLE "GanttTask" DROP COLUMN IF EXISTS "workOrderTaskId";

CREATE TABLE "LaborEntry" (
  "id" UUID NOT NULL,
  "assignmentId" UUID NOT NULL,
  "workerId" UUID NOT NULL,
  "workOrderId" UUID NOT NULL,
  "taskId" UUID,
  "workDate" DATE NOT NULL,
  "plannedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "actualHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "shift" TEXT NOT NULL DEFAULT 'dia',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LaborEntry_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "TaskProgressUpdate" (
  "id" UUID NOT NULL,
  "taskId" UUID NOT NULL,
  "workerId" UUID,
  "progress" DOUBLE PRECISION NOT NULL,
  "actualHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "comment" TEXT NOT NULL,
  "blocked" BOOLEAN NOT NULL DEFAULT false,
  "blocker" TEXT,
  "evidenceUrl" TEXT,
  "reportedBy" TEXT,
  "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskProgressUpdate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LaborEntry_assignmentId_workDate_shift_taskId_key" ON "LaborEntry"("assignmentId", "workDate", "shift", "taskId");
CREATE INDEX "LaborEntry_workerId_workDate_idx" ON "LaborEntry"("workerId", "workDate");
CREATE INDEX "LaborEntry_workOrderId_workDate_idx" ON "LaborEntry"("workOrderId", "workDate");
CREATE INDEX "LaborEntry_taskId_idx" ON "LaborEntry"("taskId");
CREATE INDEX "TaskProgressUpdate_taskId_reportedAt_idx" ON "TaskProgressUpdate"("taskId", "reportedAt");
CREATE INDEX "TaskProgressUpdate_workerId_idx" ON "TaskProgressUpdate"("workerId");
CREATE INDEX "TaskProgressUpdate_blocked_idx" ON "TaskProgressUpdate"("blocked");
ALTER TABLE "LaborEntry" ADD CONSTRAINT "LaborEntry_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "WorkerAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LaborEntry" ADD CONSTRAINT "LaborEntry_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LaborEntry" ADD CONSTRAINT "LaborEntry_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LaborEntry" ADD CONSTRAINT "LaborEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WorkOrderTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskProgressUpdate" ADD CONSTRAINT "TaskProgressUpdate_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WorkOrderTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskProgressUpdate" ADD CONSTRAINT "TaskProgressUpdate_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GanttTask" ADD COLUMN "workOrderTaskId" UUID;
CREATE UNIQUE INDEX "GanttTask_workOrderTaskId_key" ON "GanttTask"("workOrderTaskId");
ALTER TABLE "GanttTask" ADD CONSTRAINT "GanttTask_workOrderTaskId_fkey" FOREIGN KEY ("workOrderTaskId") REFERENCES "WorkOrderTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
