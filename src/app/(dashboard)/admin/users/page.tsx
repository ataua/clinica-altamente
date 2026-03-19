'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { UserTable } from '@/components/organisms/UserTable'
import { UserModal } from '@/components/molecules/UserModal'
import { toast } from '@/components/ui/toast'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'PROFESSIONAL' | 'SECRETARY' | 'PATIENT' | 'RESPONSIBLE' | 'TEACHER' | 'COORDINATOR'
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<{ id?: string; name: string; email: string; role: string } | undefined>()
  const [submitting, setSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)

      const res = await fetch(`/api/users?${params}`)
      const data = await res.json()
      
      if (res.ok) {
        setUsers(data.data || [])
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 })
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Erro ao carregar usuários', {
        description: 'Tente novamente mais tarde',
      })
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, search, roleFilter])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN' && session?.user?.role !== 'COORDINATOR') {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUsers()
    }
  }, [status, fetchUsers])

  const handleCreateUser = async (data: { name: string; email: string; password: string; role: string }) => {
    try {
      setSubmitting(true)
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setIsModalOpen(false)
        setFormErrors({})
        fetchUsers()
        toast.success('Usuário criado com sucesso!')
      } else {
        const error = await res.json()
        if (error.code === 'CONFLICT') {
          setFormErrors({ email: error.error || 'Email já cadastrado' })
        } else {
          toast.error('Erro ao criar usuário', {
            description: error.message || 'Verifique os dados e tente novamente',
          })
        }
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Erro ao criar usuário', {
        description: 'Tente novamente mais tarde',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateUser = async (data: { name: string; email: string; password?: string; role: string }) => {
    if (!editingUser?.id) return

    try {
      setSubmitting(true)
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setIsModalOpen(false)
        setEditingUser(undefined)
        setFormErrors({})
        fetchUsers()
        toast.success('Usuário atualizado com sucesso!')
      } else {
        const error = await res.json()
        if (error.code === 'CONFLICT') {
          setFormErrors({ email: error.error || 'Email já cadastrado' })
        } else {
          toast.error('Erro ao atualizar usuário', {
            description: error.message || 'Verifique os dados e tente novamente',
          })
        }
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Erro ao atualizar usuário', {
        description: 'Tente novamente mais tarde',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      
      if (res.ok) {
        fetchUsers()
        toast.success('Usuário excluído com sucesso!')
      } else {
        const error = await res.json()
        toast.error('Erro ao excluir usuário', {
          description: error.message || 'Tente novamente',
        })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Erro ao excluir usuário', {
        description: 'Tente novamente mais tarde',
      })
    }
  }

  const handleEditUser = (id: string) => {
    const user = users.find(u => u.id === id)
    if (user) {
      setEditingUser({ id, name: user.name, email: user.email, role: user.role })
      setIsModalOpen(true)
    }
  }

  if (status === 'loading' || loading && users.length === 0) {
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gerenciamento de Usuários
            </h1>
            <Button onClick={() => { setEditingUser(undefined); setIsModalOpen(true); }}>
              + Novo Usuário
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            />
          </div>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: '', label: 'Todos os perfis' },
              { value: 'ADMIN', label: 'Administrador' },
              { value: 'PROFESSIONAL', label: 'Profissional' },
              { value: 'SECRETARY', label: 'Recepcionista' },
              { value: 'PATIENT', label: 'Paciente' },
              { value: 'COORDINATOR', label: 'Coordenador' },
            ]}
            className="w-full sm:w-48"
          />
          <Button variant="outline" onClick={fetchUsers}>
            Buscar
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            </div>
          ) : (
            <UserTable
              users={users}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
            />
          )}
          
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} usuários
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingUser(undefined); setFormErrors({}); }}
        onSubmit={editingUser?.id ? handleUpdateUser : handleCreateUser}
        initialData={editingUser}
        isLoading={submitting}
        errors={formErrors}
        onClearErrors={() => setFormErrors({})}
      />
    </div>
  )
}
