"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAuth, ADMIN_ROLES, MANAGEABLE_ROLES } from "@/lib/auth";

export async function getUsers() {
  await requireAuth(MANAGEABLE_ROLES); // Only admins can see users list usually
  return prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, active: true, clientId: true, companyId: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createUser(data: {
  email: string;
  name: string;
  password: string;
  role: string;
  clientId?: string;
}) {
  await requireAuth(ADMIN_ROLES);

  const company = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: await bcrypt.hash(data.password, 10),
      role: data.role as import("@prisma/client").UserRole,
      clientId: data.clientId || null,
      companyId: company?.id,
    },
  });

  revalidatePath("/configuracion");
  return user;
}

export async function toggleUserActive(id: string, active: boolean) {
  await requireAuth(ADMIN_ROLES);
  await prisma.user.update({ where: { id }, data: { active } });
  revalidatePath("/configuracion");
}
