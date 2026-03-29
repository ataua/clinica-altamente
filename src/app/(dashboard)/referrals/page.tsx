'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSessionContext } from '@/contexts/SessionContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/atoms/Button'
import { toast } from '@/components/ui/toast'

interface Referral {
  id: string
  patientId: string
  patientName: string
  patientEmail: string | null
  teacherName: string
  reason: string
  observations: string | null
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  response: string | null
  referredDate: string
  responseDate: string | null
}

interface Patient {
  id: string
  name: string
}

interface Teacher {
  id: string
  name: string
}

const ALLOWED_ROLES = ['ADMIN', 'PROFESSIONAL', 'TEACHER']

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export default function ReferralsPage() {
  const { status, data: session } = useSessionContext()
  const router = useRouter()

  const [referrals, setReferrals] = useState<Referral[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null)
  const [formData, setFormData] = useState({
    patientId: '',
    teacherId: '',
    reason: '',
    observations: '',
  })
  const [responseData, setResponseData] = useState('')

  const userRole = session?.user?.role

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (userRole === 'TEACHER') {
        params.set('limit', '100')
      }

      const [referralsRes, patientsRes, teachersRes] = await Promise.all([
        fetch(`/api/referrals?${params}`),
        fetch('/api/patients/select?limit=100'),
        fetch('/api/teachers/select'),
      ])

      const referralsData = await referralsRes.json()
      const patientsData = await patientsRes.json()
      const teachersData = await teachersRes.json()

      if (referralsRes.ok) {
        setReferrals(referralsData.data || [])
      }
      if (patientsRes.ok) {
        setPatients(patientsData.data?.patients || [])
      }
      if (teachersRes.ok) {
        setTeachers(teachersData.data?.teachers || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [userRole])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && userRole && !ALLOWED_ROLES.includes(userRole)) {
      router.push('/')
    } else if (status === 'authenticated') {
      fetchData()
    }
  }, [status, userRole, router, fetchData])

  const handleSubmit = async () => {
    if (!formData.patientId || !formData.teacherId || !formData.reason) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success('Encaminhamento criado com sucesso!')
        setIsModalOpen(false)
        setFormData({ patientId: '', teacherId: '', reason: '', observations: '' })
        fetchData()
      } else {
        const error = await res.json()
        toast.error(error.message || 'Erro ao criar encaminhamento')
      }
    } catch {
      toast.error('Erro ao criar encaminhamento')
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/referrals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          response: newStatus === 'COMPLETED' || newStatus === 'CANCELLED' ? responseData : undefined,
        }),
      })

      if (res.ok) {
        toast.success('Encaminhamento atualizado!')
        setSelectedReferral(null)
        setResponseData('')
        fetchData()
      } else {
        toast.error('Erro ao atualizar encaminhamento')
      }
    } catch {
      toast.error('Erro ao atualizar encaminhamento')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR')
  }

  if (status === 'loading' || loading) {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Encaminhamentos
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gerencie os encaminhamentos de pacientes
              </p>
            </div>
            {(userRole === 'ADMIN' || userRole === 'PROFESSIONAL') && (
              <Button onClick={() => setIsModalOpen(true)}>
                + Novo Encaminhamento
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {referrals.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Nenhum encaminhamento encontrado.
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {referrals.map((referral) => (
                <div key={referral.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {referral.patientName}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[referral.status]}`}>
                          {statusLabels[referral.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Para: {referral.teacherName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {referral.reason}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Encaminhado em: {formatDate(referral.referredDate)}
                      </p>
                    </div>
                    <div className="ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReferral(referral)}
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Novo Encaminhamento
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Paciente *
                </label>
                <select
                  value={formData.patientId}
                  onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Selecione...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Professor/Especialista *
                </label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Selecione...</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motivo do Encaminhamento *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Descreva o motivo do encaminhamento..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações
                </label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Observações adicionais..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                Criar Encaminhamento
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedReferral(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Detalhes do Encaminhamento
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Paciente</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedReferral.patientName}</p>
                {selectedReferral.patientEmail && (
                  <p className="text-sm text-gray-500">{selectedReferral.patientEmail}</p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Para</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedReferral.teacherName}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Motivo</p>
                <p className="text-gray-900 dark:text-white">{selectedReferral.reason}</p>
              </div>

              {selectedReferral.observations && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Observações</p>
                  <p className="text-gray-900 dark:text-white">{selectedReferral.observations}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedReferral.status]}`}>
                  {statusLabels[selectedReferral.status]}
                </span>
              </div>

              {selectedReferral.response && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Resposta</p>
                  <p className="text-gray-900 dark:text-white">{selectedReferral.response}</p>
                </div>
              )}

              {userRole === 'TEACHER' && selectedReferral.status === 'PENDING' && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Resposta ao Encaminhamento
                  </label>
                  <textarea
                    value={responseData}
                    onChange={(e) => setResponseData(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Descreva a resposta ao encaminhamento..."
                  />
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => handleUpdateStatus(selectedReferral.id, 'IN_PROGRESS')}
                    >
                      Atualizar Status
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus(selectedReferral.id, 'COMPLETED')}
                    >
                      Concluir
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={() => setSelectedReferral(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
