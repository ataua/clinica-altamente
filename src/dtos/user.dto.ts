import { z } from 'zod'

export const CreateUserDTO = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['ADMIN', 'PROFESSIONAL', 'SECRETARY', 'PATIENT', 'RESPONSIBLE', 'TEACHER', 'COORDINATOR']).default('PATIENT'),
})

export const UpdateUserDTO = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'PROFESSIONAL', 'SECRETARY', 'PATIENT', 'RESPONSIBLE', 'TEACHER', 'COORDINATOR']).optional(),
  password: z.string().min(6).optional(),
})

export const UserParamsDTO = z.object({
  id: z.string().uuid('ID inválido'),
})

export const UserQueryDTO = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  role: z.enum(['ADMIN', 'PROFESSIONAL', 'SECRETARY', 'PATIENT', 'RESPONSIBLE', 'TEACHER', 'COORDINATOR']).optional(),
  search: z.string().optional(),
})

export type CreateUserInput = z.infer<typeof CreateUserDTO>
export type UpdateUserInput = z.infer<typeof UpdateUserDTO>
export type UserParams = z.infer<typeof UserParamsDTO>
export type UserQuery = z.infer<typeof UserQueryDTO>
