'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { format, isSameDay } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import {
  Avatar, Badge, Box, Button, Card, Center, Divider, Grid,
  Group, Loader, Menu, Modal, Paper, SimpleGrid, Skeleton, Stack, Text, ThemeIcon, Title,
} from '@mantine/core'
import { Calendar, DatesProvider } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import {
  IconBrandWhatsapp, IconCalendarEvent, IconCalendarOff, IconChevronDown,
  IconCake, IconClipboard, IconGift, IconLink,
  IconMail, IconMicrophone, IconMusic, IconShare3, IconUsers,
} from '@tabler/icons-react'
import 'dayjs/locale/pt-br'
import confetti from 'canvas-confetti'
import { DiaAtuacao } from '@/types'
import { formatDate, getDayName } from '@/lib/utils'
import MusicaModal from '@/components/MusicaModal'
import SortableRepertoire from '@/components/SortableRepertoire'
import styles from './DashboardModern.module.css'

interface Escala {
  id: string
  data: string
  ordem?: number | null
  musica: {
    id: string
    titulo: string
    link_youtube: string | Array<{ url: string; titulo: string | null; id: string }> | null
    letras?: { id: string }[]
    cifras?: { id: string }[]
  } | null
  usuario: { nome?: string; email: string; instrumento?: { nome: string } }
  funcao: string
}

interface Aniversariante {
  id: string
  nome?: string | null
  email: string
  data_nascimento: string
  instrumento?: { nome: string } | null
}

interface DashboardModernProps {
  escalasIniciais: Escala[]
  diasAtuacao: DiaAtuacao[]
  escalasMes: Escala[]
  aniversariantes: Aniversariante[]
  initialDate: string
  isAdmin: boolean
}

function fromDateString(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0)
}

function toDateString(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

export default function DashboardModern({
  escalasIniciais,
  diasAtuacao,
  escalasMes,
  aniversariantes,
  initialDate,
  isAdmin,
}: DashboardModernProps) {
  const [currentDate, setCurrentDate] = useState(() => fromDateString(initialDate))
  const [mounted, setMounted] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [escalas, setEscalas] = useState<Escala[]>(escalasIniciais)
  const [diasAtuacaoCompletos, setDiasAtuacaoCompletos] = useState(diasAtuacao)
  const [loading, setLoading] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [birthdayCelebration, setBirthdayCelebration] = useState<Aniversariante[] | null>(null)
  const [musicaModal, setMusicaModal] = useState<{
    id: string
    titulo: string
    link_youtube: string | Array<{ url: string; titulo: string | null; id: string }> | null
    temLetras: boolean
    temCifras: boolean
  } | null>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextDate = diasAtuacaoCompletos
      .map((item) => fromDateString(item.data))
      .filter((date) => date >= today)
      .sort((a, b) => a.getTime() - b.getTime())[0]

    if (!selectedDate && nextDate) setSelectedDate(nextDate)
  }, [diasAtuacaoCompletos, selectedDate])

  useEffect(() => {
    async function loadMonth() {
      const monthStart = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd')
      const monthEnd = format(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), 'yyyy-MM-dd')

      try {
        const response = await fetch(`/api/dias-atuacao?data_inicio=${monthStart}&data_fim=${monthEnd}`)
        if (!response.ok) return
        const result = await response.json()
        if (!Array.isArray(result)) return

        setDiasAtuacaoCompletos((previous) => {
          const byId = new Map(previous.map((item) => [item.id, item]))
          result.forEach((item: DiaAtuacao) => byId.set(item.id, item))
          return Array.from(byId.values())
        })
      } catch (error) {
        console.error('Erro ao carregar dias de atuação:', error)
      }
    }

    loadMonth()
  }, [currentDate])

  useEffect(() => {
    async function loadSchedule() {
      if (!selectedDate) return
      setLoading(true)
      try {
        const response = await fetch(`/api/escalas/public?data=${toDateString(selectedDate)}`)
        if (response.ok) setEscalas(await response.json())
      } catch (error) {
        console.error('Erro ao carregar escalas:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSchedule()
  }, [selectedDate])

  const aniversariantesDoMes = useMemo(() => aniversariantes
    .filter((person) => Number(person.data_nascimento.split('-')[1]) === currentDate.getMonth() + 1)
    .sort((a, b) => Number(a.data_nascimento.split('-')[2]) - Number(b.data_nascimento.split('-')[2])),
  [aniversariantes, currentDate])

  const musicas = useMemo(() => {
    const unique = new Map<string, { musica: NonNullable<Escala['musica']>; solos: Escala[]; ordem: number }>()
    escalas.filter((item) => item.musica).forEach((item) => {
      const id = item.musica!.id
      const existing = unique.get(id)
      if (existing) existing.solos.push(item)
      else unique.set(id, { musica: item.musica!, solos: [item], ordem: item.ordem ?? 999 })
    })
    return Array.from(unique.values()).sort((a, b) => a.ordem - b.ordem)
  }, [escalas])

  const openMusic = (songId: string) => {
    const entry = musicas.find(({ musica }) => musica.id === songId)
    if (!entry) return
    const { musica } = entry
    setMusicaModal({
      id: musica.id,
      titulo: musica.titulo,
      link_youtube: musica.link_youtube,
      temLetras: Boolean(musica.letras?.length),
      temCifras: Boolean(musica.cifras?.length),
    })
  }

  const reorderSongs = async (orderedIds: string[]) => {
    if (!selectedDate || reordering) return
    const previous = escalas
    const orderById = new Map(orderedIds.map((id, index) => [id, index + 1]))

    setEscalas((current) => current.map((item) => item.musica
      ? { ...item, ordem: orderById.get(item.musica.id) ?? item.ordem }
      : item
    ))
    setReordering(true)

    try {
      const response = await fetch('/api/escalas/reordenar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: toDateString(selectedDate),
          musicas: orderedIds.map((musica_id, index) => ({ musica_id, ordem: index + 1 })),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Não foi possível salvar a nova ordem')
      notifications.show({ color: 'green', message: 'Ordem do repertório salva.' })
    } catch (error) {
      setEscalas(previous)
      notifications.show({ color: 'red', title: 'A ordem não foi salva', message: error instanceof Error ? error.message : 'Tente novamente.' })
    } finally {
      setReordering(false)
    }
  }

  const cantores = escalas.filter((item) => !item.musica && item.funcao === 'cantor')
  const musicos = escalas.filter((item) => !item.musica && item.funcao === 'musico')

  const isPerformanceDay = (date: Date) =>
    diasAtuacaoCompletos.some((item) => isSameDay(fromDateString(item.data), date))

  const birthdaysOn = (date: Date) => aniversariantes.filter((person) => {
    const [, month, day] = person.data_nascimento.split('-').map(Number)
    return month === date.getMonth() + 1 && day === date.getDate()
  })

  const celebrateBirthday = (people: Aniversariante[]) => {
    setBirthdayCelebration(people)
    requestAnimationFrame(() => {
      void confetti({
        particleCount: 110,
        spread: 76,
        startVelocity: 34,
        origin: { x: 0.5, y: 0.62 },
        colors: ['#559f9b', '#7fa62b', '#ec4899', '#f59e0b', '#ffffff'],
        ticks: 180,
        zIndex: 500,
        disableForReducedMotion: true,
      })
    })
  }

  const schedulesOn = (date: Date) => escalasMes.filter((item) => isSameDay(fromDateString(item.data), date))

  const shareText = () => {
    const heading = selectedDate ? `${formatDate(toDateString(selectedDate))} — ${getDayName(toDateString(selectedDate))}` : 'Próxima escala'
    const songs = musicas.map(({ musica }) => `• ${musica.titulo}`).join('\n')
    const voices = cantores.map((item) => item.usuario.nome || item.usuario.email).join(', ')
    const instruments = musicos.map((item) => {
      const instrument = item.usuario.instrumento?.nome
      return `${item.usuario.nome || item.usuario.email}${instrument ? ` (${instrument})` : ''}`
    }).join(', ')
    return [`Escala do Ministério de Louvor`, heading, songs && `\nMúsicas:\n${songs}`, voices && `\nCantores: ${voices}`, instruments && `\nMúsicos: ${instruments}`].filter(Boolean).join('\n')
  }

  const copy = async (value: string, message: string) => {
    await navigator.clipboard.writeText(value)
    notifications.show({ color: 'ibce', title: 'Pronto', message })
  }

  const renderDay = (value: string) => {
    const date = fromDateString(value)
    const performance = isPerformanceDay(date)
    const birthdayCount = birthdaysOn(date).length
    const scheduleCount = schedulesOn(date).length

    return (
      <Stack gap={1} align="stretch" w="100%">
        <Text size="xs" fw={performance ? 700 : 500} lh={1}>{date.getDate()}</Text>
        {performance && <Text fz={{ base: 6, sm: 8 }} c="ibce.6" fw={700} lh={1}>Atuação</Text>}
        {scheduleCount > 0 && <Text fz={{ base: 6, sm: 8 }} c="olive.6" fw={700} lh={1}>Escala ({scheduleCount})</Text>}
        {birthdayCount > 0 && <Text fz={{ base: 6, sm: 8 }} c="pink.5" fw={700} lh={1}>Aniversário</Text>}
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <Box>
          <Title order={1} size="h2">Visão geral</Title>
          <Text c="dimmed" mt={4}>Escalas, repertório e datas do ministério.</Text>
        </Box>
        {escalas.length > 0 && (
          <Menu position="bottom-end" width={240} shadow="md">
            <Menu.Target>
              <Button leftSection={<IconShare3 size={18} />} rightSection={<IconChevronDown size={15} />}>
                Compartilhar
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconClipboard size={17} />} onClick={() => copy(shareText(), 'Escala copiada para a área de transferência.')}>Copiar escala</Menu.Item>
              <Menu.Item leftSection={<IconLink size={17} />} onClick={() => copy(window.location.href, 'Link da página copiado.')}>Copiar link</Menu.Item>
              <Menu.Item leftSection={<IconBrandWhatsapp size={17} />} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText()}\n\n${window.location.href}`)}`, '_blank')}>Abrir no WhatsApp</Menu.Item>
              <Menu.Item leftSection={<IconMail size={17} />} component="a" href={`mailto:?subject=Escala do Ministério de Louvor&body=${encodeURIComponent(shareText())}`}>Enviar por e-mail</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>

      {aniversariantesDoMes.length > 0 && (
        <Paper withBorder p="md" bg="var(--app-surface)" className={styles.birthdayPanel}>
          <Group mb="sm" gap="xs">
            <ThemeIcon color="pink" variant="light"><IconGift size={18} /></ThemeIcon>
            <Text fw={700}>Aniversariantes de {format(currentDate, 'MMMM', { locale: ptBR })}</Text>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="sm">
            {aniversariantesDoMes.map((person) => {
              const day = Number(person.data_nascimento.split('-')[2])
              return (
                <Group key={person.id} wrap="nowrap" p="xs">
                  <Avatar color="pink" variant="light" radius="xl">{day}</Avatar>
                  <Box miw={0}>
                    <Text size="sm" fw={600} truncate>{person.nome || person.email}</Text>
                    <Text size="xs" c="dimmed">{format(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), "dd 'de' MMMM", { locale: ptBR })}</Text>
                  </Box>
                </Group>
              )
            })}
          </SimpleGrid>
        </Paper>
      )}

      <Grid gutter="lg" align="flex-start">
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Card withBorder padding="lg" bg="var(--app-surface)" className={styles.scheduleCard}>
            <Group justify="space-between" mb="lg">
              <Box>
                <Text fw={700} size="lg">{selectedDate ? `Escala de ${formatDate(toDateString(selectedDate))}` : 'Próxima escala'}</Text>
                {selectedDate && <Text size="sm" c="dimmed">{getDayName(toDateString(selectedDate))}</Text>}
              </Box>
              <ThemeIcon color="olive" variant="light" size="lg"><IconCalendarEvent size={20} /></ThemeIcon>
            </Group>

            {loading ? (
              <Center py={64}><Stack align="center" gap="sm"><Loader size="sm" /><Text c="dimmed" size="sm">Carregando escala...</Text></Stack></Center>
            ) : escalas.length === 0 ? (
              <Center py={64}>
                <Stack align="center" gap="sm">
                  <ThemeIcon color="gray" variant="light" size={54}><IconCalendarOff size={28} /></ThemeIcon>
                  <Text fw={600}>Nenhuma escala cadastrada</Text>
                  <Text c="dimmed" size="sm" ta="center">Selecione outra data de atuação no calendário.</Text>
                  <Button component={Link} href="/escalas" variant="light" size="sm">Ver todas as escalas</Button>
                </Stack>
              </Center>
            ) : (
              <Stack gap="lg">
                {musicas.length > 0 && (
                  <Stack gap="xs">
                    <Group justify="space-between" align="flex-end">
                      <Text size="xs" fw={700} c="dimmed">REPERTÓRIO</Text>
                      {isAdmin && musicas.length > 1 && <Text size="xs" c="dimmed">{reordering ? 'Salvando ordem…' : 'Arraste pelo puxador ou use as setas'}</Text>}
                    </Group>
                    <SortableRepertoire
                      songs={musicas.map(({ musica, solos }) => ({
                        id: musica.id,
                        title: musica.titulo,
                        soloNames: solos.map((solo) => solo.usuario.nome || solo.usuario.email),
                      }))}
                      editable={isAdmin && musicas.length > 1}
                      saving={reordering}
                      onOpen={openMusic}
                      onReorder={reorderSongs}
                    />
                  </Stack>
                )}

                {(cantores.length > 0 || musicos.length > 0) && <Divider />}
                {cantores.length > 0 && (
                  <Box>
                    <Group gap="xs" mb="xs"><IconMicrophone size={18} /><Text fw={600}>Cantores</Text></Group>
                    <Group gap="xs">{cantores.map((item) => <Badge key={item.id} color="ibce" variant="light" size="lg">{item.usuario.nome || item.usuario.email}</Badge>)}</Group>
                  </Box>
                )}
                {musicos.length > 0 && (
                  <Box>
                    <Group gap="xs" mb="xs"><IconUsers size={18} /><Text fw={600}>Músicos</Text></Group>
                    <Group gap="xs">{musicos.map((item) => <Badge key={item.id} color="olive" variant="light" size="lg">{item.usuario.nome || item.usuario.email}{item.usuario.instrumento ? ` · ${item.usuario.instrumento.nome}` : ''}</Badge>)}</Group>
                  </Box>
                )}
              </Stack>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Card withBorder padding="lg" bg="var(--app-surface)" className={styles.calendarCard}>
            <Group justify="space-between" mb="md">
              <Box><Text fw={700} size="lg">Calendário</Text><Text size="sm" c="dimmed">Selecione um dia de atuação</Text></Box>
              <ThemeIcon color="ibce" variant="light" size="lg"><IconCalendarEvent size={20} /></ThemeIcon>
            </Group>
            {mounted ? <DatesProvider settings={{ locale: 'pt-br', firstDayOfWeek: 0, weekendDays: [0, 6] }}>
              <Calendar
                date={toDateString(currentDate)}
                onDateChange={(value) => setCurrentDate(fromDateString(value))}
                renderDay={renderDay}
                highlightToday
                getDayProps={(value) => {
                  const date = fromDateString(value)
                  const performance = isPerformanceDay(date)
                  const birthdayPeople = birthdaysOn(date)
                  const interactive = performance || birthdayPeople.length > 0
                  return {
                    'aria-disabled': !interactive,
                    'data-birthday': birthdayPeople.length > 0 ? 'true' : undefined,
                    selected: Boolean(selectedDate && isSameDay(date, selectedDate)),
                    onClick: () => {
                      if (!interactive) return
                      setSelectedDate(date)
                      if (birthdayPeople.length > 0) celebrateBirthday(birthdayPeople)
                    },
                  }
                }}
                getDayAriaLabel={(value) => {
                  const date = fromDateString(value)
                  return `${format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}${isPerformanceDay(date) ? ', dia de atuação' : ''}`
                }}
                ariaLabels={{ nextMonth: 'Próximo mês', previousMonth: 'Mês anterior', monthLevelControl: 'Selecionar mês' }}
                className={styles.calendar}
                classNames={{ calendarHeader: styles.calendarHeader, month: styles.month, monthCell: styles.monthCell, day: styles.day }}
              />
            </DatesProvider> : <Skeleton h={430} radius="sm" />}
            <Group gap="md" mt="md">
              <Group gap={6}><Box w={7} h={7} bg="ibce.6" style={{ borderRadius: '50%' }} /><Text size="xs" c="dimmed">Atuação</Text></Group>
              <Group gap={6}><Box w={7} h={7} bg="olive.6" style={{ borderRadius: '50%' }} /><Text size="xs" c="dimmed">Escala</Text></Group>
              <Group gap={6}><Box w={7} h={7} bg="pink.5" style={{ borderRadius: '50%' }} /><Text size="xs" c="dimmed">Aniversário</Text></Group>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {musicaModal && <MusicaModal musica={musicaModal} isOpen onClose={() => setMusicaModal(null)} />}
      <Modal
        opened={Boolean(birthdayCelebration)}
        onClose={() => setBirthdayCelebration(null)}
        title="Celebração de aniversário"
        centered
        size="md"
      >
        {birthdayCelebration && (
          <Stack align="center" gap="md" ta="center" py="sm">
            <ThemeIcon color="pink" variant="light" size={68} radius="xl"><IconCake size={34} /></ThemeIcon>
            <Box>
              <Title order={2} size="h3">Feliz aniversário!</Title>
              <Text c="dimmed" mt={6} className="text-pretty">
                Parabéns, <strong>{birthdayCelebration.map((person) => person.nome || person.email).join(' e ')}</strong>!
              </Text>
            </Box>
            <Paper withBorder p="md" bg="var(--mantine-color-pink-light)" w="100%">
              <Text fw={600} className="text-pretty">
                Que Deus continue abençoando sua vida, renovando suas forças e conduzindo seus passos com graça e alegria.
              </Text>
            </Paper>
            <Group justify="center">
              {birthdayCelebration.map((person) => (
                <Badge key={person.id} color="pink" variant="light" size="lg">{person.nome || person.email}</Badge>
              ))}
            </Group>
            <Button color="pink" onClick={() => setBirthdayCelebration(null)}>Amém!</Button>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}
