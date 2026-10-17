'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ActionIcon, Badge, Box, Button, Divider, Group,
  Indicator, Loader, Menu, Paper, ScrollArea, Stack, Text, ThemeIcon,
} from '@mantine/core'
import {
  IconBell, IconCalendarEvent, IconCheck, IconTrash,
  IconWallet, IconInfoCircle, IconAlertCircle,
} from '@tabler/icons-react'
import { Notificacao } from '@/types'

function formatTempoRelativo(isoString: string) {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime()
    const diffMin = Math.floor(diffMs / (1000 * 60))
    if (diffMin < 1) return 'Agora mesmo'
    if (diffMin < 60) return `Há ${diffMin} min`
    const diffHoras = Math.floor(diffMin / 60)
    if (diffHoras < 24) return `Há ${diffHoras}h`
    const diffDias = Math.floor(diffHoras / 24)
    if (diffDias === 1) return 'Ontem'
    if (diffDias < 7) return `Há ${diffDias} dias`
    const [y, m, d] = isoString.split('T')[0].split('-')
    return `${d}/${m}/${y}`
  } catch {
    return 'Recentemente'
  }
}

export function NotificationBell() {
  const router = useRouter()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [naoLidas, setNaoLidas] = useState(0)
  const [loading, setLoading] = useState(false)
  const [opened, setOpened] = useState(false)

  const loadNotificacoes = useCallback(async () => {
    try {
      const res = await fetch('/api/notificacoes')
      if (res.ok) {
        const data = await res.json()
        setNotificacoes(data.notificacoes || [])
        setNaoLidas(data.nao_lidas || 0)
      }
    } catch (err) {
      console.error('Erro ao buscar notificações:', err)
    }
  }, [])

  useEffect(() => {
    loadNotificacoes()
    // Atualiza periodicamente a cada 45 segundos
    const interval = setInterval(loadNotificacoes, 45000)
    return () => clearInterval(interval)
  }, [loadNotificacoes])

  const marcarComoLida = async (id: string, link?: string | null) => {
    try {
      await fetch('/api/notificacoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setNotificacoes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
      )
      setNaoLidas((prev) => Math.max(0, prev - 1))
      setOpened(false)
      if (link) {
        router.push(link)
      }
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err)
    }
  }

  const marcarTodasComoLidas = async () => {
    try {
      await fetch('/api/notificacoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marcar_todas: true }),
      })
      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })))
      setNaoLidas(0)
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err)
    }
  }

  const limparLidas = async () => {
    try {
      await fetch('/api/notificacoes?limpar_lidas=true', { method: 'DELETE' })
      setNotificacoes((prev) => prev.filter((n) => !n.lida))
    } catch (err) {
      console.error('Erro ao limpar notificações:', err)
    }
  }

  const getIcone = (tipo: string) => {
    switch (tipo) {
      case 'escala':
        return <ThemeIcon color="ibce" variant="light" size="md" radius="xl"><IconCalendarEvent size={18} /></ThemeIcon>
      case 'mensalidade':
        return <ThemeIcon color="orange" variant="light" size="md" radius="xl"><IconWallet size={18} /></ThemeIcon>
      case 'aviso':
        return <ThemeIcon color="yellow" variant="light" size="md" radius="xl"><IconAlertCircle size={18} /></ThemeIcon>
      default:
        return <ThemeIcon color="blue" variant="light" size="md" radius="xl"><IconInfoCircle size={18} /></ThemeIcon>
    }
  }

  return (
    <Menu
      opened={opened}
      onChange={setOpened}
      position="bottom-end"
      width={340}
      shadow="lg"
      withinPortal
    >
      <Menu.Target>
        <Indicator
          disabled={naoLidas === 0}
          label={naoLidas > 9 ? '9+' : naoLidas}
          size={16}
          offset={4}
          color="red"
          withBorder
        >
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            aria-label="Notificações"
            onClick={() => setOpened((o) => !o)}
          >
            <IconBell size={20} />
          </ActionIcon>
        </Indicator>
      </Menu.Target>

      <Menu.Dropdown p={0}>
        <Box p="xs" bg="var(--app-surface)">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Text fw={700} size="sm">Notificações</Text>
              {naoLidas > 0 && (
                <Badge size="xs" color="red" variant="filled">{naoLidas} nova{naoLidas > 1 ? 's' : ''}</Badge>
              )}
            </Group>

            {naoLidas > 0 && (
              <Button variant="subtle" size="compact-xs" color="ibce" onClick={marcarTodasComoLidas}>
                Marcar lidas
              </Button>
            )}
          </Group>
        </Box>

        <Divider />

        <ScrollArea.Autosize mah={360}>
          {notificacoes.length === 0 ? (
            <Box py={36} ta="center" px="md">
              <IconBell size={32} color="var(--mantine-color-dimmed)" style={{ opacity: 0.5 }} />
              <Text size="sm" fw={600} mt="xs">Nenhuma notificação</Text>
              <Text size="xs" c="dimmed">Você está em dia com todos os avisos do ministério!</Text>
            </Box>
          ) : (
            <Stack gap={0}>
              {notificacoes.map((item) => (
                <Box
                  key={item.id}
                  p="xs"
                  onClick={() => marcarComoLida(item.id, item.link)}
                  style={{
                    cursor: 'pointer',
                    background: item.lida ? 'transparent' : 'var(--mantine-color-ibce-0)',
                    borderBottom: '1px solid var(--app-border)',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <Group wrap="nowrap" align="flex-start" gap="xs">
                    {getIcone(item.tipo)}
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Group justify="space-between" wrap="nowrap" gap={4}>
                        <Text size="xs" fw={item.lida ? 600 : 700} truncate>{item.titulo}</Text>
                        <Text size="10px" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                          {formatTempoRelativo(item.created_at)}
                        </Text>
                      </Group>
                      <Text size="xs" c={item.lida ? 'dimmed' : 'var(--app-text)'} lineClamp={2} mt={2}>
                        {item.mensagem}
                      </Text>
                    </Box>
                    {!item.lida && (
                      <Box w={7} h={7} bg="ibce.6" style={{ borderRadius: '50%', flexShrink: 0, marginTop: 4 }} />
                    )}
                  </Group>
                </Box>
              ))}
            </Stack>
          )}
        </ScrollArea.Autosize>

        {notificacoes.some((n) => n.lida) && (
          <>
            <Divider />
            <Box p={6} ta="center">
              <Button
                variant="subtle"
                size="compact-xs"
                color="gray"
                leftSection={<IconTrash size={12} />}
                onClick={limparLidas}
              >
                Limpar notificações lidas
              </Button>
            </Box>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  )
}
