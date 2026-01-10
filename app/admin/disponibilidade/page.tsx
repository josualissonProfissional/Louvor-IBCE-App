// Página administrativa de disponibilidade de todos os membros
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate, getDayName } from '@/lib/utils'
import { Disponibilidade, Usuario, DiaAtuacao } from '@/types'
import DisponibilidadeTable from '@/components/DisponibilidadeTable'

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Disponibilidade dos Membros
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Visualize a disponibilidade de todos os membros em todas as datas de atuação
          </p>
        </div>
      </div>

      {(diasAtuacao as DiaAtuacao[] | null) && (diasAtuacao as DiaAtuacao[]).length > 0 && (usuarios as Usuario[] | null) && (usuarios as Usuario[]).length > 0 ? (
        <DisponibilidadeTable
          diasAtuacao={diasAtuacao as DiaAtuacao[]}
          usuarios={usuarios as Usuario[]}
          disponibilidades={disponibilidades as Disponibilidade[]}
          disponibilidadeMap={disponibilidadeMap}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
          {!(diasAtuacao as DiaAtuacao[] | null) || (diasAtuacao as DiaAtuacao[]).length === 0 ? (
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




