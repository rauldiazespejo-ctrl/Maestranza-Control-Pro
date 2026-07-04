"use server";

import { prisma } from "@/lib/db";
import { requireAuth, MANAGEABLE_ROLES } from "@/lib/auth";

export async function getCompany() {
  await requireAuth(MANAGEABLE_ROLES);
  return prisma.company.findFirst({ orderBy: { createdAt: "asc" } });
}
