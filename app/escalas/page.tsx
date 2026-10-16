// Página de escalas
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import EscalaCalendar from '@/components/EscalaCalendar'
import Link from 'next/link'
import { Button, Group, Stack, Text, Title } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'

export default async function EscalasPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

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
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div><Title order={1} size="h2">Escalas</Title><Text c="dimmed" mt={4}>Planejamento de repertório e equipes por data.</Text></div>
        {user.lider && (
          <Button component={Link} href="/escalas/nova" leftSection={<IconPlus size={18} />}>Nova escala</Button>
        )}
      </Group>

      <EscalaCalendar
        diasAtuacao={diasAtuacao || []}
        escalas={escalas || []}
        isAdmin={user.lider}
        initialDate={initialDate}
      />
    </Stack>
  )
}






