// Página de disponibilidade
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import DisponibilidadeCalendar from '@/components/DisponibilidadeCalendar'
import { Stack, Text, Title } from '@mantine/core'

export default async function DisponibilidadePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = createServerClient()

  // Busca dias de atuação do mês atual
  const today = new Date()
  const initialDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
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
    <Stack gap="lg">
      <div><Title order={1} size="h2">Minha disponibilidade</Title><Text c="dimmed" mt={4}>Informe em quais dias você poderá servir.</Text></div>

      <DisponibilidadeCalendar
        diasAtuacao={diasAtuacao || []}
        disponibilidade={disponibilidade || []}
        userId={user.id}
        initialDate={initialDate}
      />
    </Stack>
  )
}






