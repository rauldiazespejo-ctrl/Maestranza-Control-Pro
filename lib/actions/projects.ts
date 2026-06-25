"use server";

import { prisma } from "@/lib/db";
import { requireAuth, READ_ROLES } from "@/lib/auth";

export async function getProjects() {
  const session = await requireAuth(READ_ROLES);
  
  const where: Record<string, unknown> = {};
  if (session.user.role === "CLIENT" && session.user.clientId) {
    where.clientId = session.user.clientId;
  }

  return prisma.project.findMany({
    where,
    orderBy: { name: "asc" },
  });
}
