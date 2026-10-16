'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Alert, Badge, Button, Card, Checkbox, Group, Modal, Paper, Select,
  Skeleton, Stack, Table, Text, Title,
} from '@mantine/core'
import { DatePicker } from '@mantine/dates'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import {
  IconAlertCircle, IconArrowLeft, IconCalendarPlus, IconCheck,
  IconTrash,
} from '@tabler/icons-react'
import { DiaAtuacao } from '@/types'
import { formatDate, getDayName } from '@/lib/utils'

const currentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const formatMonth = (value: string) => {
  const [year, month] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
    .format(new Date(year, month - 1, 1))
    .replace(/^./, (letter) => letter.toUpperCase())
}

export default function DiasAtuacaoPage() {
  const [dias, setDias] = useState<DiaAtuacao[]>([])
  const [month, setMonth] = useState(currentMonth())
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [addOpened, setAddOpened] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDias = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/dias-atuacao')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível carregar as datas')
      setDias(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as datas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadDias() }, [loadDias])

  const monthOptions = useMemo(() => {
    const values = new Set(dias.map((dia) => dia.data.slice(0, 7)))
    values.add(currentMonth())
    return [...values].sort().reverse().map((value) => ({ value, label: formatMonth(value) }))
  }, [dias])

  const visibleDays = useMemo(
    () => dias.filter((dia) => dia.data.startsWith(month)).sort((a, b) => a.data.localeCompare(b.data)),
    [dias, month]
  )
  const visibleIds = visibleDays.map((dia) => dia.id)
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))
  const selectedCount = selectedIds.length

  const toggleAll = () => {
    setSelectedIds((current) => allVisibleSelected
      ? current.filter((id) => !visibleIds.includes(id))
      : [...new Set([...current, ...visibleIds])])
  }

  const addDays = async () => {
    if (selectedDates.length === 0) return
    setSaving(true)
    try {
      const response = await fetch('/api/dias-atuacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datas: selectedDates }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível adicionar as datas')
      const firstDate = [...selectedDates].sort()[0]
      setMonth(firstDate.slice(0, 7))
      setSelectedDates([])
      setAddOpened(false)
      await loadDias()
      notifications.show({
        color: 'green',
        title: data.created === 1 ? 'Data adicionada' : 'Datas adicionadas',
        message: `${data.created} ${data.created === 1 ? 'dia foi cadastrado' : 'dias foram cadastrados'}${data.skipped ? `; ${data.skipped} já existiam.` : '.'}`,
        icon: <IconCheck size={17} />,
      })
    } catch (err) {
      notifications.show({ color: 'red', title: 'Erro ao adicionar datas', message: err instanceof Error ? err.message : 'Tente novamente.' })
    } finally {
      setSaving(false)
    }
  }

  const deleteDays = async (ids: string[]) => {
    setDeleting(true)
    try {
      const response = await fetch('/api/dias-atuacao', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível excluir')
      setSelectedIds((current) => current.filter((id) => !ids.includes(id)))
      await loadDias()
      notifications.show({ color: 'green', title: ids.length > 1 ? 'Datas excluídas' : 'Data excluída', message: `${ids.length} ${ids.length > 1 ? 'datas foram removidas' : 'data foi removida'}.` })
    } catch (err) {
      notifications.show({ color: 'red', title: 'Erro ao excluir', message: err instanceof Error ? err.message : 'Tente novamente.' })
    } finally {
      setDeleting(false)
    }
  }

  const confirmDelete = (ids: string[]) => modals.openConfirmModal({
    title: ids.length > 1 ? `Excluir ${ids.length} dias?` : 'Excluir este dia?',
    children: <Text size="sm">As disponibilidades relacionadas a essas datas também podem ser afetadas. Esta ação não pode ser desfeita.</Text>,
    labels: { confirm: 'Sim, excluir', cancel: 'Cancelar' },
    confirmProps: { color: 'red', leftSection: <IconTrash size={16} /> },
    centered: true,
    onConfirm: () => deleteDays(ids),
  })

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <Button component={Link} href="/admin" variant="subtle" px={0} leftSection={<IconArrowLeft size={17} />}>Voltar</Button>
          <Title order={1}>Dias de atuação</Title>
          <Text c="dimmed">Organize as datas por mês e faça alterações em conjunto.</Text>
        </div>
        <Button leftSection={<IconCalendarPlus size={18} />} onClick={() => { setSelectedDates([]); setAddOpened(true) }}>Adicionar dias</Button>
      </Group>

      {error && <Alert color="red" icon={<IconAlertCircle size={18} />} title="Não foi possível carregar">{error}</Alert>}

      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" align="flex-end">
          <Select label="Mês de atuação" data={monthOptions} value={month} onChange={(value) => value && setMonth(value)} allowDeselect={false} w={{ base: '100%', sm: 260 }} />
          {selectedCount > 0 && (
            <Button color="red" variant="light" loading={deleting} leftSection={<IconTrash size={17} />} onClick={() => confirmDelete(selectedIds)}>
              Excluir selecionados ({selectedCount})
            </Button>
          )}
        </Group>
      </Paper>

      {loading ? (
        <Stack>{[1, 2, 3].map((item) => <Skeleton key={item} h={68} radius="md" />)}</Stack>
      ) : visibleDays.length === 0 ? (
        <Paper withBorder p="xl" radius="md" ta="center">
          <Text fw={600}>Nenhum dia em {formatMonth(month)}</Text>
          <Text c="dimmed" size="sm" mt={4}>Adicione a primeira data desse mês para começar.</Text>
        </Paper>
      ) : (
        <>
          <Paper withBorder radius="md" visibleFrom="sm" style={{ overflow: 'hidden' }}>
            <Table verticalSpacing="md" horizontalSpacing="lg" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={46}><Checkbox checked={allVisibleSelected} indeterminate={selectedIds.some((id) => visibleIds.includes(id)) && !allVisibleSelected} onChange={toggleAll} aria-label="Selecionar todas as datas deste mês" /></Table.Th>
                  <Table.Th>Data</Table.Th><Table.Th>Dia da semana</Table.Th><Table.Th ta="right">Ações</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{visibleDays.map((dia) => (
                <Table.Tr key={dia.id}>
                  <Table.Td><Checkbox checked={selectedIds.includes(dia.id)} onChange={() => setSelectedIds((current) => current.includes(dia.id) ? current.filter((id) => id !== dia.id) : [...current, dia.id])} aria-label={`Selecionar ${formatDate(dia.data)}`} /></Table.Td>
                  <Table.Td><Text fw={600}>{formatDate(dia.data)}</Text></Table.Td>
                  <Table.Td><Badge color="ibce" variant="light">{getDayName(dia.data)}</Badge></Table.Td>
                  <Table.Td ta="right"><Button color="red" variant="subtle" size="xs" leftSection={<IconTrash size={15} />} onClick={() => confirmDelete([dia.id])}>Excluir</Button></Table.Td>
                </Table.Tr>
              ))}</Table.Tbody>
            </Table>
          </Paper>

          <Stack hiddenFrom="sm" gap="sm">
            <Checkbox checked={allVisibleSelected} indeterminate={selectedIds.some((id) => visibleIds.includes(id)) && !allVisibleSelected} onChange={toggleAll} label="Selecionar todas deste mês" />
            {visibleDays.map((dia) => (
              <Card key={dia.id} withBorder padding="md" radius="md">
                <Group justify="space-between" wrap="nowrap">
                  <Group wrap="nowrap">
                    <Checkbox checked={selectedIds.includes(dia.id)} onChange={() => setSelectedIds((current) => current.includes(dia.id) ? current.filter((id) => id !== dia.id) : [...current, dia.id])} aria-label={`Selecionar ${formatDate(dia.data)}`} />
                    <div><Text fw={700}>{formatDate(dia.data)}</Text><Text c="dimmed" size="sm">{getDayName(dia.data)}</Text></div>
                  </Group>
                  <Button color="red" variant="subtle" px="xs" onClick={() => confirmDelete([dia.id])} aria-label={`Excluir ${formatDate(dia.data)}`}><IconTrash size={18} /></Button>
                </Group>
              </Card>
            ))}
          </Stack>
        </>
      )}

      <Modal opened={addOpened} onClose={() => !saving && setAddOpened(false)} title="Adicionar dias de atuação" centered size="auto">
        <Stack>
          <Text size="sm" c="dimmed">Clique em todas as datas desejadas. Clique novamente em uma data para removê-la da seleção.</Text>
          <Group justify="center">
            <DatePicker
              type="multiple"
              value={selectedDates}
              onChange={setSelectedDates}
              minDate={new Date(2020, 0, 1)}
              excludeDate={(date) => dias.some((dia) => dia.data === date)}
              defaultDate={`${month}-01`}
              aria-label="Selecionar vários dias de atuação"
            />
          </Group>
          <Paper withBorder p="sm" bg="var(--app-surface-muted)">
            <Group justify="space-between">
              <Text size="sm" fw={600}>{selectedDates.length} {selectedDates.length === 1 ? 'data selecionada' : 'datas selecionadas'}</Text>
              <Text size="xs" c="dimmed">Datas já cadastradas ficam desabilitadas.</Text>
            </Group>
          </Paper>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setAddOpened(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={addDays} disabled={selectedDates.length === 0} loading={saving}>Salvar {selectedDates.length || ''} {selectedDates.length === 1 ? 'data' : 'datas'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
