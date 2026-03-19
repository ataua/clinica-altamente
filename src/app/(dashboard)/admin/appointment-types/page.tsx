'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { toast } from '@/components/ui/toast'

interface AppointmentType {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  isActive: boolean
}

export default function AppointmentTypesPage() {
  const { status, data: session } = useSession()
  const router = useRouter()
  const [types, setTypes] = useState<AppointmentType[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingType, setEditingType] = useState<AppointmentType | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('60')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN' && session?.user?.role !== 'COORDINATOR') {
      router.push('/')
    }
  }, [status, session, router])

  const fetchTypes = async () => {
    try {
      const res = await fetch('/api/appointment-types')
      const data = await res.json()
      if (res.ok) {
        setTypes(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching types:', error)
      toast.error('Erro ao carregar tipos de agendamento')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTypes()
    }
  }, [status])

  const handleOpenModal = (type?: AppointmentType) => {
    if (type) {
      setEditingType(type)
      setName(type.name)
      setDescription(type.description || '')
      setDurationMinutes(type.durationMinutes.toString())
    } else {
      setEditingType(null)
      setName('')
      setDescription('')
      setDurationMinutes('60')
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingType(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || name.length < 2) {
      toast.error('Nome é obrigatório')
      return
    }

    try {
      setSubmitting(true)
      const url = editingType 
        ? `/api/appointment-types/${editingType.id}` 
        : '/api/appointment-types'
      const method = editingType ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          durationMinutes: parseInt(durationMinutes) || 60,
        }),
      })

      if (res.ok) {
        toast.success(editingType ? 'Tipo atualizado!' : 'Tipo criado!')
        handleCloseModal()
        fetchTypes()
      } else {
        const error = await res.json()
        toast.error('Erro', { description: error.message || error.error })
      }
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Erro ao salvar')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (type: AppointmentType) => {
    try {
      const res = await fetch(`/api/appointment-types/${type.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !type.isActive }),
      })

      if (res.ok) {
        toast.success(type.isActive ? 'Tipo desativado' : 'Tipo ativado')
        fetchTypes()
      }
    } catch (error) {
      console.error('Error toggling:', error)
      toast.error('Erro ao atualizar')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de agendamento?')) return

    try {
      const res = await fetch(`/api/appointment-types/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Tipo excluído')
        fetchTypes()
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
                Tipos de Agendamento
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gerencie os tipos de atendimento disponíveis
              </p>
            </div>
            <Button onClick={() => handleOpenModal()}>
              + Novo Tipo
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
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Duração
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
              {types.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Nenhum tipo de agendamento cadastrado
                  </td>
                </tr>
              ) : (
                types.map((type) => (
                  <tr key={type.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {type.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {type.description || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-500 dark:text-gray-400">
                        {type.durationMinutes} min
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        type.isActive
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {type.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleOpenModal(type)}
                        className="text-blue-600 hover:text-blue-700 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleActive(type)}
                        className={`mr-4 ${type.isActive ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}`}
                      >
                        {type.isActive ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => handleDelete(type.id)}
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
              {editingType ? 'Editar Tipo de Agendamento' : 'Novo Tipo de Agendamento'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="name"
                label="Nome *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Avaliação Inicial"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Descrição do tipo de atendimento..."
                />
              </div>

              <Input
                id="durationMinutes"
                label="Duração (minutos) *"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="60"
              />

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
