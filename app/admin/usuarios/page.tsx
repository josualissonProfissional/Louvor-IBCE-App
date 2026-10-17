'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Alert, Avatar, Badge, Button, Card, Group, Modal, Paper, PasswordInput,
  Select, SimpleGrid, Skeleton, Stack, Switch, Table, Text, TextInput, Title,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import {
  IconAlertCircle, IconArrowLeft, IconCheck, IconEdit, IconPlus,
  IconSearch, IconTrash, IconUser,
} from '@tabler/icons-react'
import { Instrumento, Usuario } from '@/types'
import { createClient } from '@/lib/supabase/client'

type AdminUser = Usuario & {
  instrumento?: Instrumento | null
  last_sign_in_at?: string | null
}

type UserForm = {
  nome: string
  email: string
  senha: string
  data_nascimento: string
  cargo: 'cantor' | 'musico' | 'ambos'
  lider: boolean
  tesoureiro: boolean
  instrumento_id: string
}

const emptyForm: UserForm = {
  nome: '', email: '', senha: '', data_nascimento: '', cargo: 'ambos', lider: false, tesoureiro: false, instrumento_id: '',
}

const cargoLabel: Record<UserForm['cargo'], string> = { cantor: 'Cantor', musico: 'Músico', ambos: 'Cantor e músico' }

function formatLastLogin(value?: string | null) {
  if (!value) return 'Nunca entrou'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [instruments, setInstruments] = useState<Instrumento[]>([])
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set())
  const [form, setForm] = useState<UserForm>(emptyForm)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [opened, setOpened] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [cargo, setCargo] = useState('todos')
  const [access, setAccess] = useState('todos')

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const [usersResponse, instrumentsResponse] = await Promise.all([fetch('/api/usuarios'), fetch('/api/instrumentos')])
      const [usersData, instrumentsData] = await Promise.all([usersResponse.json(), instrumentsResponse.json()])
      if (!usersResponse.ok) throw new Error(usersData.error || 'Não foi possível carregar os usuários')
      if (!instrumentsResponse.ok) throw new Error(instrumentsData.error || 'Não foi possível carregar os instrumentos')
      setUsers(usersData)
      setInstruments(instrumentsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('louvor-online')

    const syncPresence = () => {
      const ids = Object.values(channel.presenceState())
        .flat()
        .map((presence) => (presence as unknown as { user_id?: string }).user_id)
        .filter((id): id is string => Boolean(id))
      setOnlineIds(new Set(ids))
    }

    channel.on('presence', { event: 'sync' }, syncPresence).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const filteredUsers = useMemo(() => users.filter((user) => {
    const term = search.trim().toLowerCase()
    const matchesText = !term || (user.nome || '').toLowerCase().includes(term) || user.email.toLowerCase().includes(term)
    const matchesCargo = cargo === 'todos' || user.cargo === cargo
    const matchesAccess = access === 'todos' || (access === 'admin' ? user.lider : access === 'tesoureiro' ? user.tesoureiro : (!user.lider && !user.tesoureiro))
    return matchesText && matchesCargo && matchesAccess
  }), [users, search, cargo, access])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setOpened(true)
  }

  const openEdit = (user: AdminUser) => {
    setEditing(user)
    setForm({
      nome: user.nome || '', email: user.email, senha: '', data_nascimento: user.data_nascimento,
      cargo: user.cargo, lider: user.lider, tesoureiro: Boolean(user.tesoureiro), instrumento_id: user.instrumento_id || '',
    })
    setOpened(true)
  }

  const saveUser = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        nome: form.nome || null, email: form.email, data_nascimento: form.data_nascimento,
        cargo: form.cargo, lider: form.lider, tesoureiro: form.tesoureiro, instrumento_id: form.instrumento_id || null,
      }
      if (form.senha.trim()) body.senha = form.senha
      const response = await fetch(editing ? `/api/usuarios/${editing.id}` : '/api/usuarios', {
        method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível salvar o usuário')
      setOpened(false)
      await loadData()
      notifications.show({ color: 'green', title: editing ? 'Usuário atualizado' : 'Usuário criado', message: 'As informações foram salvas.', icon: <IconCheck size={17} /> })
    } catch (err) {
      notifications.show({ color: 'red', title: 'Erro ao salvar', message: err instanceof Error ? err.message : 'Tente novamente.' })
    } finally {
      setSaving(false)
    }
  }

  const deleteUser = async (user: AdminUser) => {
    setDeletingId(user.id)
    try {
      const response = await fetch(`/api/usuarios/${user.id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível remover o usuário')
      await loadData()
      notifications.show({ color: 'green', title: 'Usuário removido', message: `${user.nome || user.email} foi removido.` })
    } catch (err) {
      notifications.show({ color: 'red', title: 'Erro ao remover', message: err instanceof Error ? err.message : 'Tente novamente.' })
    } finally {
      setDeletingId(null)
    }
  }

  const confirmDelete = (user: AdminUser) => modals.openConfirmModal({
    title: 'Remover usuário?', centered: true,
    children: <Text size="sm">A conta de <strong>{user.nome || user.email}</strong> será removida e perderá o acesso ao sistema. Esta ação não pode ser desfeita.</Text>,
    labels: { confirm: 'Sim, remover', cancel: 'Cancelar' }, confirmProps: { color: 'red', leftSection: <IconTrash size={16} /> },
    onConfirm: () => deleteUser(user),
  })

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <Button component={Link} href="/admin" variant="subtle" px={0} leftSection={<IconArrowLeft size={17} />}>Voltar</Button>
          <Title order={1}>Gerenciar usuários</Title>
          <Text c="dimmed">Contas, funções e atividade dos integrantes.</Text>
        </div>
        <Button leftSection={<IconPlus size={18} />} onClick={openCreate}>Novo usuário</Button>
      </Group>

      {error && <Alert color="red" icon={<IconAlertCircle size={18} />} title="Não foi possível carregar">{error}</Alert>}

      <Paper withBorder p="md" radius="md">
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <TextInput label="Buscar" placeholder="Nome ou e-mail" leftSection={<IconSearch size={17} />} value={search} onChange={(event) => setSearch(event.currentTarget.value)} />
          <Select label="Função" value={cargo} onChange={(value) => setCargo(value || 'todos')} allowDeselect={false} data={[{ value: 'todos', label: 'Todas' }, { value: 'cantor', label: 'Cantor' }, { value: 'musico', label: 'Músico' }, { value: 'ambos', label: 'Cantor e músico' }]} />
          <Select label="Acesso" value={access} onChange={(value) => setAccess(value || 'todos')} allowDeselect={false} data={[{ value: 'todos', label: 'Todos' }, { value: 'admin', label: 'Líderes' }, { value: 'tesoureiro', label: 'Tesoureiros' }, { value: 'membro', label: 'Membros' }]} />
        </SimpleGrid>
        <Text size="xs" c="dimmed" mt="sm">{filteredUsers.length} de {users.length} integrantes</Text>
      </Paper>

      {loading ? <Stack>{[1, 2, 3].map((item) => <Skeleton key={item} h={74} radius="md" />)}</Stack> : (
        <>
          <Paper withBorder radius="md" visibleFrom="md" style={{ overflowX: 'auto' }}>
            <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover>
              <Table.Thead><Table.Tr><Table.Th>Integrante</Table.Th><Table.Th>Função</Table.Th><Table.Th>Status</Table.Th><Table.Th>Último login</Table.Th><Table.Th>Acesso</Table.Th><Table.Th ta="right">Ações</Table.Th></Table.Tr></Table.Thead>
              <Table.Tbody>{filteredUsers.map((user) => (
                <Table.Tr key={user.id}>
                  <Table.Td><Group gap="sm" wrap="nowrap"><Avatar color="ibce">{(user.nome || user.email).slice(0, 2).toUpperCase()}</Avatar><div><Text fw={600} size="sm">{user.nome || 'Sem nome'}</Text><Text c="dimmed" size="xs">{user.email}</Text></div></Group></Table.Td>
                  <Table.Td><Text size="sm">{cargoLabel[user.cargo]}</Text><Text c="dimmed" size="xs">{user.instrumento?.nome || 'Sem instrumento'}</Text></Table.Td>
                  <Table.Td><Badge color={onlineIds.has(user.id) ? 'green' : 'gray'} variant="dot">{onlineIds.has(user.id) ? 'Online' : 'Offline'}</Badge></Table.Td>
                  <Table.Td><Text size="sm">{formatLastLogin(user.last_sign_in_at)}</Text></Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {user.lider && <Badge color="ibce" variant="light">Líder</Badge>}
                      {user.tesoureiro && <Badge color="yellow" variant="light">Tesoureiro</Badge>}
                      {!user.lider && !user.tesoureiro && <Badge color="gray" variant="light">Membro</Badge>}
                    </Group>
                  </Table.Td>
                  <Table.Td><Group justify="flex-end" gap="xs"><Button variant="subtle" size="xs" leftSection={<IconEdit size={15} />} onClick={() => openEdit(user)}>Editar</Button><Button color="red" variant="subtle" size="xs" loading={deletingId === user.id} leftSection={<IconTrash size={15} />} onClick={() => confirmDelete(user)}>Remover</Button></Group></Table.Td>
                </Table.Tr>
              ))}</Table.Tbody>
            </Table>
          </Paper>

          <Stack hiddenFrom="md" gap="sm">
            {filteredUsers.map((user) => (
              <Card key={user.id} withBorder radius="md" padding="md">
                <Group justify="space-between" align="flex-start" wrap="nowrap"><Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}><Avatar color="ibce">{(user.nome || user.email).slice(0, 2).toUpperCase()}</Avatar><div style={{ minWidth: 0 }}><Text fw={700} truncate>{user.nome || 'Sem nome'}</Text><Text size="xs" c="dimmed" truncate>{user.email}</Text></div></Group><Badge color={onlineIds.has(user.id) ? 'green' : 'gray'} variant="dot">{onlineIds.has(user.id) ? 'Online' : 'Offline'}</Badge></Group>
                <SimpleGrid cols={2} mt="md">
                  <div><Text size="xs" c="dimmed">Função</Text><Text size="sm">{cargoLabel[user.cargo]}</Text></div>
                  <div><Text size="xs" c="dimmed">Acesso</Text><Text size="sm">{user.lider ? 'Líder' : user.tesoureiro ? 'Tesoureiro' : 'Membro'}</Text></div>
                </SimpleGrid>
                <Group mt="md" grow><Button variant="light" leftSection={<IconEdit size={16} />} onClick={() => openEdit(user)}>Editar</Button><Button color="red" variant="light" loading={deletingId === user.id} leftSection={<IconTrash size={16} />} onClick={() => confirmDelete(user)}>Remover</Button></Group>
              </Card>
            ))}
          </Stack>
        </>
      )}

      {!loading && filteredUsers.length === 0 && <Paper withBorder p="xl" radius="md" ta="center"><IconUser size={32} color="var(--mantine-color-dimmed)" /><Text fw={600} mt="sm">Nenhum usuário encontrado</Text><Text c="dimmed" size="sm">Ajuste os filtros e tente novamente.</Text></Paper>}

      <Modal opened={opened} onClose={() => !saving && setOpened(false)} title={editing ? 'Editar usuário' : 'Novo usuário'} centered size="lg">
        <form onSubmit={saveUser}>
          <Stack>
            <TextInput label="Nome completo" required value={form.nome} onChange={(event) => setForm({ ...form, nome: event.currentTarget.value })} />
            <TextInput label="E-mail" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.currentTarget.value })} />
            <PasswordInput label={editing ? 'Nova senha (opcional)' : 'Senha'} required={!editing} value={form.senha} onChange={(event) => setForm({ ...form, senha: event.currentTarget.value })} visibilityToggleButtonProps={({ visible }: { visible: boolean }) => ({ 'aria-label': visible ? 'Ocultar senha' : 'Mostrar senha' })} />
            <TextInput label="Data de nascimento" type="date" required value={form.data_nascimento} onChange={(event) => setForm({ ...form, data_nascimento: event.currentTarget.value })} />
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <Select label="Função" required allowDeselect={false} value={form.cargo} onChange={(value) => value && setForm({ ...form, cargo: value as UserForm['cargo'] })} data={[{ value: 'cantor', label: 'Cantor' }, { value: 'musico', label: 'Músico' }, { value: 'ambos', label: 'Cantor e músico' }]} />
              <Select label="Instrumento" clearable value={form.instrumento_id || null} onChange={(value) => setForm({ ...form, instrumento_id: value || '' })} data={instruments.map((instrument) => ({ value: instrument.id, label: instrument.nome }))} />
            </SimpleGrid>
            <Switch label="Administrador / Líder (Acesso total ao sistema)" checked={form.lider} onChange={(event) => setForm({ ...form, lider: event.currentTarget.checked })} />
            <Switch label="Tesoureiro (Gestão e baixa de mensalidades)" checked={form.tesoureiro} onChange={(event) => setForm({ ...form, tesoureiro: event.currentTarget.checked })} />
            <Group justify="flex-end"><Button variant="default" onClick={() => setOpened(false)} disabled={saving}>Cancelar</Button><Button type="submit" loading={saving}>Salvar</Button></Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  )
}
