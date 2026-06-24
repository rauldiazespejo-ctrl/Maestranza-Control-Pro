"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getUsers() {
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
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("No autorizado");

  const company = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: await bcrypt.hash(data.password, 10),
      role: data.role as Parameters<typeof prisma.user.create>[0]["data"]["role"],
      clientId: data.clientId || null,
      companyId: company?.id,
    },
  });

  revalidatePath("/configuracion");
  return user;
}

export async function toggleUserActive(id: string, active: boolean) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("No autorizado");
  await prisma.user.update({ where: { id }, data: { active } });
  revalidatePath("/configuracion");
}
