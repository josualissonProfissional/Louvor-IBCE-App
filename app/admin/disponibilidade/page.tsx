// Página administrativa de disponibilidade de todos os membros
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate, getDayName } from '@/lib/utils'
import { Disponibilidade } from '@/types'

export default async function AdminDisponibilidadePage() {
  await requireAdmin()

  const supabase = createServerClient()

  // Busca todos os dias de atuação (ordenados por data)
  const { data: diasAtuacao } = await supabase
    .from('dias_atuacao')
    .select('*')
    .order('data', { ascending: true })

  // Busca todos os usuários (ordenados por nome)
  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('*')
    .order('nome', { ascending: true })

  // Busca todas as disponibilidades
  const { data: disponibilidades } = await supabase
    .from('disponibilidade')
    .select('*')
    .order('data', { ascending: true })

  // Cria um mapa para acesso rápido: disponibilidade[usuario_id][data] = status
  const disponibilidadeMap: { [key: string]: { [key: string]: 'disponivel' | 'indisponivel' } } = {}
  ;(disponibilidades as Disponibilidade[] | null)?.forEach((disp) => {
    if (!disponibilidadeMap[disp.usuario_id]) {
      disponibilidadeMap[disp.usuario_id] = {}
    }
    disponibilidadeMap[disp.usuario_id][disp.data] = disp.status
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-primary hover:underline mb-2 inline-block"
        >
          ← Voltar
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Disponibilidade dos Membros
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Visualize a disponibilidade de todos os membros em todas as datas de atuação
        </p>
      </div>

      {diasAtuacao && diasAtuacao.length > 0 && usuarios && usuarios.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-700 z-10">
                    Data
                  </th>
                  {usuarios.map((usuario) => (
                    <th
                      key={usuario.id}
                      className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]"
                    >
                      <div className="flex flex-col items-center">
                        <span className="font-semibold">
                          {(usuario as any).nome || usuario.email}
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          {usuario.cargo}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {diasAtuacao.map((dia) => {
                  const statusPorUsuario = usuarios.map((usuario) => {
                    const status = disponibilidadeMap[usuario.id]?.[dia.data]
                    return { usuario, status }
                  })

                  return (
                    <tr
                      key={dia.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-800 z-10">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(dia.data)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {getDayName(dia.data)}
                        </div>
                      </td>
                      {statusPorUsuario.map(({ usuario, status }) => (
                        <td
                          key={usuario.id}
                          className="px-3 py-3 text-center"
                        >
                          {status === 'disponivel' ? (
                            <div className="inline-flex items-center justify-center w-full px-2 py-1 bg-blue-500 text-white rounded text-xs font-semibold">
                              ✓ Disponível
                            </div>
                          ) : status === 'indisponivel' ? (
                            <div className="inline-flex items-center justify-center w-full px-2 py-1 bg-red-500 text-white rounded text-xs font-semibold">
                              ✗ Indisponível
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center w-full px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded text-xs">
                              Não informado
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
          {!diasAtuacao || diasAtuacao.length === 0 ? (
            <p>Nenhum dia de atuação cadastrado.</p>
          ) : (
            <p>Nenhum usuário cadastrado.</p>
          )}
        </div>
      )}

      {/* Legenda */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Legenda:
        </h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Disponível
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Indisponível
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Não informado
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}




