"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, MANAGEABLE_ROLES } from "@/lib/auth";
import { companySchema, type CompanyFormData } from "@/lib/validations/company";

export async function getCompany() {
  await requireAuth(MANAGEABLE_ROLES);
  return prisma.company.findFirst({ orderBy: { createdAt: "asc" } });
}

export async function saveCompany(data: CompanyFormData, id?: string | null) {
  const session = await requireAuth(MANAGEABLE_ROLES);
  const parsed = companySchema.parse(data);

  const company = id
    ? await prisma.company.update({
        where: { id },
        data: {
          ...parsed,
          address: parsed.address || null,
          phone: parsed.phone || null,
          email: parsed.email || null,
          logoUrl: parsed.logoUrl || null,
        },
      })
    : await prisma.company.create({
        data: {
          ...parsed,
          address: parsed.address || null,
          phone: parsed.phone || null,
          email: parsed.email || null,
          logoUrl: parsed.logoUrl || null,
        },
      });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: id ? "UPDATE" : "CREATE",
      entity: "Company",
      entityId: company.id,
    },
  });

  revalidatePath("/configuracion");
  return company;
}
