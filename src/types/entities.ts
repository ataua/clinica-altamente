export interface ResponsibleContact {
  id: string
  name: string
  email: string | null
  phone: string
  cpf: string | null
  relationship: string
}

export interface Patient {
  id: string
  name: string
  email: string | null
  phone: string | null
  cpf: string | null
  dateOfBirth: string | null
  gender: string | null
  address: Address | string | null
  observations: string | null
  notes: string | null
  responsibleContact: ResponsibleContact | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Address {
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  zipCode?: string
}

export interface Professional {
  id: string
  userId: string
  name: string
  specialtyId?: string | null
  specialtyName?: string
  licenseNumber?: string | null
  bio?: string | null
  isActive?: boolean
}

export interface Specialty {
  id: string
  name: string
  description?: string | null
  isActive?: boolean
}

export interface Appointment {
  id: string
  patientId: string
  patientName: string
  professionalId: string
  professionalName: string
  scheduledDateTime: string
  endDateTime: string
  status: AppointmentStatus
  notes?: string | null
  cancellationReason?: string | null
}

export type AppointmentStatus = 
  | 'SCHEDULED' 
  | 'CONFIRMED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW'

export interface Attendance {
  id: string
  appointmentId: string
  patientId: string
  professionalId: string
  startTime: string
  endTime?: string | null
  status: AttendanceStatus
  notes?: string | null
  observations?: string | null
  diagnosis?: string | null
  treatmentPlan?: string | null
}

export type AttendanceStatus = 
  | 'PENDING' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED'

export interface User {
  id: string
  name?: string | null
  email?: string | null
  role: UserRole
  image?: string | null
  emailVerified?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

export type UserRole = 
  | 'ADMIN' 
  | 'PROFESSIONAL' 
  | 'SECRETARY' 
  | 'PATIENT' 
  | 'RESPONSIBLE' 
  | 'TEACHER' 
  | 'COORDINATOR'

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface SelectOption {
  value: string
  label: string
}
