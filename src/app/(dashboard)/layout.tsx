'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSessionContext } from '@/contexts/SessionContext'
import { ErrorBoundary } from '@/components/providers/ErrorBoundary'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { data: session, status } = useSessionContext()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'unauthenticated') {
    return null
  }

  if (status === 'loading' || !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  const isAdmin = session.user.role === 'ADMIN'
  const isCoordinator = session.user.role === 'COORDINATOR'
  const isPatientOrResponsible = session.user.role === 'PATIENT' || session.user.role === 'RESPONSIBLE'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" role="navigation" aria-label="Navegação principal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400" aria-label="Página inicial">
                Clínica Altamente
              </Link>
              <div className="hidden sm:flex items-center gap-6">
                {isAdmin && (
                  <>
                    <Link 
                      href="/admin/users" 
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                      aria-label="Gerenciar usuários"
                    >
                      Usuários
                    </Link>
                    <Link 
                      href="/admin/professionals" 
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                      aria-label="Gerenciar profissionais"
                    >
                      Profissionais
                    </Link>
                  </>
                )}
                
                {isPatientOrResponsible ? (
                  <>
                    <Link 
                      href="/calendar" 
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                      aria-label="Meus agendamentos"
                    >
                      Meus Agendamentos
                    </Link>
                    <Link 
                      href="/profile" 
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                      aria-label="Meu perfil"
                    >
                      Meu Perfil
                    </Link>
                    <Link 
                      href="/settings/calendar" 
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                      aria-label="Integrações"
                    >
                      Integrações
                    </Link>
                    {session.user.role === 'RESPONSIBLE' && (
                      <Link 
                        href="/responsibles" 
                        className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                        aria-label="Portal do Responsável"
                      >
                        Meus Dependentes
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link 
                      href="/calendar" 
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                      aria-label="Calendário de consultas"
                    >
                      Calendário
                    </Link>
                    <Link 
                      href="/patients" 
                      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                      aria-label="Lista de pacientes"
                    >
                      Pacientes
                    </Link>
                    {(isAdmin || isCoordinator) && (
                      <Link 
                        href="/dashboard" 
                        className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                        aria-label="Dashboard e relatórios"
                      >
                        Dashboard
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-300" aria-label={`Usuário: ${session.user.name}`}>
                {session.user.name}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </div>
  )
}

function LogoutButton() {
  const handleLogout = async () => {
    const { signOut } = await import('next-auth/react')
    await signOut({ redirect: true, redirectTo: '/' })
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-sm text-red-600 hover:text-red-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
      aria-label="Sair da conta"
    >
      Sair
    </button>
  )
}
