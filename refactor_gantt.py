import re
filepath = "components/gantt/GanttClient.tsx"
with open(filepath, 'r') as f:
    content = f.read()

if 'import { Label }' not in content:
    content = content.replace('import { Input } from "@/components/ui/input";', 'import { Input } from "@/components/ui/input";\nimport { Label } from "@/components/ui/label";\nimport { Textarea } from "@/components/ui/textarea";')

content = re.sub(r'<label className="[^"]*text-steel[^"]*">', '<Label className="mb-2 block">', content)
content = content.replace('</label>', '</Label>')
content = re.sub(r'<textarea (.*?) className="[^"]*"(.*?)(/?)>', r'<Textarea \1\2\3>', content)
content = re.sub(r'</textarea>', '</Textarea>', content)

with open(filepath, 'w') as f:
    f.write(content)
