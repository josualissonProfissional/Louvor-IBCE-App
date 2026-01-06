// Página inicial (Dashboard) - Server Component que carrega dados iniciais
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/DashboardClient'

export default async function HomePage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const supabase = createServerClient()
  
  const today = new Date()
  
  // Busca escalas da semana atual
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  const { data: escalasSemana } = await supabase
    .from('escalas')
    .select(`
      *,
      musica:musicas(
        *,
        letras(id),
        cifras(id)
      ),
      usuario:usuarios(*, instrumento:instrumentos(*))
    `)
    .gte('data', startOfWeek.toISOString().split('T')[0])
    .lte('data', endOfWeek.toISOString().split('T')[0])
    .order('data', { ascending: true })

  // Busca dias de atuação do mês
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const { data: diasAtuacao } = await supabase
    .from('dias_atuacao')
    .select('*')
    .gte('data', startOfMonth.toISOString().split('T')[0])
    .lte('data', endOfMonth.toISOString().split('T')[0])
    .order('data', { ascending: true })

  // Busca escalas do mês para o calendário
  const { data: escalasMes } = await supabase
    .from('escalas')
    .select('*')
    .gte('data', startOfMonth.toISOString().split('T')[0])
    .lte('data', endOfMonth.toISOString().split('T')[0])
    .order('data', { ascending: true })

  // Busca todos os usuários para calcular aniversariantes (filtrado no cliente por mês)
  const { data: todosUsuarios } = await supabase
    .from('usuarios')
    .select('id, nome, email, data_nascimento, instrumento:instrumentos(nome)')

  // Filtra apenas usuários com data_nascimento válida
  const aniversariantes = todosUsuarios?.filter((usuario) => {
    return usuario.data_nascimento !== null && usuario.data_nascimento !== undefined
  }) || []

  return (
    <DashboardClient
      escalasIniciais={escalasSemana || []}
      diasAtuacao={diasAtuacao || []}
      escalasMes={escalasMes || []}
      aniversariantes={aniversariantes}
    />
  )
}
