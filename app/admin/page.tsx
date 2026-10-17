// Página administrativa principal
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.lider && !user.tesoureiro) redirect('/')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {user.lider ? 'Painel Administrativo' : 'Painel da Tesouraria'}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {user.lider
            ? 'Acesso total aos módulos do ministério de louvor e finanças'
            : 'Gerenciamento de mensalidades e contribuições do ministério'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/mensalidades"
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 ease-in-out transform border-l-4 border-amber-500"
        >
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white flex items-center gap-2">
            <span>💰</span> Tesouraria & Mensalidades
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gerenciar mensalidades, ciclos, pagamentos e chave PIX
          </p>
        </Link>

        {user.lider && (
          <>
            <Link
              href="/admin/usuarios"
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 ease-in-out transform"
            >
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Usuários
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Gerenciar usuários e nomear tesoureiro
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
          </>
        )}
      </div>
    </div>
  )
}




