import { beforeAll, afterAll, beforeEach } from 'bun:test'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const testDatabaseUrl = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@0.0.0.0:5433/clinica-altamente_test?schema=public'

let testPool: Pool | null = null

const globalForTestPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createTestPrismaClient(): PrismaClient {
  testPool = new Pool({ connectionString: testDatabaseUrl })
  const adapter = new PrismaPg(testPool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForTestPrisma.prisma ?? createTestPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForTestPrisma.prisma = prisma
}

beforeAll(async () => {
  await prisma.$connect()
})

afterAll(async () => {
  await prisma.$disconnect()
  if (testPool) {
    await testPool.end()
  }
})

beforeEach(async () => {
  await cleanupDatabase()
})

export async function cleanupDatabase() {
  await prisma.appointment.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.professional.deleteMany()
  await prisma.professionalSchedule.deleteMany()
  await prisma.appointmentType.deleteMany()
  await prisma.specialty.deleteMany()
  await prisma.responsibleContact.deleteMany()
  await prisma.responsible.deleteMany()
  await prisma.user.deleteMany()
}

export function uniqueEmail() {
  return `test_${Date.now()}_${Math.random()}@test.com`
}
