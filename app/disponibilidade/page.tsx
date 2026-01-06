// Página de disponibilidade
import { redirect } from 'next/navigation'
import { getCurrentUser, requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import DisponibilidadeCalendar from '@/components/DisponibilidadeCalendar'

export default async function DisponibilidadePage() {
  const user = await requireAuth()

  const supabase = createServerClient()

  // Busca dias de atuação do mês atual
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const { data: diasAtuacao } = await supabase
    .from('dias_atuacao')
    .select('*')
    .gte('data', startOfMonth.toISOString().split('T')[0])
    .lte('data', endOfMonth.toISOString().split('T')[0])
    .order('data', { ascending: true })

  // Busca disponibilidade do usuário
  const { data: disponibilidade } = await supabase
    .from('disponibilidade')
    .select('*')
    .eq('usuario_id', user.id)
    .gte('data', startOfMonth.toISOString().split('T')[0])
    .lte('data', endOfMonth.toISOString().split('T')[0])

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 max-w-7xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">
        Minha Disponibilidade
      </h1>

      <DisponibilidadeCalendar
        diasAtuacao={diasAtuacao || []}
        disponibilidade={disponibilidade || []}
        userId={user.id}
      />
    </div>
  )
}






