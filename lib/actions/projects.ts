"use server";

import { prisma } from "@/lib/db";
import { requireAuth, requireClientId, READ_ROLES } from "@/lib/auth";

export async function getProjects() {
  const session = await requireAuth(READ_ROLES);
  
  const where: import('@prisma/client').Prisma.ProjectWhereInput = {};
  const scopedClientId = requireClientId(session.user.role, session.user.clientId);
  if (session.user.role === "CLIENT") {
    where.clientId = scopedClientId!;
  }

  return prisma.project.findMany({
    where,
    orderBy: { name: "asc" },
  });
}
