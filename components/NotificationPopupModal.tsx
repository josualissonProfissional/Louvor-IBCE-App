'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Badge, Box, Button, CloseButton, Group,
  Paper, Stack, Text, ThemeIcon, Transition,
} from '@mantine/core'
import {
  IconCalendarEvent, IconWallet, IconBell, IconArrowRight,
} from '@tabler/icons-react'
import { Notificacao } from '@/types'

export function NotificationPopupModal() {
  const router = useRouter()
  const [alerta, setAlerta] = useState<Notificacao | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Verifica se já exibiu popup nesta sessão para não ser intrusivo
    const sessionSeenKey = 'ibce_popup_seen_id'

    async function checkUrgentNotifications() {
      try {
        const res = await fetch('/api/notificacoes')
        if (!res.ok) return
        const data = await res.json()
        const naoLidas: Notificacao[] = (data.notificacoes || []).filter((n: Notificacao) => !n.lida)

        // Busca primeiro uma de escala ou mensalidade
        const urgente = naoLidas.find((n) => n.tipo === 'escala' || n.tipo === 'mensalidade') || naoLidas[0]

        if (urgente) {
          const lastSeenId = sessionStorage.getItem(sessionSeenKey)
          if (lastSeenId !== urgente.id) {
            setAlerta(urgente)
            // Abre o popup com suave delay
            setTimeout(() => setVisible(true), 1200)
          }
        }
      } catch (err) {
        console.error('Erro ao verificar popups:', err)
      }
    }

    checkUrgentNotifications()
  }, [])

  const fechar = () => {
    if (alerta) {
      sessionStorage.setItem('ibce_popup_seen_id', alerta.id)
    }
    setVisible(false)
  }

  const navegarParaAcao = async () => {
    if (!alerta) return
    try {
      await fetch('/api/notificacoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alerta.id }),
      })
    } catch {}

    fechar()
    if (alerta.link) {
      router.push(alerta.link)
    }
  }

  if (!alerta) return null

  const isEscala = alerta.tipo === 'escala'
  const isMensalidade = alerta.tipo === 'mensalidade'

  return (
    <Transition mounted={visible} transition="slide-up" duration={350} timingFunction="ease">
      {(styles) => (
        <Paper
          shadow="xl"
          withBorder
          p="md"
          radius="md"
          style={{
            ...styles,
            position: 'fixed',
            bottom: 24,
            right: 24,
            maxWidth: 360,
            width: 'calc(100vw - 48px)',
            zIndex: 1000,
            backgroundColor: 'var(--app-surface)',
            borderLeft: `4px solid ${isEscala ? 'var(--mantine-color-ibce-6)' : isMensalidade ? 'var(--mantine-color-orange-6)' : 'var(--mantine-color-blue-6)'}`,
          }}
        >
          <Group justify="space-between" align="flex-start" wrap="nowrap" mb={6}>
            <Group gap="xs" wrap="nowrap">
              <ThemeIcon
                color={isEscala ? 'ibce' : isMensalidade ? 'orange' : 'blue'}
                variant="light"
                size="md"
                radius="xl"
              >
                {isEscala ? <IconCalendarEvent size={18} /> : isMensalidade ? <IconWallet size={18} /> : <IconBell size={18} />}
              </ThemeIcon>
              <div>
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  {isEscala ? 'Nova Escala' : isMensalidade ? 'Aviso de Mensalidade' : 'Novo Comunicado'}
                </Text>
                <Text fw={700} size="sm" lineClamp={1}>
                  {alerta.titulo}
                </Text>
              </div>
            </Group>
            <CloseButton size="sm" onClick={fechar} aria-label="Fechar aviso" />
          </Group>

          <Text size="sm" c="dimmed" mt={4} mb="md">
            {alerta.mensagem}
          </Text>

          <Group justify="flex-end" gap="xs">
            <Button variant="subtle" size="xs" color="gray" onClick={fechar}>
              Depois
            </Button>
            <Button
              size="xs"
              color={isEscala ? 'ibce' : isMensalidade ? 'orange' : 'blue'}
              rightSection={<IconArrowRight size={14} />}
              onClick={navegarParaAcao}
            >
              Ver Detalhes
            </Button>
          </Group>
        </Paper>
      )}
    </Transition>
  )
}
