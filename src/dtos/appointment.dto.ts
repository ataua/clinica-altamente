import { z } from 'zod'

export const CreateAppointmentDTO = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  professionalId: z.string().min(1, 'Professional ID is required'),
  scheduledDateTime: z.string().min(1, 'Scheduled date/time is required'),
  notes: z.string().optional(),
})

export const UpdateAppointmentDTO = z.object({
  scheduledDateTime: z.string().optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  notes: z.string().optional(),
  cancellationReason: z.string().optional(),
})

export const AppointmentFilterDTO = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  professionalId: z.string().optional(),
  patientId: z.string().optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
})

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentDTO>
export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentDTO>
export type AppointmentFilterInput = z.infer<typeof AppointmentFilterDTO>
