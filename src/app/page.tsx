"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

export default function Home() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (session?.user) {
    const role = session.user.role
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <main className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Bem-vindo, {session.user.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Selecione uma opção abaixo:
            </p>
          </div>

          <div className="grid gap-4">
            {(role === 'SECRETARY' || role === 'ADMIN' || role === 'COORDINATOR') && (
              <Link
                href="/calendar"
                className="block w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-center transition-colors flex items-center justify-center gap-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Criar Agendamento
              </Link>
            )}

            {role === 'PROFESSIONAL' && (
              <Link
                href="/calendar"
                className="block w-full py-4 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-center transition-colors flex items-center justify-center gap-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Ver Agenda
              </Link>
            )}

            {(role === 'PATIENT' || role === 'RESPONSIBLE') && (
              <Link
                href="/appointments"
                className="block w-full py-4 px-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-center transition-colors flex items-center justify-center gap-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Minhas Consultas
              </Link>
            )}

            <Link
              href="/patients"
              className="block w-full py-4 px-6 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg text-center transition-colors flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0M7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Pacientes
            </Link>

            <Link
              href="/calendar"
              className="block w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-center transition-colors flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendário
            </Link>

            {role === 'ADMIN' && (
              <>
                <Link
                  href="/admin/users"
                  className="block w-full py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-center transition-colors flex items-center justify-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Gerenciar Usuários
                </Link>
                <Link
                  href="/admin/professionals"
                  className="block w-full py-4 px-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg text-center transition-colors flex items-center justify-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Gerenciar Profissionais
                </Link>
                <Link
                  href="/admin/appointment-types"
                  className="block w-full py-4 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-center transition-colors flex items-center justify-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Tipos de Agendamento
                </Link>
              </>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full py-3 px-4 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-300 font-semibold rounded-lg text-center transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/api-docs"
              className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Documentação API (Swagger)
            </Link>
          </div>
        </main>
        
        <footer className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© 2026 Clínica Altamente - Sistema de Gestão</p>
        </footer>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <main className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Clínica Altamente
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sistema de Gestão de Consultas e Relatórios
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-center transition-colors"
          >
            Entrar
          </Link>
          
          <Link
            href="/register"
            className="block w-full py-3 px-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 text-gray-700 dark:text-gray-200 font-semibold rounded-lg text-center transition-colors"
          >
            Cadastrar
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
            Desenvolvedores
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/api-docs"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Documentação API (Swagger)
            </Link>
          </div>
        </div>
      </main>
      
      <footer className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>© 2026 Clínica Altamente - Sistema de Gestão</p>
      </footer>
    </div>
  )
}
