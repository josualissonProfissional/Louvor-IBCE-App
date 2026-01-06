// Página de escalas
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import EscalaCalendar from '@/components/EscalaCalendar'

export default async function EscalasPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

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

  // Busca escalas do mês
  const { data: escalas } = await supabase
    .from('escalas')
    .select(`
      *,
      musica:musicas(*),
      usuario:usuarios(*, instrumento:instrumentos(*))
    `)
    .gte('data', startOfMonth.toISOString().split('T')[0])
    .lte('data', endOfMonth.toISOString().split('T')[0])
    .order('data', { ascending: true })

  return (
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 md:mb-6 animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Escalas
        </h1>
        {user.lider && (
          <a
            href="/escalas/nova"
            className="bg-primary text-white px-4 py-2 md:px-6 md:py-3 rounded-lg hover:bg-primary-light transition-all duration-300 transform active:scale-95 md:hover:scale-105 hover:shadow-lg font-semibold text-sm md:text-base text-center"
          >
            + Nova Escala
          </a>
        )}
      </div>

      <EscalaCalendar
        diasAtuacao={diasAtuacao || []}
        escalas={escalas || []}
        isAdmin={user.lider}
      />
    </div>
  )
}






