import { z } from 'zod'

const phoneRegex = /^\(?[0-9]{2}\)? ?[0-9]{4,5}-?[0-9]{4}$/

export const CreatePatientDTO = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().regex(phoneRegex, 'Telefone inválido').optional(),
  cpf: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']).optional(),
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
  responsibleContactId: z.string().uuid('ID de responsável inválido').optional(),
  responsibleContact: z.object({
    name: z.string().min(2, 'Nome é obrigatório'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().regex(phoneRegex, 'Telefone inválido'),
    cpf: z.string().optional(),
    relationship: z.string().min(2, 'Relacionamento é obrigatório'),
  }).optional(),
  notes: z.string().optional(),
})

export const UpdatePatientDTO = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().regex(phoneRegex).optional(),
  cpf: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']).optional(),
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
  responsibleContactId: z.string().uuid().optional(),
  notes: z.string().optional(),
})

export const CreateResponsibleDTO = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().regex(phoneRegex, 'Telefone inválido'),
  cpf: z.string().optional(),
  relationship: z.string().min(2, 'Relacionamento é obrigatório'),
})

export const PatientParamsDTO = z.object({
  id: z.string().cuid('ID inválido'),
})

export const PatientQueryDTO = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
})

export const ResponsibleQueryDTO = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
})

export type CreatePatientInput = z.infer<typeof CreatePatientDTO>
export type UpdatePatientInput = z.infer<typeof UpdatePatientDTO>
export type CreateResponsibleInput = z.infer<typeof CreateResponsibleDTO>
export type PatientParams = z.infer<typeof PatientParamsDTO>
export type PatientQuery = z.infer<typeof PatientQueryDTO>
export type ResponsibleQuery = z.infer<typeof ResponsibleQueryDTO>
