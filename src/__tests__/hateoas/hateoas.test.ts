import { describe, it, expect } from 'bun:test'
import {
  generatePaginationLinks,
  generateResourceLinks,
  generateCollectionLinks,
  generateAppointmentLinks,
  generatePatientLinks,
  generateAttendanceLinks,
} from '@/lib/hateoas'

describe('HATEOAS Links', () => {
  describe('generatePaginationLinks', () => {
    it('should generate pagination links for page 1', () => {
      const links = generatePaginationLinks('/api/users', 1, 5)

      expect(links.self.href).toBe('/api/users?page=1')
      expect(links.first.href).toBe('/api/users?page=1')
      expect(links.prev).toBeNull()
      expect(links.next?.href).toBe('/api/users?page=2')
      expect(links.last.href).toBe('/api/users?page=5')
    })

    it('should generate pagination links for middle page', () => {
      const links = generatePaginationLinks('/api/users', 3, 5)

      expect(links.self.href).toBe('/api/users?page=3')
      expect(links.prev?.href).toBe('/api/users?page=2')
      expect(links.next?.href).toBe('/api/users?page=4')
    })

    it('should generate pagination links for last page', () => {
      const links = generatePaginationLinks('/api/users', 5, 5)

      expect(links.next).toBeNull()
      expect(links.prev?.href).toBe('/api/users?page=4')
    })

    it('should include additional params', () => {
      const links = generatePaginationLinks('/api/users', 1, 5, { role: 'ADMIN' })

      expect(links.self.href).toContain('role=ADMIN')
    })
  })

  describe('generateResourceLinks', () => {
    it('should always include self link', () => {
      const links = generateResourceLinks('/users', '123')
      expect(links.self.href).toBe('/api/users/123')
    })

    it('should include update and delete by default', () => {
      const links = generateResourceLinks('/users', '123', ['GET', 'PUT', 'DELETE'])

      expect(links.update?.href).toBe('/api/users/123')
      expect(links.update?.method).toBe('PUT')
      expect(links.delete?.href).toBe('/api/users/123')
      expect(links.delete?.method).toBe('DELETE')
    })

    it('should not include actions not specified', () => {
      const links = generateResourceLinks('/users', '123', ['GET'])
      expect(links.update).toBeUndefined()
      expect(links.delete).toBeUndefined()
    })
  })

  describe('generateCollectionLinks', () => {
    it('should include self and create links', () => {
      const links = generateCollectionLinks('/users')

      expect(links.self.href).toBe('/api/users')
      expect(links.create?.href).toBe('/api/users')
      expect(links.create?.method).toBe('POST')
    })

    it('should include context links', () => {
      const links = generateCollectionLinks('/appointments', { patientId: '123' })

      expect(links.patientId?.href).toBe('/api/appointments?patientId=123')
    })
  })

  describe('generateAppointmentLinks', () => {
    it('should include base links', () => {
      const links = generateAppointmentLinks('apt1', 'pat1', 'prof1', 'SCHEDULED')

      expect(links.self.href).toBe('/api/appointments/apt1')
      expect(links.patient.href).toBe('/api/patients/pat1')
      expect(links.professional.href).toBe('/api/professionals/prof1')
    })

    it('should include start/cancel/reschedule for scheduled appointments', () => {
      const links = generateAppointmentLinks('apt1', 'pat1', 'prof1', 'SCHEDULED')

      expect(links.start?.href).toBe('/api/appointments/apt1/start')
      expect(links.cancel?.href).toBe('/api/appointments/apt1/cancel')
      expect(links.reschedule?.href).toBe('/api/appointments/apt1/reschedule')
    })

    it('should include complete for in-progress appointments', () => {
      const links = generateAppointmentLinks('apt1', 'pat1', 'prof1', 'IN_PROGRESS')

      expect(links.complete?.href).toBe('/api/appointments/apt1/complete')
    })
  })

  describe('generatePatientLinks', () => {
    it('should include all patient links', () => {
      const links = generatePatientLinks('pat1', 'user1')

      expect(links.self.href).toBe('/api/patients/pat1')
      expect(links.user.href).toBe('/api/users/user1')
      expect(links.appointments.href).toBe('/api/appointments?patientId=pat1')
      expect(links.attendances.href).toBe('/api/attendances?patientId=pat1')
    })
  })

  describe('generateAttendanceLinks', () => {
    it('should include all attendance links', () => {
      const links = generateAttendanceLinks('att1', 'apt1', 'pat1', 'prof1', 'PENDING')

      expect(links.self.href).toBe('/api/attendances/att1')
      expect(links.appointment.href).toBe('/api/appointments/apt1')
    })

    it('should include start for pending attendance', () => {
      const links = generateAttendanceLinks('att1', 'apt1', 'pat1', 'prof1', 'PENDING')

      expect(links.start?.href).toBe('/api/attendances/att1/start')
    })

    it('should include complete for in-progress attendance', () => {
      const links = generateAttendanceLinks('att1', 'apt1', 'pat1', 'prof1', 'IN_PROGRESS')

      expect(links.complete?.href).toBe('/api/attendances/att1/complete')
    })
  })
})
