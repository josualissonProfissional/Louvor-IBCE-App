'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ActionIcon, AppShell, Avatar, Box, Burger, Divider, Group, Menu,
  Loader, NavLink, Paper, ScrollArea, Skeleton, Stack, Text, UnstyledButton,
  useComputedColorScheme, useMantineColorScheme,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconBrain, IconCalendarEvent, IconChevronDown, IconClipboardCheck,
  IconCoin, IconDashboard, IconLogin, IconLogout, IconMoon, IconMusic,
  IconSettings, IconSun, IconWallet,
} from '@tabler/icons-react'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from './NotificationBell'
import { NotificationPopupModal } from './NotificationPopupModal'

type NavigationUser = {
  id: string
  nome: string | null
  email: string
  lider: boolean
  tesoureiro: boolean
  cargo: 'cantor' | 'musico' | 'ambos'
  instrumento_id: string | null
}

const publicItems = [
  { href: '/', label: 'Visão geral', icon: IconDashboard },
  { href: '/musicas', label: 'Músicas', icon: IconMusic },
  { href: '/escalas', label: 'Escalas', icon: IconCalendarEvent },
]

const memberItems = [
  { href: '/disponibilidade', label: 'Disponibilidade', icon: IconClipboardCheck },
  { href: '/ia', label: 'Assistente teológico', icon: IconBrain },
]

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [opened, { toggle, close }] = useDisclosure(false)
  const { toggleColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<NavigationUser | null>(null)
  const [moduloMensalidadeAtivo, setModuloMensalidadeAtivo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [navigating, setNavigating] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let active = true

    async function loadUser() {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()

      if (!authData.user) {
        if (active) setLoading(false)
        return
      }

      const { data } = await supabase
        .from('usuarios')
        .select('id, nome, email, lider, tesoureiro, cargo, instrumento_id')
        .eq('id', authData.user.id)
        .single()

      if (active) {
        setUser(data)
        setLoading(false)
      }

      // Consulta se o módulo de mensalidade está ativo no sistema
      const { data: cfg } = await (supabase
        .from('configuracoes') as any)
        .select('modulo_mensalidade_ativo')
        .eq('id', 'geral')
        .maybeSingle()

      if (active && (cfg as any)?.modulo_mensalidade_ativo) {
        setModuloMensalidadeAtivo(true)
      }
    }

    loadUser()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!user?.id) return

    const supabase = createClient()
    const channel = supabase.channel('louvor-online', {
      config: { presence: { key: user.id } },
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: user.id, online_at: new Date().toISOString() })
      }
    })

    return () => {
      channel.untrack()
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  useEffect(() => {
    setNavigating(false)

    const handleNavigationClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const anchor = target?.closest('a') as HTMLAnchorElement | null
      if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return

      const destination = new URL(anchor.href, window.location.href)
      if (destination.origin === window.location.origin && destination.pathname !== window.location.pathname) {
        setNavigating(true)
      }
    }

    document.addEventListener('click', handleNavigationClick)
    return () => document.removeEventListener('click', handleNavigationClick)
  }, [pathname])

  if (pathname === '/login') return <>{children}</>

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href)
  const renderItem = ({ href, label, icon: Icon }: (typeof publicItems)[number]) => (
    <NavLink
      key={href}
      component={Link}
      href={href}
      label={label}
      leftSection={<Icon size={19} stroke={1.7} />}
      active={isActive(href)}
      onClick={close}
      variant="light"
    />
  )

  const handleLogout = async () => {
    await createClient().auth.signOut()
    window.location.assign('/login')
  }

  const initials = (user?.nome || user?.email || 'IB')
    .split(/\s|@/).filter(Boolean).slice(0, 2)
    .map((part) => part[0].toUpperCase()).join('')

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 264, breakpoint: 'md', collapsed: { mobile: !opened } }}
      padding={{ base: 'md', sm: 'lg' }}
      styles={{
        main: { background: 'var(--app-background)' },
        header: { background: 'var(--app-surface)', borderColor: 'var(--app-border)' },
        navbar: { background: 'var(--app-surface)', borderColor: 'var(--app-border)' },
      }}
    >
      {navigating && (
        <Paper
          className="route-loading-indicator"
          withBorder
          shadow="sm"
          px="md"
          py={9}
          role="status"
          aria-live="polite"
        >
          <Group gap="sm" wrap="nowrap">
            <Loader color="ibce" size="xs" type="dots" />
            <Text size="sm" fw={650}>Abrindo página…</Text>
          </Group>
        </Paper>
      )}
      <AppShell.Header px={{ base: 'md', sm: 'lg' }}>
        <Group h="100%" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" aria-label="Abrir navegação" />
            <UnstyledButton component={Link} href="/" aria-label="Ir para a página inicial">
              <Group gap="sm" wrap="nowrap">
                <Image src="/icon.svg" alt="Logo da IBCE" width={38} height={38} priority />
                <Box>
                  <Text fw={700} size="sm" lh={1.2}>Louvor IBCE</Text>
                  <Text c="dimmed" size="xs" visibleFrom="xs">Ministério de música</Text>
                </Box>
              </Group>
            </UnstyledButton>
          </Group>

          <Group gap="xs" wrap="nowrap">
            {user && <NotificationBell />}

            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              onClick={toggleColorScheme}
              aria-label={mounted ? (computedColorScheme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro') : 'Alternar tema'}
            >
              {mounted ? (
                computedColorScheme === 'dark' ? <IconSun size={19} /> : <IconMoon size={19} />
              ) : (
                <Box w={19} h={19} />
              )}
            </ActionIcon>

            {loading ? <Skeleton h={36} w={112} radius="sm" /> : user ? (
              <Menu position="bottom-end" width={220} shadow="md">
                <Menu.Target>
                  <UnstyledButton aria-label="Abrir menu da conta">
                    <Group gap="xs" wrap="nowrap">
                      <Avatar color="ibce" size={34} radius="xl">{initials}</Avatar>
                      <Box visibleFrom="sm" maw={150}>
                        <Text size="sm" fw={600} truncate>{user.nome || 'Integrante'}</Text>
                        <Text size="xs" c="dimmed" truncate>{user.email}</Text>
                      </Box>
                      <IconChevronDown size={15} />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Conta</Menu.Label>
                  {user.lider && (
                    <Menu.Item component={Link} href="/admin" leftSection={<IconSettings size={16} />}>
                      Administração
                    </Menu.Item>
                  )}
                  {(user.lider || user.tesoureiro) && (
                    <Menu.Item component={Link} href="/admin/mensalidades" leftSection={<IconCoin size={16} />}>
                      Tesouraria
                    </Menu.Item>
                  )}
                  {(moduloMensalidadeAtivo || user.lider || user.tesoureiro) && (
                    <Menu.Item component={Link} href="/mensalidades" leftSection={<IconWallet size={16} />}>
                      Minha Mensalidade
                    </Menu.Item>
                  )}
                  <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={handleLogout}>Sair</Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <UnstyledButton component={Link} href="/login">
                <Group gap={6}><IconLogin size={18} /><Text size="sm" fw={600}>Entrar</Text></Group>
              </UnstyledButton>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <AppShell.Section grow component={ScrollArea} scrollbarSize={6}>
          <Stack gap={4}>
            <Text size="xs" fw={700} c="dimmed" px="sm" py={6}>NAVEGAÇÃO</Text>
            {publicItems.map(renderItem)}
            {user && memberItems.map(renderItem)}
            {user && (moduloMensalidadeAtivo || user.lider || user.tesoureiro) && (
              renderItem({ href: '/mensalidades', label: 'Mensalidade', icon: IconWallet })
            )}
            {(user?.lider || user?.tesoureiro) && (
              <>
                <Divider my="xs" />
                <Text size="xs" fw={700} c="dimmed" px="sm" py={6}>GESTÃO</Text>
                {user?.lider && renderItem({ href: '/admin', label: 'Administração', icon: IconSettings })}
                {renderItem({ href: '/admin/mensalidades', label: 'Tesouraria', icon: IconCoin })}
              </>
            )}
          </Stack>
        </AppShell.Section>
        <AppShell.Section pt="sm">
          <Divider mb="sm" />
          <Text size="xs" c="dimmed" px="sm">IBCE · Semeando a Verdade</Text>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Box w="100%" maw={1600} mx="auto">{children}</Box>
        {user && <NotificationPopupModal />}
      </AppShell.Main>
    </AppShell>
  )
}
