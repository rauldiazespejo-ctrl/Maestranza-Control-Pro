import re
import sys

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Add imports if missing
    if 'Label' not in content:
        content = content.replace('import { Input } from "@/components/ui/input";', 'import { Input } from "@/components/ui/input";\nimport { Label } from "@/components/ui/label";\nimport { Textarea } from "@/components/ui/textarea";')
    
    # Replace label tags
    content = re.sub(r'<label className="[^"]*text-steel[^"]*">', '<Label className="mb-2 block">', content)
    content = content.replace('</label>', '</Label>')

    # Replace textarea with Textarea
    content = re.sub(r'<textarea (.*?) className="[^"]*"(.*?)(/?)>', r'<Textarea \1\2\3>', content)
    content = re.sub(r'</textarea>', '</Textarea>', content)
    
    # Also clean rgba and hardcoded colors
    content = content.replace('bg-[rgba(149,10,16,0.08)]', 'bg-fire/10')
    content = content.replace('border-[rgba(149,10,16,0.42)]', 'border-fire/40')
    content = content.replace('shadow-[0_0_16px_rgba(149,10,16,0.35)]', 'shadow-[0_0_16px_var(--color-fire-muted)]')
    content = content.replace('border-[rgba(232,179,58,0.25)]', 'border-gold/25')
    content = content.replace('shadow-[var(--shadow-industrial-sm)]', 'shadow-industrial-sm')
    content = content.replace('border-[rgba(232,179,58,0.3)]', 'border-gold/30')

    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Processed {filepath}")

for f in ['components/ordenes/OrdenesClient.tsx', 'components/hseq/HseqClient.tsx']:
    process_file(f)
