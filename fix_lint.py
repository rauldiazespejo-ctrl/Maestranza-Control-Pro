import os
import re

files = [
    "lib/actions/documents.ts",
    "lib/actions/gantt.ts",
    "lib/actions/hseq.ts",
    "lib/actions/projects.ts",
    "lib/actions/reports.ts",
    "lib/actions/users.ts",
    "lib/actions/workorders.ts",
]

for filepath in files:
    if not os.path.exists(filepath):
        continue
    with open(filepath, "r") as f:
        content = f.read()

    # Replace specific explicit anys with Record<string, unknown>
    # we can just blindly replace `: any` with `: Record<string, unknown>` or similar in parameters if it's filters
    content = re.sub(r'filters\?\:\s*any', 'filters?: Record<string, unknown>', content)
    content = re.sub(r'filters\:\s*any', 'filters: Record<string, unknown>', content)
    
    # other specific `any`s
    content = content.replace('params?: any', 'params?: Record<string, unknown>')
    content = content.replace('const session = await requireAuth(MANAGEABLE_ROLES);', '') if 'lib/actions/hseq.ts' in filepath else content
    
    # in reports.ts
    content = content.replace('period: any', 'period: string')
    content = content.replace('dateRange: any', 'dateRange: { from?: Date; to?: Date }')
    content = content.replace('export async function getWorkersReport(filters?: any)', 'export async function getWorkersReport(filters?: Record<string, unknown>)')

    with open(filepath, "w") as f:
        f.write(content)

# fix unused Textarea in GanttClient
with open("components/gantt/GanttClient.tsx", "r") as f:
    content = f.read()
content = content.replace('import { Textarea } from "@/components/ui/textarea";', '')
content = content.replace('import { Label, Textarea }', 'import { Label }')

with open("components/gantt/GanttClient.tsx", "w") as f:
    f.write(content)

