'use client'

import { useState, useEffect } from 'react'
import { useSessionContext } from '@/contexts/SessionContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/atoms/Button'
import { toast } from '@/components/ui/toast'

interface Backup {
  filename: string
  size: number
  createdAt: string
}

const ALLOWED_ROLES = ['ADMIN']

export default function BackupPage() {
  const { status, data: session } = useSessionContext()
  const router = useRouter()

  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)

  const userRole = session?.user?.role

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && userRole && !ALLOWED_ROLES.includes(userRole)) {
      router.push('/')
    } else if (status === 'authenticated') {
      fetchBackups()
    }
  }, [status, userRole, router])

  const fetchBackups = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/backup')
      const data = await res.json()
      if (res.ok) {
        setBackups(data.data?.backups || [])
      }
    } catch (error) {
      console.error('Error fetching backups:', error)
      toast.error('Erro ao carregar backups')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBackup = async () => {
    try {
      setCreating(true)
      const res = await fetch('/api/backup', { method: 'POST' })
      const data = await res.json()

      if (res.ok) {
        toast.success('Backup criado com sucesso!')
        fetchBackups()
      } else {
        toast.error(data.message || 'Erro ao criar backup')
      }
    } catch {
      toast.error('Erro ao criar backup')
    } finally {
      setCreating(false)
    }
  }

  const handleRestore = async (filename: string) => {
    if (!confirm(`Tem certeza que deseja restaurar o backup ${filename}? Todos os dados atuais serão substituídos.`)) {
      return
    }

    try {
      setRestoring(filename)
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      })

      if (res.ok) {
        toast.success('Backup restaurado com sucesso!')
      } else {
        const data = await res.json()
        toast.error(data.message || 'Erro ao restaurar backup')
      }
    } catch {
      toast.error('Erro ao restaurar backup')
    } finally {
      setRestoring(null)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR')
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
                Backup e Recuperação
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gerencie os backups do banco de dados
              </p>
            </div>
            <Button onClick={handleCreateBackup} disabled={creating}>
              {creating ? 'Criando...' : 'Criar Backup'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-yellow-900 dark:text-yellow-300 mb-2">
            ⚠️ Importante
          </h3>
          <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
            <li>• Backups são salvos localmente no diretório configurado</li>
            <li>• Apenas administradores podem criar e restaurar backups</li>
            <li>• A restauração substitui todos os dados atuais</li>
            <li>• Configure um cron job para backups automáticos diários</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Backups Disponíveis
            </h2>
          </div>

          {backups.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Nenhum backup encontrado. Clique em Criar Backup para gerar um.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Arquivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tamanho
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Data de Criação
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {backups.map((backup) => (
                  <tr key={backup.filename} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {backup.filename}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatSize(backup.size)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(backup.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRestore(backup.filename)}
                        disabled={restoring === backup.filename}
                      >
                        {restoring === backup.filename ? 'Restaurando...' : 'Restaurar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            Configuração de Backup Automático
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Para configurar backup automático diário, adicione ao crontab:
          </p>
          <code className="block bg-gray-900 dark:bg-gray-900 text-gray-100 p-3 rounded text-sm">
            0 3 * * * cd /caminho/do/projeto && bun run backup:cron
          </code>
        </div>
      </main>
    </div>
  )
}
