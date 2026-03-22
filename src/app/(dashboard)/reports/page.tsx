'use client'

import { useState, useEffect } from 'react'
import { useSessionContext } from '@/contexts/SessionContext'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function ReportsPage() {
  const { status } = useSessionContext()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState<'individual' | 'consolidated'>('consolidated')
  const [patientId, setPatientId] = useState('')
  const [patients, setPatients] = useState<Array<{ id: string; name: string }>>([])
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchPatients()
    }
  }, [status, router])

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients?limit=100')
      if (res.ok) {
        const data = await res.json()
        setPatients(data.patients || [])
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }

  const generateReport = async () => {
    if (reportType === 'individual' && !patientId) {
      toast.error('Selecione um paciente')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: reportType,
          patientId: reportType === 'individual' ? patientId : undefined,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        
        const blob = new Blob([data.html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = data.filename
        a.click()
        URL.revokeObjectURL(url)
        
        toast.success('Relatório gerado com sucesso!')
      } else {
        toast.error('Erro ao gerar relatório')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Erro ao gerar relatório')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
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
            Relatórios
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Gerar Relatório
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Relatório
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="reportType"
                    value="consolidated"
                    checked={reportType === 'consolidated'}
                    onChange={() => setReportType('consolidated')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Consolidado</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="reportType"
                    value="individual"
                    checked={reportType === 'individual'}
                    onChange={() => setReportType('individual')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Individual (por paciente)</span>
                </label>
              </div>
            </div>

            {reportType === 'individual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selecione o Paciente
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Selecione...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Início
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Gerando...' : 'Gerar Relatório'}
            </button>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
            📋 Relatório Consolidado
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Contém estatísticas gerais: total de atendimentos, taxa de comparecimento, 
            lista de pacientes faltosos e atendimentos por profissional.
          </p>
        </div>

        <div className="mt-4 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h3 className="font-medium text-green-900 dark:text-green-300 mb-2">
            📋 Relatório Individual
          </h3>
          <p className="text-sm text-green-700 dark:text-green-400">
            Contém o histórico completo de consultas de um paciente específico, 
            incluindo comparecimentos e faltas.
          </p>
        </div>
      </main>
    </div>
  )
}
