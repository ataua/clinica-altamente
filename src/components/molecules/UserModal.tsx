'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Button } from '@/components/atoms/Button'

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; email: string; password: string; role: string }) => void
  initialData?: {
    name: string
    email: string
    role: string
  }
  isLoading?: boolean
}

const roleOptions = [
  { value: 'PATIENT', label: 'Paciente' },
  { value: 'PROFESSIONAL', label: 'Profissional' },
  { value: 'SECRETARY', label: 'Recepcionista' },
  { value: 'COORDINATOR', label: 'Coordenador' },
  { value: 'RESPONSIBLE', label: 'Responsável' },
  { value: 'TEACHER', label: 'Professor' },
  { value: 'ADMIN', label: 'Administrador' },
]

export function UserModal({ isOpen, onClose, onSubmit, initialData, isLoading }: UserModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('PATIENT')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [initialized, setInitialized] = useState(false)

  // eslint-disable-next-line
  useEffect(() => {
    if (!initialized) {
      setInitialized(true)
      if (initialData) {
        setName(initialData.name)
        setEmail(initialData.email)
        setRole(initialData.role)
      } else {
        setName('')
        setEmail('')
        setPassword('')
        setRole('PATIENT')
      }
      setErrors({})
    }
  }, [initialized, initialData])

  // eslint-disable-next-line
  useEffect(() => {
    if (isOpen) {
      setInitialized(false)
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    if (!name || name.length < 2) newErrors.name = 'Nome deve ter pelo menos 2 caracteres'
    if (!email || !email.includes('@')) newErrors.email = 'Email inválido'
    if (!initialData && (!password || password.length < 6)) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit({ name, email, password, role })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {initialData ? 'Editar Usuário' : 'Criar Novo Usuário'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            label="Nome Completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            placeholder="Seu nome"
          />
          
          <Input
            id="email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            placeholder="seu@email.com"
          />
          
          {!initialData && (
            <Input
              id="password"
              type="password"
              label="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              placeholder="Mínimo 6 caracteres"
            />
          )}
          
          <Select
            id="role"
            label="Tipo de Conta"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={roleOptions}
          />
          
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Salvando...' : initialData ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
