'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Button } from '@/components/atoms/Button'

interface ResponsibleContact {
  id: string
  name: string
  email: string | null
  phone: string
  cpf: string | null
  relationship: string
}

interface PatientModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    name: string
    email: string
    phone: string
    cpf: string
    dateOfBirth: string
    gender: string
    address: {
      street: string
      number: string
      complement: string
      neighborhood: string
      city: string
      state: string
      zipCode: string
    }
    responsibleContactId?: string
    responsibleContact?: {
      name: string
      email: string
      phone: string
      cpf: string
      relationship: string
    }
    notes: string
  }) => void
  initialData?: {
    id: string
    name: string
    email: string | null
    phone: string | null
    cpf: string | null
    dateOfBirth: string | null
    gender: string | null
    address: {
      street?: string
      number?: string
      complement?: string
      neighborhood?: string
      city?: string
      state?: string
      zipCode?: string
    } | null
    responsibleContact: ResponsibleContact | null
    notes: string | null
  }
  responsibles: ResponsibleContact[]
  isLoading?: boolean
  errors?: Record<string, string>
}

const genderOptions = [
  { value: '', label: 'Selecione...' },
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMININO', label: 'Feminino' },
  { value: 'OUTRO', label: 'Outro' },
]

const relationshipOptions = [
  { value: 'Pai', label: 'Pai' },
  { value: 'Mãe', label: 'Mãe' },
  { value: 'Responsável Legal', label: 'Responsável Legal' },
  { value: 'Avô/Avó', label: 'Avô/Avó' },
  { value: 'Tio/Tia', label: 'Tio/Tia' },
  { value: 'Irmão/Irmã', label: 'Irmão/Irmã' },
  { value: 'Outro', label: 'Outro' },
]

export function PatientModal({ isOpen, onClose, onSubmit, initialData, responsibles, isLoading, errors: externalErrors = {} }: PatientModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [cpf, setCpf] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [notes, setNotes] = useState('')
  
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')

  const [hasResponsible, setHasResponsible] = useState(false)
  const [selectedResponsibleId, setSelectedResponsibleId] = useState('')
  const [createNewResponsible, setCreateNewResponsible] = useState(false)
  
  const [responsibleName, setResponsibleName] = useState('')
  const [responsibleEmail, setResponsibleEmail] = useState('')
  const [responsiblePhone, setResponsiblePhone] = useState('')
  const [responsibleCpf, setResponsibleCpf] = useState('')
  const [responsibleRelationship, setResponsibleRelationship] = useState('')

  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const errors = { ...localErrors, ...externalErrors }

  useEffect(() => {
    if (!isOpen) return
    
    if (initialData) {
      setName(initialData.name || '')
      setEmail(initialData.email || '')
      setPhone(initialData.phone || '')
      setCpf(initialData.cpf || '')
      setDateOfBirth(initialData.dateOfBirth ? initialData.dateOfBirth.split('T')[0] : '')
      setGender(initialData.gender || '')
      setNotes(initialData.notes || '')
      
      if (initialData.address) {
        setStreet(initialData.address.street || '')
        setNumber(initialData.address.number || '')
        setComplement(initialData.address.complement || '')
        setNeighborhood(initialData.address.neighborhood || '')
        setCity(initialData.address.city || '')
        setState(initialData.address.state || '')
        setZipCode(initialData.address.zipCode || '')
      }

      if (initialData.responsibleContact) {
        setHasResponsible(true)
        setSelectedResponsibleId(initialData.responsibleContact.id)
      } else {
        setHasResponsible(false)
        setSelectedResponsibleId('')
      }
    } else {
      setName('')
      setEmail('')
      setPhone('')
      setCpf('')
      setDateOfBirth('')
      setGender('')
      setNotes('')
      setStreet('')
      setNumber('')
      setComplement('')
      setNeighborhood('')
      setCity('')
      setState('')
      setZipCode('')
      setHasResponsible(false)
      setSelectedResponsibleId('')
      setCreateNewResponsible(false)
      setResponsibleName('')
      setResponsibleEmail('')
      setResponsiblePhone('')
      setResponsibleCpf('')
      setResponsibleRelationship('')
    }
    setLocalErrors({})
  }, [initialData, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!name || name.length < 2) newErrors.name = 'Nome deve ter pelo menos 2 caracteres'
    if (email && !email.includes('@')) newErrors.email = 'Email inválido'
    
    if (hasResponsible) {
      if (createNewResponsible) {
        if (!responsibleName || responsibleName.length < 2) newErrors.responsibleName = 'Nome do responsável é obrigatório'
        if (!responsiblePhone) newErrors.responsiblePhone = 'Telefone do responsável é obrigatório'
        if (!responsibleRelationship) newErrors.responsibleRelationship = 'Parentesco é obrigatório'
      } else if (!selectedResponsibleId) {
        newErrors.responsible = 'Selecione um responsável ou crie um novo'
      }
    }

    setLocalErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const address = {
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
    }

    const hasAddress = Object.values(address).some(v => v)
    const formattedAddress = hasAddress ? {
      street: street || '',
      number: number || '',
      complement: complement || '',
      neighborhood: neighborhood || '',
      city: city || '',
      state: state || '',
      zipCode: zipCode || '',
    } : {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
    }

    const data: {
      name: string
      email: string
      phone: string
      cpf: string
      dateOfBirth: string
      gender: string
      address: {
        street: string
        number: string
        complement: string
        neighborhood: string
        city: string
        state: string
        zipCode: string
      }
      notes: string
      responsibleContactId?: string
      responsibleContact?: {
        name: string
        email: string
        phone: string
        cpf: string
        relationship: string
      }
    } = {
      name,
      email,
      phone,
      cpf,
      dateOfBirth,
      gender,
      address: formattedAddress,
      notes,
    }

    if (hasResponsible) {
      if (createNewResponsible) {
        data.responsibleContact = {
          name: responsibleName,
          email: responsibleEmail,
          phone: responsiblePhone,
          cpf: responsibleCpf,
          relationship: responsibleRelationship,
        }
      } else {
        data.responsibleContactId = selectedResponsibleId
      }
    }

    onSubmit(data)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 my-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 sticky top-0 bg-white dark:bg-gray-800 z-10">
            {initialData ? 'Editar Paciente' : 'Cadastrar Novo Paciente'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="name"
              label="Nome Completo *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              placeholder="Nome do paciente"
            />
            
            <Input
              id="email"
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="phone"
              label="Telefone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="11999999999"
            />
            
            <Input
              id="cpf"
              label="CPF"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="12345678901"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="dateOfBirth"
              type="date"
              label="Data de Nascimento"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
            
            <Select
              id="gender"
              label="Gênero"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              options={genderOptions}
            />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="street"
                label="Rua"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Rua exemplo"
              />
              <Input
                id="number"
                label="Número"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="123"
              />
              <Input
                id="complement"
                label="Complemento"
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                placeholder="Apto 1"
              />
              <Input
                id="neighborhood"
                label="Bairro"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Centro"
              />
              <Input
                id="city"
                label="Cidade"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="São Paulo"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id="state"
                  label="Estado"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="SP"
                />
                <Input
                  id="zipCode"
                  label="CEP"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="01000-000"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={hasResponsible}
                onChange={(e) => setHasResponsible(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Paciente menor de idade ou possui responsável
              </span>
            </label>

            {hasResponsible && (
              <div className="space-y-4">
                {!createNewResponsible ? (
                  <>
                    <Select
                      id="responsible"
                      label="Selecionar Responsável Existente"
                      value={selectedResponsibleId}
                      onChange={(e) => setSelectedResponsibleId(e.target.value)}
                      options={[
                        { value: '', label: 'Selecione...' },
                        ...responsibles.map(r => ({
                          value: r.id,
                          label: `${r.name} (${r.phone})`
                        }))
                      ]}
                      error={errors.responsible}
                    />
                    <button
                      type="button"
                      onClick={() => setCreateNewResponsible(true)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Criar novo responsável
                    </button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Novo Responsável
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        id="responsibleName"
                        label="Nome do Responsável *"
                        value={responsibleName}
                        onChange={(e) => setResponsibleName(e.target.value)}
                        error={errors.responsibleName}
                        placeholder="Nome completo"
                      />
                      <Input
                        id="responsibleEmail"
                        type="email"
                        label="Email"
                        value={responsibleEmail}
                        onChange={(e) => setResponsibleEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                      />
                      <Input
                        id="responsiblePhone"
                        label="Telefone *"
                        value={responsiblePhone}
                        onChange={(e) => setResponsiblePhone(e.target.value)}
                        error={errors.responsiblePhone}
                        placeholder="11999999999"
                      />
                      <Input
                        id="responsibleCpf"
                        label="CPF"
                        value={responsibleCpf}
                        onChange={(e) => setResponsibleCpf(e.target.value)}
                        placeholder="12345678901"
                      />
                      <Select
                        id="responsibleRelationship"
                        label="Parentesco *"
                        value={responsibleRelationship}
                        onChange={(e) => setResponsibleRelationship(e.target.value)}
                        options={relationshipOptions}
                        error={errors.responsibleRelationship}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setCreateNewResponsible(false)}
                      className="text-sm text-gray-500 hover:text-gray-600"
                    >
                      ← Selecionar responsável existente
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Alergias, medicamentos, histórico médico..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Salvando...' : initialData ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
