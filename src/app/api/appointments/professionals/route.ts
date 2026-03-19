import { appointmentController } from '@/controllers/appointment.controller'

export async function GET() {
  return appointmentController.getProfessionals()
}
