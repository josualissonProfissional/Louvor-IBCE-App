// Página administrativa de disponibilidade de todos os membros
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge, Button, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { Disponibilidade, Usuario, DiaAtuacao } from '@/types'
import DisponibilidadeTable from '@/components/DisponibilidadeTable'

export default async function AdminDisponibilidadePage() {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect('/login')
  if (!currentUser.lider) redirect('/')

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
    <Stack gap="lg">
      <div>
        <Button component={Link} href="/admin" variant="subtle" px={0} leftSection={<IconArrowLeft size={17} />}>Voltar</Button>
        <Title order={1}>Disponibilidade dos membros</Title>
        <Text c="dimmed">Consulte as respostas da equipe organizadas por mês.</Text>
      </div>

      {(diasAtuacao as DiaAtuacao[] | null) && (diasAtuacao as DiaAtuacao[]).length > 0 && (usuarios as Usuario[] | null) && (usuarios as Usuario[]).length > 0 ? (
        <DisponibilidadeTable
          diasAtuacao={diasAtuacao as DiaAtuacao[]}
          usuarios={usuarios as Usuario[]}
          disponibilidades={disponibilidades as Disponibilidade[]}
          disponibilidadeMap={disponibilidadeMap}
        />
      ) : (
        <Paper withBorder p="xl" radius="md" ta="center">
          {!(diasAtuacao as DiaAtuacao[] | null) || (diasAtuacao as DiaAtuacao[]).length === 0 ? (
            <Text c="dimmed">Nenhum dia de atuação cadastrado.</Text>
          ) : (
            <Text c="dimmed">Nenhum usuário cadastrado.</Text>
          )}
        </Paper>
      )}

      <Paper withBorder p="md" radius="md">
        <Group gap="sm"><Text size="sm" fw={700}>Legenda</Text><Badge color="green" variant="light">Disponível</Badge><Badge color="red" variant="light">Indisponível</Badge><Badge color="gray" variant="light">Não informado</Badge></Group>
      </Paper>
    </Stack>
  )
}




