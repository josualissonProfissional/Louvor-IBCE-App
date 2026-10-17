'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import { ActionIcon, Badge, Box, Button, Card, Center, Grid, Group, Paper, Skeleton, Stack, Text, ThemeIcon } from '@mantine/core'
import { Calendar, DatesProvider } from '@mantine/dates'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconCalendarEvent, IconMicrophone, IconMusic, IconPlus, IconTrash, IconUsers } from '@tabler/icons-react'
import 'dayjs/locale/pt-br'
import { DiaAtuacao } from '@/types'
import styles from './CalendarBoard.module.css'

interface Escala { id: string; data: string; musica: { titulo: string } | null; usuario: { nome?: string; email: string; instrumento?: { nome: string } }; funcao: string }
const parseDate = (value: string) => { const [y, m, d] = value.split('-').map(Number); return new Date(y, m - 1, d, 12) }

export default function EscalaCalendar({ diasAtuacao, escalas: initial, isAdmin, initialDate }: { diasAtuacao: DiaAtuacao[]; escalas: Escala[]; isAdmin: boolean; initialDate: string }) {
  const [month, setMonth] = useState(initialDate)
  const [mounted, setMounted] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [days, setDays] = useState(diasAtuacao)
  const [items, setItems] = useState(initial)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted) return
    const monthDate = parseDate(month)
    const start = format(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1), 'yyyy-MM-dd')
    const end = format(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0), 'yyyy-MM-dd')
    Promise.all([fetch(`/api/dias-atuacao?data_inicio=${start}&data_fim=${end}`), fetch(`/api/escalas/public?data_inicio=${start}&data_fim=${end}`)])
      .then(async ([d, e]) => { if (d.ok) setDays(await d.json()); if (e.ok) setItems(await e.json()) })
      .catch((error) => console.error('Erro ao carregar escalas:', error))
  }, [month, mounted])

  const isActing = (date: string) => days.some((day) => day.data === date)
  const onDate = (date: string) => items.filter((item) => item.data === date)
  const selectedItems = selected ? onDate(selected) : []
  const songs = selectedItems.filter((item) => item.musica)
  const singers = selectedItems.filter((item) => !item.musica && item.funcao === 'cantor')
  const musicians = selectedItems.filter((item) => !item.musica && item.funcao === 'musico')
  const songsByTitle = songs.reduce<Record<string, Escala[]>>((groups, item) => {
    const title = item.musica!.titulo
    ;(groups[title] ||= []).push(item)
    return groups
  }, {})

  const remove = (item: Escala) => modals.openConfirmModal({
    title: 'Remover integrante da escala?',
    children: <Text size="sm">Esta ação removerá {item.usuario.nome || item.usuario.email} desta escala.</Text>,
    labels: { confirm: 'Remover', cancel: 'Cancelar' }, confirmProps: { color: 'red' },
    onConfirm: async () => {
      const response = await fetch(`/api/escalas/${item.id}`, { method: 'DELETE' })
      if (response.ok) { setItems((current) => current.filter((entry) => entry.id !== item.id)); notifications.show({ color: 'ibce', message: 'Integrante removido da escala.' }) }
      else notifications.show({ color: 'red', message: 'Não foi possível remover a escala.' })
    },
  })

  const renderDay = (value: string) => {
    const acting = isActing(value)
    const count = onDate(value).length
    const isSelected = selected === value

    return (
      <Stack gap={1} align="stretch" w="100%" h="100%" justify="space-between">
        {/* Desktop (sm em diante) */}
        <Box visibleFrom="sm">
          <Group justify="space-between" align="center" wrap="nowrap">
            <Text size="sm" fw={acting ? 700 : 500} c={isSelected ? 'white' : acting ? 'ibce.9' : undefined}>
              {Number(value.slice(8, 10))}
            </Text>
            {acting && (
              <Badge
                size="xs"
                variant={isSelected ? 'white' : 'filled'}
                color="ibce"
                radius="xs"
                px={4}
                h={16}
                fz={9}
                fw={700}
              >
                Culto
              </Badge>
            )}
          </Group>
          {count > 0 && (
            <Text fz={9} c={isSelected ? 'white' : 'olive.7'} fw={700} lh={1} mt={4}>
              Escala ({count})
            </Text>
          )}
        </Box>

        {/* Mobile (abaixo de sm) */}
        <Stack hiddenFrom="sm" gap={1} align="center" justify="center" h="100%">
          <Text
            size="xs"
            fw={acting ? 700 : 500}
            c={isSelected ? 'white' : acting ? 'ibce.9' : undefined}
            lh={1.1}
          >
            {Number(value.slice(8, 10))}
          </Text>
          {acting && (
            <Badge
              size="xs"
              variant={isSelected ? 'white' : 'light'}
              color="ibce"
              radius="xs"
              px={2}
              h={13}
              fz={7.5}
              fw={700}
            >
              {count > 0 ? `Escala (${count})` : 'Culto'}
            </Badge>
          )}
        </Stack>
      </Stack>
    )
  }

  const personRow = (item: Escala) => <Group key={item.id} justify="space-between" wrap="nowrap"><Box miw={0}><Text size="sm" fw={600} truncate>{item.usuario.nome || item.usuario.email}</Text>{item.usuario.instrumento && <Text size="xs" c="dimmed">{item.usuario.instrumento.nome}</Text>}</Box>{isAdmin && <ActionIcon color="red" variant="subtle" aria-label="Remover da escala" onClick={() => remove(item)}><IconTrash size={17} /></ActionIcon>}</Group>

  if (!mounted) {
    return (
      <Grid gutter="lg" align="flex-start" aria-label="Carregando calendário de escalas">
        <Grid.Col span={{ base: 12, xl: 8 }}><Card withBorder padding="xs" p={{ base: 'xs', sm: 'md', md: 'lg' }} bg="var(--app-surface)"><Skeleton h={510} radius="sm" /></Card></Grid.Col>
        <Grid.Col span={{ base: 12, xl: 4 }}><Card withBorder padding="xs" p={{ base: 'xs', sm: 'md', md: 'lg' }} bg="var(--app-surface)"><Stack gap="md"><Skeleton h={24} w="58%" /><Skeleton h={14} w="76%" /><Skeleton h={180} mt="md" /></Stack></Card></Grid.Col>
      </Grid>
    )
  }

  return (
    <Grid gutter="lg" align="flex-start">
      <Grid.Col span={{ base: 12, xl: 8 }}>
        <Card withBorder padding="xs" p={{ base: 'xs', sm: 'md', md: 'lg' }} bg="var(--app-surface)">
          <DatesProvider settings={{ locale: 'pt-br', firstDayOfWeek: 0, weekendDays: [0, 6] }}>
            <Calendar
              date={month}
              onDateChange={setMonth}
              renderDay={renderDay}
              highlightToday
              getDayProps={(value) => {
                const active = isActing(value)
                return {
                  'aria-disabled': !active,
                  selected: selected === value,
                  'data-culto': active ? 'true' : undefined,
                  className: active ? styles.dayCulto : styles.dayDisabled,
                  onClick: () => active && setSelected(value)
                }
              }}
              className={styles.calendar}
              classNames={{ calendarHeader: styles.header, month: styles.month, monthCell: styles.cell, day: styles.day }}
              ariaLabels={{ nextMonth: 'Próximo mês', previousMonth: 'Mês anterior', monthLevelControl: 'Selecionar mês' }}
            />
          </DatesProvider>
        </Card>
      </Grid.Col>
      <Grid.Col span={{ base: 12, xl: 4 }}>
        <Card withBorder padding="xs" p={{ base: 'xs', sm: 'md', md: 'lg' }} bg="var(--app-surface)">
          <Group justify="space-between" mb="lg">
            <Box>
              <Text fw={700} size="lg">{selected ? format(parseDate(selected), "dd 'de' MMMM", { locale: ptBR }) : 'Detalhes da escala'}</Text>
              <Text size="sm" c="dimmed">{selected ? 'Equipe e repertório do dia' : 'Selecione uma data de culto'}</Text>
            </Box>
            {isAdmin && selected && <Button component={Link} href={`/escalas/nova?data=${selected}`} size="xs" leftSection={<IconPlus size={15} />}>Adicionar</Button>}
          </Group>
          {!selected ? (
            <Center py={50}>
              <Stack align="center">
                <ThemeIcon color="gray" variant="light" size={52}><IconCalendarEvent size={26} /></ThemeIcon>
                <Text c="dimmed" size="sm">Escolha um dia no calendário</Text>
              </Stack>
            </Center>
          ) : !selectedItems.length ? (
            <Center py={50}><Text c="dimmed">Nenhuma escala nesta data.</Text></Center>
          ) : (
            <Stack gap="lg">
              {songs.length > 0 && (
                <Box>
                  <Group gap="xs" mb="sm"><IconMusic size={18} /><Text fw={700}>Repertório</Text></Group>
                  <Stack gap="xs">
                    {Object.entries(songsByTitle).map(([title, group]) => (
                      <Paper key={title} withBorder p="sm" bg="var(--app-surface-muted)">
                        <Text fw={600} size="sm">{title}</Text>
                        {group.map(personRow)}
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}
              {singers.length > 0 && (
                <Box>
                  <Group gap="xs" mb="sm"><IconMicrophone size={18} /><Text fw={700}>Cantores</Text></Group>
                  <Stack>{singers.map(personRow)}</Stack>
                </Box>
              )}
              {musicians.length > 0 && (
                <Box>
                  <Group gap="xs" mb="sm"><IconUsers size={18} /><Text fw={700}>Músicos</Text></Group>
                  <Stack>{musicians.map(personRow)}</Stack>
                </Box>
              )}
            </Stack>
          )}
        </Card>
      </Grid.Col>
    </Grid>
  )
}
