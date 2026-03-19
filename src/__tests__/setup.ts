import { beforeAll, afterAll, beforeEach } from 'bun:test'
import { prisma } from '@/lib/prisma'

export { prisma }

beforeAll(async () => {
  await prisma.$connect()
})

afterAll(async () => {
  await prisma.$disconnect()
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
  await prisma.responsibleContact.deleteMany()
  await prisma.responsible.deleteMany()
  await prisma.user.deleteMany()
}

export function uniqueEmail() {
  return `test_${Date.now()}_${Math.random()}@test.com`
}
