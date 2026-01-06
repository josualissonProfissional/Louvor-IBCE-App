// Página administrativa principal
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'

export default async function AdminPage() {
  await requireAdmin()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        Painel Administrativo
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/usuarios"
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 ease-in-out transform"
        >
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            Usuários
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gerenciar usuários do sistema
          </p>
        </Link>

        <Link
          href="/admin/instrumentos"
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 ease-in-out transform"
        >
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            Instrumentos
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Cadastrar instrumentos musicais
          </p>
        </Link>

        <Link
          href="/admin/dias-atuacao"
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 ease-in-out transform"
        >
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            Dias de Atuação
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Definir dias de atuação do grupo
          </p>
        </Link>

        <Link
          href="/musicas/nova"
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 ease-in-out transform"
        >
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            Nova Música
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Adicionar música com cifra e letra
          </p>
        </Link>

        <Link
          href="/escalas/nova"
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 ease-in-out transform"
        >
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            Nova Escala
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Criar nova escala de atuação
          </p>
        </Link>

        <Link
          href="/admin/disponibilidade"
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 ease-in-out transform"
        >
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            Disponibilidade
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Ver disponibilidade de todos os membros
          </p>
        </Link>
      </div>
    </div>
  )
}




