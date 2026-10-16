// Página pública de músicas
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth'
import MusicaList from '@/components/MusicaList'
import Link from 'next/link'
import { Button, Group, Stack, Text, Title } from '@mantine/core'
import { IconMusic, IconPlus } from '@tabler/icons-react'

export const revalidate = 0 // Desabilita cache para sempre buscar dados atualizados

export default async function MusicasPage() {
  const supabase = createAdminClient()
  const user = await getCurrentUser()

  // Busca todas as músicas com suas cifras, letras e links do YouTube (acesso público)
  const { data: musicas, error } = await supabase
    .from('musicas')
    .select(`
      *,
      cifras(*),
      letras(*),
      links_youtube(*)
    `)
    .order('titulo', { ascending: true })

  if (error) {
    console.error('Erro ao buscar músicas:', error)
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={1} size="h2">Repertório</Title>
          <Text c="dimmed" mt={4}>Letras, cifras e referências musicais do ministério.</Text>
        </div>
        {user?.lider && (
          <Button component={Link} href="/musicas/nova" leftSection={<IconPlus size={18} />}>Adicionar música</Button>
        )}
      </Group>

      <MusicaList musicas={musicas || []} isAdmin={user?.lider || false} />
    </Stack>
  )
}






