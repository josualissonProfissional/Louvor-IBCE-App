'use client'

import { useRouter } from 'next/navigation'
import { Box, Button, Group, Paper, SegmentedControl, Stack, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconArrowLeft, IconGuitarPick, IconShare, IconFileText } from '@tabler/icons-react'
import { useState } from 'react'
import { MusicaCompleta } from '@/types'
import LetraViewerInline from './LetraViewerInline'
import CifraViewerInline from './CifraViewerInline'

export default function MusicDetailPage({ musica, initialView }: { musica: MusicaCompleta; initialView: 'letra' | 'cifra' }) {
  const router = useRouter()
  const available = [
    ...(musica.letras.length ? [{ value: 'letra', label: 'Letra' }] : []),
    ...(musica.cifras.length ? [{ value: 'cifra', label: 'Cifra' }] : []),
  ]
  const fallback = (available[0]?.value || 'letra') as 'letra' | 'cifra'
  const [view, setView] = useState<'letra' | 'cifra'>(available.some((item) => item.value === initialView) ? initialView : fallback)

  const share = async () => {
    const url = `${window.location.origin}/musicas/${musica.id}?view=${view}`
    const data = { title: `${musica.titulo} — ${view === 'letra' ? 'Letra' : 'Cifra'}`, text: musica.titulo, url }
    if (navigator.share) await navigator.share(data).catch(() => undefined)
    else {
      await navigator.clipboard.writeText(url)
      notifications.show({ color: 'ibce', message: 'Link copiado para a área de transferência.' })
    }
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <Box>
          <Button variant="subtle" color="gray" px={0} leftSection={<IconArrowLeft size={18} />} onClick={() => router.back()}>Voltar</Button>
          <Title order={1} size="h2" className="text-balance">{musica.titulo}</Title>
          <Text c="dimmed" mt={4}>{view === 'letra' ? 'Letra da música' : 'Cifra e transposição'}</Text>
        </Box>
        <Button variant="light" leftSection={<IconShare size={18} />} onClick={share}>Compartilhar</Button>
      </Group>

      {available.length > 1 && (
        <SegmentedControl
          value={view}
          onChange={(value) => setView(value as 'letra' | 'cifra')}
          data={available.map((item) => ({ ...item, label: item.value === 'letra' ? <Group gap={6}><IconFileText size={16} />Letra</Group> : <Group gap={6}><IconGuitarPick size={16} />Cifra</Group> }))}
        />
      )}

      <Paper withBorder p={{ base: 'sm', sm: 'lg' }} bg="var(--app-surface)">
        {view === 'letra' ? <LetraViewerInline musica={musica} selectedIndex={0} /> : <CifraViewerInline musica={musica} />}
      </Paper>
    </Stack>
  )
}
