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

import { z } from "zod";
import { UserRole } from "@prisma/client";

const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  password: z.string().min(6, "Contraseña muy corta"),
  role: z.nativeEnum(UserRole),
  clientId: z.string().optional(),
});

export async function createUser(data: z.infer<typeof createUserSchema>) {
  const session = await requireAuth(ADMIN_ROLES);

  const parsed = createUserSchema.parse(data);

  const user = await prisma.user.create({
    data: {
      email: parsed.email,
      name: parsed.name,
      password: await bcrypt.hash(parsed.password, 10),
      role: parsed.role,
      clientId: parsed.clientId || null,
      companyId: session.user.companyId || undefined,
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
