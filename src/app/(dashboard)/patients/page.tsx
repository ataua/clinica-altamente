'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionContext } from '@/contexts/SessionContext'
import { PatientTable } from '@/components/organisms/PatientTable'
import { PatientModal } from '@/components/molecules/PatientModal'
import { ResponsibleModal } from '@/components/molecules/ResponsibleModal'
import { toast } from '@/components/ui/toast'
import { type Patient, type ResponsibleContact, type Pagination } from '@/types'

export default function PatientsPage() {
  const { status } = useSessionContext()
  const router = useRouter()
  
  const [patients, setPatients] = useState<Patient[]>([])
  const [responsibles, setResponsibles] = useState<ResponsibleContact[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>()
  const [submitting, setSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  const [isResponsibleModalOpen, setIsResponsibleModalOpen] = useState(false)
  const [editingResponsible, setEditingResponsible] = useState<ResponsibleContact | null>(null)
  const [editingResponsiblePatientId, setEditingResponsiblePatientId] = useState<string | null>(null)

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())

      const res = await fetch(`/api/patients?${params}`)
      const data = await res.json()
      
      if (res.ok) {
        setPatients(data.data || [])
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 })
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
      toast.error('Erro ao carregar pacientes', {
        description: 'Tente novamente mais tarde',
      })
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit])

  const fetchResponsibles = useCallback(async () => {
    try {
      const res = await fetch('/api/responsibles?limit=100')
      const data = await res.json()
      
      if (res.ok) {
        setResponsibles(data.data || [])
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
        const responseData = await res.json()
        setGeneratedPassword(responseData.data?.generatedPassword || null)
        setIsModalOpen(false)
        setFormErrors({})
        fetchPatients()
        toast.success('Paciente criado com sucesso!')
        if (responseData.data?.generatedPassword) {
          toast.success('Senha de acesso gerada', {
            description: `Senha: ${responseData.data.generatedPassword}`,
            duration: 10000,
          })
        }
      } else {
        const error = await res.json()
        if (error.code === 'CONFLICT') {
          setFormErrors({ email: error.error || 'Email já cadastrado' })
        } else {
          toast.error('Erro ao criar paciente', {
            description: error.message || 'Verifique os dados e tente novamente',
          })
        }
      }
    } catch (error) {
      console.error('Error creating patient:', error)
      toast.error('Erro ao criar paciente', {
        description: 'Tente novamente mais tarde',
      })
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
        setFormErrors({})
        fetchPatients()
        toast.success('Paciente atualizado com sucesso!')
      } else {
        const error = await res.json()
        if (error.code === 'CONFLICT') {
          setFormErrors({ email: error.error || 'Email já cadastrado' })
        } else {
          toast.error('Erro ao atualizar paciente', {
            description: error.message || 'Tente novamente',
          })
        }
      }
    } catch (error) {
      console.error('Error updating patient:', error)
      toast.error('Erro ao atualizar paciente', {
        description: 'Tente novamente mais tarde',
      })
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
        toast.success('Paciente excluído com sucesso!')
      } else {
        const error = await res.json()
        toast.error('Erro ao excluir paciente', {
          description: error.message || 'Tente novamente',
        })
      }
    } catch (error) {
      console.error('Error deleting patient:', error)
      toast.error('Erro ao excluir paciente', {
        description: 'Tente novamente mais tarde',
      })
    }
  }

  const handleResetPassword = async (patientId: string) => {
    try {
      setIsResettingPassword(true)
      const res = await fetch(`/api/patients/${patientId}/reset-password`, {
        method: 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        setGeneratedPassword(data.data.generatedPassword)
        toast.success('Senha resetada com sucesso!', {
          description: `Nova senha: ${data.data.generatedPassword}`,
          duration: 15000,
        })
      } else {
        const error = await res.json()
        toast.error('Erro ao resetar senha', {
          description: error.error || 'Tente novamente',
        })
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error('Erro ao resetar senha', {
        description: 'Tente novamente mais tarde',
      })
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleEditPatient = (id: string) => {
    const patient = patients.find(p => p.id === id)
    if (patient) {
      setEditingPatient(patient)
      setGeneratedPassword(null)
      setIsModalOpen(true)
    }
  }

  const handleViewHistory = (id: string) => {
    router.push(`/patients/${id}/history`)
  }

  const handleCreate = () => {
    setEditingPatient(undefined)
    setGeneratedPassword(null)
    setIsModalOpen(true)
  }

  const handleEditResponsible = async (patientId: string, responsible: ResponsibleContact) => {
    setEditingResponsible(responsible)
    setEditingResponsiblePatientId(patientId)
    setIsResponsibleModalOpen(true)
  }

  const handleUpdateResponsible = async (data: {
    name: string
    email: string
    phone: string
    cpf: string
    relationship: string
  }) => {
    if (!editingResponsible || !editingResponsiblePatientId) return

    try {
      setSubmitting(true)
      const res = await fetch(`/api/responsibles/${editingResponsible.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setIsResponsibleModalOpen(false)
        setEditingResponsible(null)
        setEditingResponsiblePatientId(null)
        fetchPatients()
        fetchResponsibles()
        toast.success('Responsável atualizado com sucesso!')
      } else {
        const error = await res.json()
        toast.error('Erro ao atualizar responsável', {
          description: error.message || 'Tente novamente',
        })
      }
    } catch (error) {
      console.error('Error updating responsible:', error)
      toast.error('Erro ao atualizar responsável', {
        description: 'Tente novamente mais tarde',
      })
    } finally {
      setSubmitting(false)
    }
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
          onViewHistory={handleViewHistory}
          onEditResponsible={handleEditResponsible}
          isLoading={loading}
        />
      </main>

      <PatientModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingPatient(undefined); setFormErrors({}); setGeneratedPassword(null); }}
        onSubmit={editingPatient ? handleUpdatePatient : handleCreatePatient}
        onResetPassword={editingPatient ? () => handleResetPassword(editingPatient.id) : undefined}
        isResettingPassword={isResettingPassword}
        initialData={editingPatient as Parameters<typeof PatientModal>[0]['initialData']}
        responsibles={responsibles as Parameters<typeof PatientModal>[0]['responsibles']}
        isLoading={submitting}
        errors={formErrors}
        generatedPassword={generatedPassword}
      />

      <ResponsibleModal
        isOpen={isResponsibleModalOpen}
        onClose={() => { setIsResponsibleModalOpen(false); setEditingResponsible(null); setEditingResponsiblePatientId(null); }}
        onSubmit={handleUpdateResponsible}
        responsible={editingResponsible!}
        isLoading={submitting}
      />
    </div>
  )
}
