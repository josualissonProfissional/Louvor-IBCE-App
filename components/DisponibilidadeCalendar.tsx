'use client'

import { useEffect, useState } from 'react'
import { format, isSameDay } from 'date-fns'
import { Badge, Box, Card, Grid, Group, Loader, Paper, SimpleGrid, Skeleton, Stack, Text, ThemeIcon } from '@mantine/core'
import { Calendar, DatesProvider } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconX } from '@tabler/icons-react'
import 'dayjs/locale/pt-br'
import { AtualizarDisponibilidade, DiaAtuacao, Disponibilidade, NovaDisponibilidade } from '@/types'
import { createClient } from '@/lib/supabase/client'
import styles from './CalendarBoard.module.css'

const parseDate = (value: string) => { const [y, m, d] = value.split('-').map(Number); return new Date(y, m - 1, d, 12) }

export default function DisponibilidadeCalendar({ diasAtuacao, disponibilidade: initial, userId, initialDate }: { diasAtuacao: DiaAtuacao[]; disponibilidade: Disponibilidade[]; userId: string; initialDate: string }) {
  const [month, setMonth] = useState(() => parseDate(initialDate))
  const [mounted, setMounted] = useState(false)
  const [days, setDays] = useState(diasAtuacao)
  const [availability, setAvailability] = useState(initial)
  const [loadingDate, setLoadingDate] = useState<string | null>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const start = format(new Date(month.getFullYear(), month.getMonth(), 1), 'yyyy-MM-dd')
    const end = format(new Date(month.getFullYear(), month.getMonth() + 1, 0), 'yyyy-MM-dd')
    fetch(`/api/dias-atuacao?data_inicio=${start}&data_fim=${end}`).then(async (r) => r.ok && setDays(await r.json())).catch(console.error)
    const supabase = createClient()
    supabase.from('disponibilidade').select('*').eq('usuario_id', userId).gte('data', start).lte('data', end).order('data').then(({ data }) => data && setAvailability(data))
  }, [month, userId])

  const isActing = (date: Date) => days.some((day) => isSameDay(parseDate(day.data), date))
  const getStatus = (date: Date) => availability.find((item) => isSameDay(parseDate(item.data), date))

  const toggle = async (date: Date) => {
    if (!isActing(date)) return
    const dateString = format(date, 'yyyy-MM-dd'); setLoadingDate(dateString)
    const existing = getStatus(date); const supabase = createClient()
    try {
      if (existing) {
        const status = existing.status === 'disponivel' ? 'indisponivel' : 'disponivel'
        const payload: AtualizarDisponibilidade = { status }
        const { error } = await (supabase.from('disponibilidade') as any).update(payload).eq('id', existing.id)
        if (error) throw error
        setAvailability((current) => current.map((item) => item.id === existing.id ? { ...item, status } : item))
      } else {
        const payload: NovaDisponibilidade = { usuario_id: userId, data: dateString, status: 'disponivel' }
        const { data, error } = await supabase.from('disponibilidade').insert(payload as any).select().single()
        if (error) throw error
        if (data) setAvailability((current) => [...current, data])
      }
    } catch (error) {
      notifications.show({ color: 'red', title: 'Não foi possível salvar', message: 'Tente novamente em instantes.' })
    } finally { setLoadingDate(null) }
  }

  const available = availability.filter((item) => item.status === 'disponivel').length
  const unavailable = availability.filter((item) => item.status === 'indisponivel').length

  const renderDay = (value: string) => {
    const date = parseDate(value)
    const acting = isActing(date)
    const status = getStatus(date)
    const isAvailable = status?.status === 'disponivel'
    const isUnavailable = status?.status === 'indisponivel'

    return (
      <Stack gap={2} align="stretch" w="100%">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Text
            size="sm"
            fw={acting ? 700 : 500}
            c={isAvailable ? 'white' : isUnavailable ? 'red.8' : acting ? 'ibce.9' : undefined}
          >
            {date.getDate()}
          </Text>
          {acting && (
            <Badge
              size="xs"
              variant={isAvailable ? 'white' : isUnavailable ? 'light' : 'light'}
              color={isUnavailable ? 'red' : 'ibce'}
              radius="xs"
              px={4}
              h={{ base: 14, sm: 16 }}
              fz={{ base: 8, sm: 9 }}
              fw={700}
            >
              Culto
            </Badge>
          )}
        </Group>

        {status && (
          <Badge
            size="xs"
            variant={isAvailable ? 'white' : 'filled'}
            color={isAvailable ? 'ibce' : 'red'}
            radius="xs"
            px={4}
            h={{ base: 14, sm: 16 }}
            fz={{ base: 8, sm: 9 }}
            fw={700}
            mt={1}
          >
            {isAvailable ? 'Disponível' : 'Indisponível'}
          </Badge>
        )}

        {loadingDate === value && (
          <Loader size={9} color={isAvailable ? 'white' : isUnavailable ? 'red' : 'ibce'} mt={2} />
        )}
      </Stack>
    )
  }

  return (
    <Grid gutter="lg" align="flex-start">
      <Grid.Col span={{ base: 12, xl: 9 }}>
        <Card withBorder padding="lg" bg="var(--app-surface)">
          {mounted ? (
            <DatesProvider settings={{ locale: 'pt-br', firstDayOfWeek: 0, weekendDays: [0, 6] }}>
              <Calendar
                date={format(month, 'yyyy-MM-dd')}
                onDateChange={(value) => setMonth(parseDate(value))}
                renderDay={renderDay}
                highlightToday
                getDayProps={(value) => {
                  const date = parseDate(value)
                  const active = isActing(date)
                  const status = getStatus(date)
                  const isAvailable = status?.status === 'disponivel'
                  const isUnavailable = status?.status === 'indisponivel'

                  let dayClass = styles.dayDisabled
                  if (active) {
                    if (isUnavailable) {
                      dayClass = styles.dayUnavailable
                    } else if (isAvailable) {
                      dayClass = styles.dayAvailable
                    } else {
                      dayClass = styles.dayCulto
                    }
                  }

                  return {
                    'aria-disabled': !active,
                    selected: isAvailable,
                    'data-status': status?.status,
                    'data-culto': active ? 'true' : undefined,
                    className: dayClass,
                    onClick: () => active && !loadingDate && toggle(date)
                  }
                }}
                className={styles.calendar}
                classNames={{ calendarHeader: styles.header, month: styles.month, monthCell: styles.cell, day: styles.day }}
                ariaLabels={{ nextMonth: 'Próximo mês', previousMonth: 'Mês anterior', monthLevelControl: 'Selecionar mês' }}
              />
            </DatesProvider>
          ) : (
            <Skeleton h={510} radius="sm" />
          )}
        </Card>
      </Grid.Col>
      <Grid.Col span={{ base: 12, xl: 3 }}>
        <Stack gap="md">
          <Paper withBorder p="lg" bg="var(--app-surface)">
            <Text fw={700}>Como preencher</Text>
            <Text size="sm" c="dimmed" mt="xs">Clique em um dia de culto para alternar entre disponível e indisponível.</Text>
          </Paper>
          <SimpleGrid cols={{ base: 2, xl: 1 }}>
            <Paper withBorder p="md" bg="var(--app-surface)">
              <Group>
                <ThemeIcon color="green" variant="light"><IconCheck size={18} /></ThemeIcon>
                <Box>
                  <Text size="xl" fw={700}>{available}</Text>
                  <Text size="xs" c="dimmed">Disponíveis</Text>
                </Box>
              </Group>
            </Paper>
            <Paper withBorder p="md" bg="var(--app-surface)">
              <Group>
                <ThemeIcon color="red" variant="light"><IconX size={18} /></ThemeIcon>
                <Box>
                  <Text size="xl" fw={700}>{unavailable}</Text>
                  <Text size="xs" c="dimmed">Indisponíveis</Text>
                </Box>
              </Group>
            </Paper>
          </SimpleGrid>
        </Stack>
      </Grid.Col>
    </Grid>
  )
}
