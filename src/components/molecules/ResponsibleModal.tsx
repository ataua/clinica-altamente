'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Button } from '@/components/atoms/Button'
import { formatPhone, formatCpf } from '@/lib/masks'

interface ResponsibleContact {
  id: string
  name: string
  email: string | null
  phone: string
  cpf: string | null
  relationship: string
}

interface ResponsibleModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    name: string
    email: string
    phone: string
    cpf: string
    relationship: string
  }) => void
  responsible: ResponsibleContact
  isLoading?: boolean
  errors?: Record<string, string>
}

const relationshipOptions = [
  { value: 'Pai', label: 'Pai' },
  { value: 'Mãe', label: 'Mãe' },
  { value: 'Responsável Legal', label: 'Responsável Legal' },
  { value: 'Avô/Avó', label: 'Avô/Avó' },
  { value: 'Tio/Tia', label: 'Tio/Tia' },
  { value: 'Irmão/Irmã', label: 'Irmão/Irmã' },
  { value: 'Outro', label: 'Outro' },
]

export function ResponsibleModal({ isOpen, onClose, onSubmit, responsible, isLoading, errors: externalErrors = {} }: ResponsibleModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [cpf, setCpf] = useState('')
  const [relationship, setRelationship] = useState('')

  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const errors = { ...localErrors, ...externalErrors }

  useEffect(() => {
    if (isOpen && responsible) {
      setName(responsible.name || '')
      setEmail(responsible.email || '')
      setPhone(formatPhone(responsible.phone))
      setCpf(responsible.cpf ? formatCpf(responsible.cpf) : '')
      setRelationship(responsible.relationship || '')
      setLocalErrors({})
    }
  }, [isOpen, responsible])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!name || name.length < 2) newErrors.name = 'Nome deve ter pelo menos 2 caracteres'
    if (email && !email.includes('@')) newErrors.email = 'Email inválido'
    if (!phone || phone.replace(/\D/g, '').length < 10) newErrors.phone = 'Telefone inválido'
    if (!relationship) newErrors.relationship = 'Parentesco é obrigatório'

    setLocalErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    onSubmit({
      name,
      email,
      phone: phone.replace(/\D/g, ''),
      cpf: cpf.replace(/\D/g, ''),
      relationship,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Editar Responsável
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="responsibleName"
            label="Nome Completo *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            placeholder="Nome completo"
          />
          
          <Input
            id="responsibleEmail"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            placeholder="email@exemplo.com"
          />
          
          <Input
            id="responsiblePhone"
            label="Telefone *"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            error={errors.phone}
            placeholder="(11) 99999-9999"
          />
          
          <Input
            id="responsibleCpf"
            label="CPF"
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            placeholder="000.000.000-00"
          />
          
          <Select
            id="responsibleRelationship"
            label="Parentesco *"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            options={relationshipOptions}
            error={errors.relationship}
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
