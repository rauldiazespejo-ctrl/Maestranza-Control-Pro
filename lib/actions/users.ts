"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAuth, ADMIN_ROLES, MANAGEABLE_ROLES } from "@/lib/auth";
import { rutSchema } from "@/lib/validations/rut";

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
  rut: rutSchema,
  email: z.string().email("Email inválido"),
  name: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  password: z.string().min(12, "La contraseña debe tener al menos 12 caracteres"),
  role: z.nativeEnum(UserRole),
  clientId: z.string().optional(),
}).superRefine((data, context) => {
  if (data.role === "CLIENT" && !data.clientId) {
    context.addIssue({
      code: "custom",
      path: ["clientId"],
      message: "Selecciona el cliente asociado",
    });
  }
});

export async function createUser(data: z.infer<typeof createUserSchema>) {
  const session = await requireAuth(ADMIN_ROLES);

  const parsed = createUserSchema.parse(data);

  const user = await prisma.user.create({
    data: {
      rut: parsed.rut,
      email: parsed.email,
      name: parsed.name,
      password: await bcrypt.hash(parsed.password, 12),
      role: parsed.role,
      clientId: parsed.clientId || null,
      companyId: session.user.companyId || undefined,
    },
  });

  revalidatePath("/configuracion");
  return user;
}

export async function toggleUserActive(id: string, active: boolean) {
  const session = await requireAuth(ADMIN_ROLES);
  if (session.user.id === id && !active) {
    throw new Error("No puedes desactivar tu propia cuenta");
  }
  await prisma.user.update({ where: { id }, data: { active } });
  revalidatePath("/configuracion");
}
