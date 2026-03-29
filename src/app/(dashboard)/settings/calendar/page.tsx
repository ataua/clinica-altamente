'use client'

import { useState, useEffect } from 'react'
import { useSessionContext } from '@/contexts/SessionContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/atoms/Button'
import { toast } from '@/components/ui/toast'

interface CalendarStatus {
  google: boolean
  outlook: boolean
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'your-google-client-id'
const GOOGLE_REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/api/auth/google/callback` : ''
const OUTLOOK_CLIENT_ID = process.env.NEXT_PUBLIC_OUTLOOK_CLIENT_ID || 'your-outlook-client-id'
const OUTLOOK_REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/api/auth/outlook/callback` : ''

export default function CalendarSettingsPage() {
  const { status } = useSessionContext()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus>({
    google: false,
    outlook: false,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchCalendarStatus()
    }
  }, [status, router])

  const fetchCalendarStatus = async () => {
    try {
      const res = await fetch('/api/calendar-integration')
      const data = await res.json()
      if (res.ok) {
        setCalendarStatus(data.data.integrations)
      }
    } catch (error) {
      console.error('Error fetching calendar status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectGoogle = () => {
    setConnecting('google')
    const scope = 'https://www.googleapis.com/auth/calendar.events'
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`
    window.location.href = authUrl
  }

  const handleConnectOutlook = () => {
    setConnecting('outlook')
    const scope = 'Calendars.ReadWrite offline_access'
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${OUTLOOK_CLIENT_ID}&redirect_uri=${encodeURIComponent(OUTLOOK_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scope)}`
    window.location.href = authUrl
  }

  const handleDisconnect = async (provider: string) => {
    try {
      const res = await fetch(`/api/calendar-integration?provider=${provider}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success(`${provider === 'google' ? 'Google' : 'Outlook'} Calendar desconectado!`)
        fetchCalendarStatus()
      } else {
        toast.error('Erro ao desconectar')
      }
    } catch {
      toast.error('Erro ao desconectar')
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Integrações de Calendário
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Conecte seu calendário para sincronizar automaticamente os agendamentos
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zM9 18.75l-3-3 1.41-1.41L9 15.93l4.59-4.59L15 12.75l-6 6z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Google Calendar</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {calendarStatus.google ? 'Conectado' : 'Não conectado'}
                  </p>
                </div>
              </div>
              {calendarStatus.google ? (
                <Button
                  variant="outline"
                  onClick={() => handleDisconnect('google')}
                  disabled={connecting === 'google'}
                >
                  Desconectar
                </Button>
              ) : (
                <Button
                  onClick={handleConnectGoogle}
                  disabled={connecting === 'google'}
                >
                  {connecting === 'google' ? 'Conectando...' : 'Conectar'}
                </Button>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 3H3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H3V8h18v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Outlook Calendar</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {calendarStatus.outlook ? 'Conectado' : 'Não conectado'}
                  </p>
                </div>
              </div>
              {calendarStatus.outlook ? (
                <Button
                  variant="outline"
                  onClick={() => handleDisconnect('outlook')}
                  disabled={connecting === 'outlook'}
                >
                  Desconectar
                </Button>
              ) : (
                <Button
                  onClick={handleConnectOutlook}
                  disabled={connecting === 'outlook'}
                >
                  {connecting === 'outlook' ? 'Conectando...' : 'Conectar'}
                </Button>
              )}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
              Como funciona?
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <li>• Ao conectar seu calendário, os agendamentos serão sincronizados automaticamente</li>
              <li>• Quando uma consulta for agendada, um evento será criado no seu calendário</li>
              <li>• Você receberá lembretes automáticos do seu calendário preferido</li>
              <li>• Você pode desconectar a qualquer momento</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
