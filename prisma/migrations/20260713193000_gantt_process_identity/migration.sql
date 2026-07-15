-- Stable process identity makes Gantt synchronization idempotent.
-- Existing records remain NULL until the repair/synchronization assigns a code.
ALTER TABLE "GanttTask" ADD COLUMN "processCode" TEXT;

CREATE UNIQUE INDEX "GanttTask_workOrderId_processCode_key"
ON "GanttTask"("workOrderId", "processCode");
