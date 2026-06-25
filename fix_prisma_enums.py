import os

def fix_enums(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r') as f:
        content = f.read()
    
    content = content.replace('import type { WorkOrderStatus } from "@prisma/client";', 'import { WorkOrderStatus } from "@prisma/client";')
    content = content.replace('import type { WorkOrderStatus, HseqStatus } from "@prisma/client";', 'import { WorkOrderStatus, HseqStatus } from "@prisma/client";')

    content = content.replace('const ACTIVE_STATUSES: WorkOrderStatus[] = ["nueva", "planificada", "en_proceso", "revision"];', 'const ACTIVE_STATUSES = [WorkOrderStatus.nueva, WorkOrderStatus.planificada, WorkOrderStatus.en_proceso, WorkOrderStatus.revision];')
    content = content.replace('const ACTIVE_STATUSES: WorkOrderStatus[] = [\n  "nueva",\n  "planificada",\n  "en_proceso",\n  "detenida",\n  "revision",\n];', 'const ACTIVE_STATUSES = [WorkOrderStatus.nueva, WorkOrderStatus.planificada, WorkOrderStatus.en_proceso, WorkOrderStatus.detenida, WorkOrderStatus.revision];')
    content = content.replace('const CLOSED_STATUSES: WorkOrderStatus[] = ["completada", "cerrada"];', 'const CLOSED_STATUSES = [WorkOrderStatus.completada, WorkOrderStatus.cerrada];')

    with open(filepath, 'w') as f:
        f.write(content)

fix_enums("lib/actions/dashboard.ts")
fix_enums("app/(dashboard)/dashboard/page.tsx")

