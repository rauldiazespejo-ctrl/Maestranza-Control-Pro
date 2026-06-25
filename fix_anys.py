import os

for root, _, files in os.walk("lib/actions"):
    for file in files:
        if file.endswith(".ts"):
            filepath = os.path.join(root, file)
            with open(filepath, "r") as f:
                content = f.read()
            
            content = content.replace("const where: any =", "const where: Record<string, unknown> =")
            content = content.replace("where: any =", "where: Record<string, unknown> =")
            content = content.replace("period: any", "period: string")
            content = content.replace("dateRange: any", "dateRange: { from?: Date; to?: Date }")
            content = content.replace("params?: any", "params?: Record<string, unknown>")
            
            with open(filepath, "w") as f:
                f.write(content)

