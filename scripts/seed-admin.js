import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD debe estar definido y tener al menos 12 caracteres");
  }
  // Verificar si el usuario ya existe
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ rut: "15422822-5" }, { email: "rdiaz@soldesp.com" }],
    },
  });

  if (existing) {
    console.log("El usuario ya existe:", existing.id);
    return;
  }

  // Crear compañía principal
  const company = await prisma.company.upsert({
    where: { rut: "76.123.456-7" },
    update: {},
    create: {
      name: "BOILER COMP S.A.",
      rut: "76.123.456-7",
    },
  });

  // Hashear contraseña
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // Crear superadmin
  const user = await prisma.user.create({
    data: {
      email: "rdiaz@soldesp.com",
      rut: "15422822-5",
      name: "Raul Andres Diaz espejo",
      password: passwordHash,
      role: "ADMIN",
      active: true,
      companyId: company.id,
    },
  });

  console.log("Superadmin creado:", user.id);
  console.log("RUT:", user.rut);
  console.log("Email:", user.email);
  console.log("Rol:", user.role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
