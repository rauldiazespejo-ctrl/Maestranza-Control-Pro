import fs from "fs";

const file = "app/(dashboard)/dashboard/page.tsx";
let content = fs.readFileSync(file, "utf8");

content = content.replace(
  /import { auth } from "@\/lib\/auth";/,
  `import { auth } from "@/lib/auth";\nimport { getDashboardStats } from "@/lib/actions/dashboard";`
);

fs.writeFileSync(file, content, "utf8");
