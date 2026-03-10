import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/bcrypt"

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    console.error("Erro: ADMIN_EMAIL e ADMIN_PASSWORD devem estar definidos no .env")
    process.exit(1)
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (existingAdmin) {
    console.log(`Usuário admin ${adminEmail} já existe. Pulando criação.`)
    return
  }

  const hashedPassword = await hashPassword(adminPassword)

  await prisma.user.create({
    data: {
      name: "Administrador",
      email: adminEmail,
      password: hashedPassword,
    },
  })

  console.log(`Usuário admin ${adminEmail} criado com sucesso!`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
