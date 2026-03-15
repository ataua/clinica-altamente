import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
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
  );
}
