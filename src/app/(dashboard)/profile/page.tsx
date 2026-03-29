'use client'

import { useState, useEffect } from 'react'
import { useSessionContext } from '@/contexts/SessionContext'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Button } from '@/components/atoms/Button'
import { toast } from '@/components/ui/toast'

interface PatientFormData {
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
  emergencyContact: {
    name: string
    email: string
    phone: string
    cpf: string
    relationship: string
  }
  observations: string
}

export default function ProfilePage() {
  const { status, data: session } = useSessionContext()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [patientId, setPatientId] = useState<string | null>(null)
  const [hasPatientRecord, setHasPatientRecord] = useState<boolean | null>(null)
  const [formData, setFormData] = useState<PatientFormData>({
    phone: '',
    cpf: '',
    dateOfBirth: '',
    gender: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
    },
    emergencyContact: {
      name: '',
      email: '',
      phone: '',
      cpf: '',
      relationship: '',
    },
    observations: '',
  })

  const [consents, setConsents] = useState({
    dataUsage: false,
    marketing: false,
  })

  const isPatientOrResponsible = session?.user?.role === 'PATIENT' || session?.user?.role === 'RESPONSIBLE'

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated' && !isPatientOrResponsible) {
      router.push('/')
      return
    }
  }, [status, router, isPatientOrResponsible])

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!session?.user?.id) return

      try {
        setLoading(true)
        const res = await fetch('/api/patients/me')
        if (res.ok) {
          const data = await res.json()
          if (data.data) {
            setPatientId(data.data.id)
            setHasPatientRecord(true)
            const patient = data.data
            setFormData({
              phone: patient.phone || '',
              cpf: patient.cpf || '',
              dateOfBirth: patient.dateOfBirth?.split('T')[0] || '',
              gender: patient.gender || '',
              address: patient.address || {
                street: '',
                number: '',
                complement: '',
                neighborhood: '',
                city: '',
                state: '',
                zipCode: '',
              },
              emergencyContact: patient.responsibleContact ? {
                name: patient.responsibleContact.name || '',
                email: patient.responsibleContact.email || '',
                phone: patient.responsibleContact.phone || '',
                cpf: patient.responsibleContact.cpf || '',
                relationship: patient.responsibleContact.relationship || '',
              } : {
                name: '',
                email: '',
                phone: '',
                cpf: '',
                relationship: '',
              },
              observations: patient.observations || patient.notes || '',
            })
          } else {
            setHasPatientRecord(false)
          }
        } else if (res.status === 404) {
          setHasPatientRecord(false)
        }

        const consentsRes = await fetch('/api/lgpd/consent')
        if (consentsRes.ok) {
          const consentsData = await consentsRes.json()
          const consentsObj: Record<string, boolean> = {}
          ;(consentsData.data?.consents || []).forEach((c: { consentType: string; consentGiven: boolean }) => {
            consentsObj[c.consentType] = c.consentGiven
          })
          setConsents(prev => ({ ...prev, ...consentsObj }))
        }
      } catch (error) {
        console.error('Error fetching patient data:', error)
        setHasPatientRecord(false)
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated' && isPatientOrResponsible) {
      fetchPatientData()
    }
  }, [status, isPatientOrResponsible, session?.user?.id])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const fields = field.split('.')
      if (fields.length === 1) {
        return { ...prev, [field]: value }
      }
      const [parent, child] = fields
      return {
        ...prev,
        [parent]: {
          ...prev[parent as keyof PatientFormData] as Record<string, string>,
          [child]: value,
        },
      }
    })
  }

  const handleConsentChange = async (consentType: string, consentGiven: boolean) => {
    try {
      await fetch('/api/lgpd/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentType, consentGiven }),
      })
      setConsents(prev => ({ ...prev, [consentType]: consentGiven }))
      toast.success('Consentimento atualizado com sucesso!')
    } catch {
      toast.error('Erro ao atualizar consentimento')
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Tem certeza que deseja excluir sua conta? Esta ação é irreversível e todos os seus dados serão anonimizados.')) {
      return
    }

    try {
      const res = await fetch('/api/lgpd/anonymize', {
        method: 'POST',
      })

      if (res.ok) {
        toast.success('Conta excluída com sucesso')
      } else {
        toast.error('Erro ao excluir conta')
      }
    } catch {
      toast.error('Erro ao excluir conta')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      let res: Response

      if (hasPatientRecord && patientId) {
        res = await fetch(`/api/patients/${patientId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: formData.phone,
            cpf: formData.cpf,
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            address: formData.address,
            responsibleContact: formData.emergencyContact.name ? {
              name: formData.emergencyContact.name,
              email: formData.emergencyContact.email,
              phone: formData.emergencyContact.phone,
              cpf: formData.emergencyContact.cpf,
              relationship: formData.emergencyContact.relationship,
            } : undefined,
            notes: formData.observations,
          }),
        })
      } else {
        res = await fetch('/api/patients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: session?.user?.name,
            email: session?.user?.email,
            phone: formData.phone,
            cpf: formData.cpf,
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            address: formData.address,
            responsibleContact: formData.emergencyContact.name ? {
              name: formData.emergencyContact.name,
              email: formData.emergencyContact.email,
              phone: formData.emergencyContact.phone,
              cpf: formData.emergencyContact.cpf,
              relationship: formData.emergencyContact.relationship,
            } : undefined,
            notes: formData.observations,
          }),
        })
      }

      if (res.ok) {
        toast.success(hasPatientRecord ? 'Perfil atualizado com sucesso!' : 'Cadastro realizado com sucesso!')
        if (!hasPatientRecord) {
          const data = await res.json()
          setPatientId(data.data?.id)
          setHasPatientRecord(true)
        }
      } else {
        const error = await res.json()
        toast.error('Erro ao salvar', {
          description: error.message || 'Verifique os dados e tente novamente',
        })
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Erro ao salvar perfil', {
        description: 'Tente novamente mais tarde',
      })
    } finally {
      setSubmitting(false)
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {hasPatientRecord ? 'Meu Perfil' : 'Complete seu Cadastro'}
          </h1>
          {!hasPatientRecord && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Para acessar todos os recursos, complete seu cadastro abaixo.
            </p>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Dados Pessoais
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={session?.user?.name || ''}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={session?.user?.email || ''}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Telefone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
                <Input
                  label="CPF"
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange('cpf', e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Data de Nascimento"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
                <Select
                  label="Gênero"
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  options={[
                    { value: '', label: 'Selecione...' },
                    { value: 'M', label: 'Masculino' },
                    { value: 'F', label: 'Feminino' },
                    { value: 'O', label: 'Outro' },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Endereço
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Rua"
                    value={formData.address.street}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Número"
                  value={formData.address.number}
                  onChange={(e) => handleInputChange('address.number', e.target.value)}
                />
                <Input
                  label="Complemento"
                  value={formData.address.complement}
                  onChange={(e) => handleInputChange('address.complement', e.target.value)}
                />
                <Input
                  label="Bairro"
                  value={formData.address.neighborhood}
                  onChange={(e) => handleInputChange('address.neighborhood', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Cidade"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                />
                <Input
                  label="Estado"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                />
                <Input
                  label="CEP"
                  value={formData.address.zipCode}
                  onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Contato de Emergência
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome do Responsável"
                  value={formData.emergencyContact.name}
                  onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                />
                <Input
                  label="Parentesco"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                  placeholder="Ex: Mãe, Pai, Cônjuge"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Telefone"
                  type="tel"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
                <Input
                  label="E-mail"
                  type="email"
                  value={formData.emergencyContact.email}
                  onChange={(e) => handleInputChange('emergencyContact.email', e.target.value)}
                />
                <Input
                  label="CPF"
                  value={formData.emergencyContact.cpf}
                  onChange={(e) => handleInputChange('emergencyContact.cpf', e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Observações
            </h2>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Alergias, medicamentos em uso, condições de saúde..."
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              LGPD - Proteção de Dados
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direitos sobre seus dados pessoais.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="consentDataUsage"
                  checked={consents.dataUsage || false}
                  onChange={(e) => handleConsentChange('dataUsage', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="consentDataUsage" className="text-sm text-gray-700 dark:text-gray-300">
                  Concordo com o uso dos meus dados para fins de atendimento
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="consentMarketing"
                  checked={consents.marketing || false}
                  onChange={(e) => handleConsentChange('marketing', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="consentMarketing" className="text-sm text-gray-700 dark:text-gray-300">
                  Gostaria de receber comunicações e novidades da clínica
                </label>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                <strong>Exclusão de Dados:</strong> Você pode solicitar a exclusão/anonymização dos seus dados a qualquer momento.
              </p>
              <Button
                type="button"
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={submitting}
              >
                Excluir Minha Conta
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Salvando...' : hasPatientRecord ? 'Salvar Alterações' : 'Concluir Cadastro'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
