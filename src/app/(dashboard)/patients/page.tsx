'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { PatientTable } from '@/components/organisms/PatientTable'
import { PatientModal } from '@/components/molecules/PatientModal'

interface ResponsibleContact {
  id: string
  name: string
  email: string | null
  phone: string
  cpf: string | null
  relationship: string
}

interface Patient {
  id: string
  name: string
  email: string | null
  phone: string | null
  cpf: string | null
  gender: string | null
  dateOfBirth: string | null
  address: Record<string, string> | null
  responsibleContact: ResponsibleContact | null
  notes: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function PatientsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [patients, setPatients] = useState<Patient[]>([])
  const [responsibles, setResponsibles] = useState<ResponsibleContact[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>()
  const [submitting, setSubmitting] = useState(false)

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())

      const res = await fetch(`/api/patients?${params}`)
      const data = await res.json()
      
      if (res.ok) {
        setPatients(data.patients)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit])

  const fetchResponsibles = useCallback(async () => {
    try {
      const res = await fetch('/api/responsibles?limit=100')
      const data = await res.json()
      
      if (res.ok) {
        setResponsibles(data.responsibles || [])
      }
    } catch (error) {
      console.error('Error fetching responsibles:', error)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchPatients()
      fetchResponsibles()
    }
  }, [status, router, fetchPatients, fetchResponsibles])

  const handleCreatePatient = async (data: {
    name: string
    email: string
    phone: string
    cpf: string
    dateOfBirth: string
    gender: string
    address: Record<string, string>
    responsibleContactId?: string
    responsibleContact?: {
      name: string
      email: string
      phone: string
      cpf: string
      relationship: string
    }
    notes: string
  }) => {
    try {
      setSubmitting(true)
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setIsModalOpen(false)
        fetchPatients()
      } else {
        const error = await res.json()
        alert(error.message || 'Erro ao criar paciente')
      }
    } catch (error) {
      console.error('Error creating patient:', error)
      alert('Erro ao criar paciente')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdatePatient = async (data: {
    name: string
    email: string
    phone: string
    cpf: string
    dateOfBirth: string
    gender: string
    address: Record<string, string>
    responsibleContactId?: string
    responsibleContact?: {
      name: string
      email: string
      phone: string
      cpf: string
      relationship: string
    }
    notes: string
  }) => {
    if (!editingPatient) return

    try {
      setSubmitting(true)
      const res = await fetch(`/api/patients/${editingPatient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setIsModalOpen(false)
        setEditingPatient(undefined)
        fetchPatients()
      } else {
        const error = await res.json()
        alert(error.message || 'Erro ao atualizar paciente')
      }
    } catch (error) {
      console.error('Error updating patient:', error)
      alert('Erro ao atualizar paciente')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePatient = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este paciente?')) return

    try {
      const res = await fetch(`/api/patients/${id}`, { method: 'DELETE' })
      
      if (res.ok) {
        fetchPatients()
      } else {
        const error = await res.json()
        alert(error.message || 'Erro ao excluir paciente')
      }
    } catch (error) {
      console.error('Error deleting patient:', error)
      alert('Erro ao excluir paciente')
    }
  }

  const handleEditPatient = (id: string) => {
    const patient = patients.find(p => p.id === id)
    if (patient) {
      setEditingPatient(patient)
      setIsModalOpen(true)
    }
  }

  const handleCreate = () => {
    setEditingPatient(undefined)
    setIsModalOpen(true)
  }

  if (status === 'loading' || (loading && patients.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gerenciamento de Pacientes
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PatientTable
          patients={patients}
          onEdit={handleEditPatient}
          onDelete={handleDeletePatient}
          onCreate={handleCreate}
          isLoading={loading}
        />
      </main>

      <PatientModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingPatient(undefined); }}
        onSubmit={editingPatient ? handleUpdatePatient : handleCreatePatient}
        initialData={editingPatient}
        responsibles={responsibles}
        isLoading={submitting}
      />
    </div>
  )
}
