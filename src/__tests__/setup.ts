import { beforeAll, afterAll } from 'bun:test'
import { prisma } from '@/lib/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: typeof prisma | undefined
}

export const testPrisma = globalForPrisma.prisma ?? prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = testPrisma

beforeAll(async () => {
  await testPrisma.$connect()
})

afterAll(async () => {
  await testPrisma.$disconnect()
})

export async function cleanupDatabase() {
  await testPrisma.appointment.deleteMany()
  await testPrisma.attendance.deleteMany()
  await testPrisma.patient.deleteMany()
  await testPrisma.professional.deleteMany()
  await testPrisma.professionalSchedule.deleteMany()
  await testPrisma.appointmentType.deleteMany()
  await testPrisma.responsibleContact.deleteMany()
  await testPrisma.responsible.deleteMany()
  await testPrisma.user.deleteMany()
}

export function uniqueEmail() {
  return `test_${Date.now()}_${Math.random()}@test.com`
}
