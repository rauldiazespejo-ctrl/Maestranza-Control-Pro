with open("components/ui/dialog.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'className={cn(\n          "surface-glass',
    'role="dialog"\n        aria-modal="true"\n        className={cn(\n          "surface-glass'
)

with open("components/ui/dialog.tsx", "w") as f:
    f.write(content)
