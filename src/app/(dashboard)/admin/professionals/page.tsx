'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { toast } from '@/components/ui/toast'

interface Specialty {
  id: string
  name: string
  isActive?: boolean
}

interface Professional {
  id: string
  userId: string
  name: string
  email: string
  specialty: Specialty | null
  licenseNumber: string | null
  bio: string | null
  isActive: boolean
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function ProfessionalsPage() {
  const { status, data: session } = useSession()
  const router = useRouter()
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [userId, setUserId] = useState('')
  const [specialtyId, setSpecialtyId] = useState('')
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [licenseNumber, setLicenseNumber] = useState('')
  const [bio, setBio] = useState('')

  const [showNewSpecialty, setShowNewSpecialty] = useState(false)
  const [newSpecialtyName, setNewSpecialtyName] = useState('')
  const [newSpecialtyDesc, setNewSpecialtyDesc] = useState('')
  const [creatingSpecialty, setCreatingSpecialty] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN' && session?.user?.role !== 'COORDINATOR') {
      router.push('/')
    }
  }, [status, session, router])

  const fetchProfessionals = async () => {
    try {
      const res = await fetch('/api/professionals?limit=100')
      const data = await res.json()
      if (res.ok) {
        setProfessionals(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching professionals:', error)
      toast.error('Erro ao carregar profissionais')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users?role=PROFESSIONAL&limit=100')
      const data = await res.json()
      if (res.ok) {
        const availableUsers = (data.data || []).filter((user: User) => 
          !professionals.some(p => p.userId === user.id)
        )
        setUsers(availableUsers)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }, [professionals])

  const fetchSpecialties = async () => {
    try {
      const res = await fetch('/api/specialties?limit=100')
      const data = await res.json()
      if (res.ok) {
        setSpecialties((data.data || []).filter((s: Specialty) => s.isActive !== false))
      }
    } catch (error) {
      console.error('Error fetching specialties:', error)
    }
  }

  const handleCreateSpecialty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSpecialtyName.trim()) {
      toast.error('Nome da especialidade é obrigatório')
      return
    }

    try {
      setCreatingSpecialty(true)
      const res = await fetch('/api/specialties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSpecialtyName.trim(),
          description: newSpecialtyDesc.trim() || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        await fetchSpecialties()
        setSpecialtyId(data.data.id)
        setShowNewSpecialty(false)
        setNewSpecialtyName('')
        setNewSpecialtyDesc('')
        toast.success('Especialidade criada!')
      } else {
        const error = await res.json()
        toast.error('Erro', { description: error.message || error.error })
      }
    } catch (error) {
      console.error('Error creating specialty:', error)
      toast.error('Erro ao criar especialidade')
    } finally {
      setCreatingSpecialty(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfessionals()
      fetchSpecialties()
    }
  }, [status])

  useEffect(() => {
    if (isModalOpen && !editingProfessional) {
      fetchAvailableUsers()
    }
  }, [isModalOpen, editingProfessional, fetchAvailableUsers])

  const handleOpenModal = (professional?: Professional) => {
    if (professional) {
      setEditingProfessional(professional)
      setUserId('')
      setSpecialtyId(professional.specialty?.id || '')
      setLicenseNumber(professional.licenseNumber || '')
      setBio(professional.bio || '')
    } else {
      setEditingProfessional(null)
      setUserId('')
      setSpecialtyId('')
      setLicenseNumber('')
      setBio('')
    }
    setShowNewSpecialty(false)
    setNewSpecialtyName('')
    setNewSpecialtyDesc('')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProfessional(null)
    setShowNewSpecialty(false)
    setNewSpecialtyName('')
    setNewSpecialtyDesc('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingProfessional && (!userId || userId.length === 0)) {
      toast.error('Selecione um usuário')
      return
    }

    try {
      setSubmitting(true)
      
      if (editingProfessional) {
        const res = await fetch(`/api/professionals/${editingProfessional.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            specialtyId: specialtyId || undefined,
            licenseNumber: licenseNumber || undefined,
            bio: bio || undefined,
          }),
        })

        if (res.ok) {
          toast.success('Profissional atualizado!')
          handleCloseModal()
          fetchProfessionals()
        } else {
          const error = await res.json()
          toast.error('Erro', { description: error.message || error.error })
        }
      } else {
        const res = await fetch('/api/professionals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            specialtyId: specialtyId || undefined,
            licenseNumber: licenseNumber || undefined,
            bio: bio || undefined,
          }),
        })

        if (res.ok) {
          toast.success('Profissional criado!')
          handleCloseModal()
          fetchProfessionals()
        } else {
          const error = await res.json()
          toast.error('Erro', { description: error.message || error.error })
        }
      }
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Erro ao salvar')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (professional: Professional) => {
    try {
      const res = await fetch(`/api/professionals/${professional.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !professional.isActive }),
      })

      if (res.ok) {
        toast.success(professional.isActive ? 'Profissional desativado' : 'Profissional ativado')
        fetchProfessionals()
      }
    } catch (error) {
      console.error('Error toggling:', error)
      toast.error('Erro ao atualizar')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este profissional?')) return

    try {
      const res = await fetch(`/api/professionals/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Profissional excluído')
        fetchProfessionals()
      }
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Erro ao excluir')
    }
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
                Profissionais
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gerencie os profissionais da clínica
              </p>
            </div>
            <Button onClick={() => handleOpenModal()}>
              + Novo Profissional
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Especialidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Conselho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {professionals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Nenhum profissional cadastrado
                  </td>
                </tr>
              ) : (
                professionals.map((professional) => (
                  <tr key={professional.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {professional.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {professional.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {professional.specialty?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {professional.licenseNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        professional.isActive
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {professional.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleOpenModal(professional)}
                        className="text-blue-600 hover:text-blue-700 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleActive(professional)}
                        className={`mr-4 ${professional.isActive ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}`}
                      >
                        {professional.isActive ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => handleDelete(professional.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={handleCloseModal} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingProfessional && (
                <Select
                  id="user"
                  label="Usuário *"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  options={[
                    { value: '', label: 'Selecione...' },
                    ...users.map(u => ({
                      value: u.id,
                      label: `${u.name} (${u.email})`,
                    })),
                  ]}
                />
              )}

              {!showNewSpecialty ? (
                <div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Select
                        id="specialty"
                        label="Especialidade"
                        value={specialtyId}
                        onChange={(e) => setSpecialtyId(e.target.value)}
                        options={[
                          { value: '', label: 'Selecione (opcional)' },
                          ...specialties.map(s => ({ value: s.id, label: s.name }))
                        ]}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewSpecialty(true)}
                      className="mb-0.5 text-sm"
                    >
                      + Nova
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
                    Nova Especialidade
                  </h4>
                  <form onSubmit={handleCreateSpecialty} className="space-y-3">
                    <Input
                      id="newSpecialtyName"
                      label="Nome *"
                      value={newSpecialtyName}
                      onChange={(e) => setNewSpecialtyName(e.target.value)}
                      placeholder="Ex: Psicologia"
                    />
                    <Input
                      id="newSpecialtyDesc"
                      label="Descrição"
                      value={newSpecialtyDesc}
                      onChange={(e) => setNewSpecialtyDesc(e.target.value)}
                      placeholder="Breve descrição (opcional)"
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={creatingSpecialty}>
                        {creatingSpecialty ? 'Criando...' : 'Criar'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowNewSpecialty(false)
                          setNewSpecialtyName('')
                          setNewSpecialtyDesc('')
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              <Input
                id="licenseNumber"
                label="Número do Conselho"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="Ex: CRP 06/123456"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Biografia
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Breve biografia do profissional..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
