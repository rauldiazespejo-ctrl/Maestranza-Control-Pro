filepath = "lib/actions/hseq.ts"
with open(filepath, "r") as f:
    content = f.read()

content = content.replace(
    'include: { _count: { select: { documents: true } } },',
    'include: { _count: { select: { documents: true } }, responsible: true },'
)

content = content.replace(
    'nextReview: toDateOptional(parsed.nextReview),',
    'dueDate: toDateOptional(parsed.dueDate),'
)

with open(filepath, "w") as f:
    f.write(content)
