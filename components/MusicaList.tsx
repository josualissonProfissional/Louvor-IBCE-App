'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  Badge, Box, Button, Card, Center, Group, Modal, Paper,
  Select, SimpleGrid, Stack, Text, TextInput, ThemeIcon, Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconExternalLink, IconFileMusic, IconMusic, IconSearch, IconShare, IconBrandYoutube, IconFileText, IconGuitarPick } from '@tabler/icons-react'
import { MusicaCompleta } from '@/types'
import LetraViewerInline from './LetraViewerInline'
import CifraViewerInline from './CifraViewerInline'
import MusicaModal from './MusicaModal'

export default function MusicaList({ musicas }: { musicas: MusicaCompleta[]; isAdmin: boolean }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todos')
  const [selected, setSelected] = useState<MusicaCompleta | null>(null)
  const [view, setView] = useState<'options' | 'letra' | 'cifra'>('options')
  const [playerMusic, setPlayerMusic] = useState<any>(null)

  const filtered = useMemo(() => musicas.filter((music) => {
    const youtube = Array.isArray(music.link_youtube) ? music.link_youtube.length > 0 : Boolean(music.link_youtube?.trim())
    const match = music.titulo.toLowerCase().includes(search.toLowerCase())
    const type = filter === 'todos' ||
      (filter === 'letra' && music.letras.length > 0) ||
      (filter === 'cifra' && music.cifras.length > 0) ||
      (filter === 'youtube' && youtube) ||
      (filter === 'incompletas' && (!music.letras.length || !music.cifras.length))
    return match && type
  }), [filter, musicas, search])

  const open = (music: MusicaCompleta) => { setSelected(music); setView('options') }
  const openContent = (music: MusicaCompleta, contentView: 'letra' | 'cifra') => {
    setSelected(music)
    setView(contentView)
  }
  const close = () => { setSelected(null); setView('options') }
  const hasYoutube = (music: MusicaCompleta) => Array.isArray(music.link_youtube) ? music.link_youtube.length > 0 : Boolean(music.link_youtube?.trim())
  const contentUrl = (music: MusicaCompleta, type: 'letra' | 'cifra') => `/musicas/${music.id}?view=${type}`
  const shareContent = async (music: MusicaCompleta, type: 'letra' | 'cifra') => {
    const url = `${window.location.origin}${contentUrl(music, type)}`
    const payload = { title: `${music.titulo} — ${type === 'letra' ? 'Letra' : 'Cifra'}`, text: music.titulo, url }
    if (navigator.share) await navigator.share(payload).catch(() => undefined)
    else {
      await navigator.clipboard.writeText(url)
      notifications.show({ color: 'ibce', message: 'Link copiado para a área de transferência.' })
    }
  }

  if (!musicas.length) return (
    <Paper withBorder p={48} bg="var(--app-surface)">
      <Center><Stack align="center"><ThemeIcon color="gray" variant="light" size={58}><IconMusic size={30} /></ThemeIcon><Text fw={600}>Nenhuma música cadastrada</Text><Text size="sm" c="dimmed">O repertório aparecerá aqui quando receber a primeira música.</Text></Stack></Center>
    </Paper>
  )

  return (
    <Stack gap="lg">
      <Paper withBorder p="md" bg="var(--app-surface)">
        <Group align="flex-end" grow>
          <TextInput label="Buscar no repertório" placeholder="Nome da música" leftSection={<IconSearch size={18} />} value={search} onChange={(e) => setSearch(e.currentTarget.value)} />
          <Select label="Filtrar conteúdo" value={filter} onChange={(value) => setFilter(value || 'todos')} data={[
            { value: 'todos', label: 'Todas as músicas' }, { value: 'letra', label: 'Com letra' },
            { value: 'cifra', label: 'Com cifra' }, { value: 'youtube', label: 'Com áudio ou vídeo' },
            { value: 'incompletas', label: 'Conteúdo incompleto' },
          ]} />
        </Group>
        <Text size="xs" c="dimmed" mt="sm">{filtered.length} de {musicas.length} músicas</Text>
      </Paper>

      {filtered.length ? (
        <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="md">
          {filtered.map((music) => (
            <Card key={music.id} withBorder padding="lg" bg="var(--app-surface)" onClick={() => open(music)} style={{ cursor: 'pointer' }}>
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <ThemeIcon color="ibce" variant="light" size={42}><IconFileMusic size={22} /></ThemeIcon>
                <Group gap={6}>
                  {music.letras.length > 0 && <Badge color="ibce" variant="light">Letra</Badge>}
                  {music.cifras.length > 0 && <Badge color="olive" variant="light">Cifra</Badge>}
                  {hasYoutube(music) && <Badge color="red" variant="light">Ouvir</Badge>}
                </Group>
              </Group>
              <Title order={3} size="h4" mt="lg" lineClamp={2}>{music.titulo}</Title>
              <Text size="sm" c="dimmed" mt={6}>Abrir letra, cifra ou referência musical</Text>
              <Group mt="lg" gap="xs" onClick={(event) => event.stopPropagation()}>
                {music.letras.length > 0 && <Button size="xs" variant="light" color="ibce" leftSection={<IconFileText size={15} />} onClick={() => openContent(music, 'letra')}>Letra</Button>}
                {music.cifras.length > 0 && <Button size="xs" variant="light" color="olive" leftSection={<IconGuitarPick size={15} />} onClick={() => openContent(music, 'cifra')}>Cifra</Button>}
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Paper withBorder p={40}><Center><Stack align="center"><IconSearch size={30} color="var(--app-text-muted)" /><Text fw={600}>Nenhum resultado</Text><Button variant="subtle" onClick={() => { setSearch(''); setFilter('todos') }}>Limpar filtros</Button></Stack></Center></Paper>
      )}

      <Modal opened={Boolean(selected)} onClose={close} title={selected?.titulo} size={view === 'options' ? 'md' : 'xl'} centered scrollAreaComponent={undefined}>
        {selected && view === 'options' && (
          <Stack>
            <Text size="sm" c="dimmed">Escolha o conteúdo que deseja consultar.</Text>
            {selected.letras.length > 0 && <Button variant="light" color="ibce" leftSection={<IconFileText size={18} />} onClick={() => setView('letra')}>Ver letra <Badge ml="auto" color="ibce">{selected.letras.length}</Badge></Button>}
            {selected.cifras.length > 0 && <Button variant="light" color="olive" leftSection={<IconGuitarPick size={18} />} onClick={() => setView('cifra')}>Ver cifra <Badge ml="auto" color="olive">{selected.cifras.length}</Badge></Button>}
            {hasYoutube(selected) && <Button variant="light" color="red" leftSection={<IconBrandYoutube size={18} />} onClick={() => { setPlayerMusic({ id: selected.id, titulo: selected.titulo, link_youtube: selected.link_youtube, temLetras: !!selected.letras.length, temCifras: !!selected.cifras.length }); close() }}>Ouvir música</Button>}
          </Stack>
        )}
        {selected && (view === 'letra' || view === 'cifra') && (
          <Group justify="flex-end" mb="md">
            <Button variant="light" leftSection={<IconShare size={17} />} onClick={() => shareContent(selected, view)}>Compartilhar</Button>
            <Button component={Link} href={contentUrl(selected, view)} leftSection={<IconExternalLink size={17} />}>Abrir em tela inteira</Button>
          </Group>
        )}
        {selected && view === 'letra' && <Box mah="75dvh" style={{ overflowY: 'auto' }}><LetraViewerInline musica={selected} selectedIndex={0} /></Box>}
        {selected && view === 'cifra' && <Box mah="75dvh" style={{ overflowY: 'auto' }}><CifraViewerInline musica={selected} /></Box>}
      </Modal>
      {playerMusic && <MusicaModal musica={playerMusic} isOpen onClose={() => setPlayerMusic(null)} initialView="youtube" />}
    </Stack>
  )
}
