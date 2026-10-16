'use client'

import { useMemo, useRef, useState } from 'react'
import { Avatar, Badge, Card, Group, Paper, Select, Stack, Table, Text } from '@mantine/core'
import { IconCalendarEvent } from '@tabler/icons-react'
import { formatDate, getDayName } from '@/lib/utils'
import { Disponibilidade, Usuario, DiaAtuacao } from '@/types'
import DisponibilidadeShareButton from './DisponibilidadeShareButton'

interface DisponibilidadeTableProps {
  diasAtuacao: DiaAtuacao[]
  usuarios: Usuario[]
  disponibilidades: Disponibilidade[]
  disponibilidadeMap: Record<string, Record<string, 'disponivel' | 'indisponivel'>>
}

const getCurrentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const formatMonth = (value: string) => {
  const [year, month] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
    .format(new Date(year, month - 1, 1))
    .replace(/^./, (letter) => letter.toUpperCase())
}

function StatusBadge({ status }: { status?: 'disponivel' | 'indisponivel' }) {
  if (status === 'disponivel') return <Badge color="green" variant="light">Disponível</Badge>
  if (status === 'indisponivel') return <Badge color="red" variant="light">Indisponível</Badge>
  return <Badge color="gray" variant="light">Não informado</Badge>
}

export default function DisponibilidadeTable({
  diasAtuacao, usuarios, disponibilidades, disponibilidadeMap,
}: DisponibilidadeTableProps) {
  const tableRef = useRef<HTMLDivElement>(null)
  const availableMonths = useMemo(() => [...new Set(diasAtuacao.map((dia) => dia.data.slice(0, 7)))].sort().reverse(), [diasAtuacao])
  const initialMonth = availableMonths.includes(getCurrentMonth()) ? getCurrentMonth() : (availableMonths[0] || getCurrentMonth())
  const [month, setMonth] = useState(initialMonth)
  const filteredDays = useMemo(() => diasAtuacao.filter((dia) => dia.data.startsWith(month)), [diasAtuacao, month])
  const filteredDates = new Set(filteredDays.map((dia) => dia.data))
  const filteredAvailability = disponibilidades.filter((item) => filteredDates.has(item.data))
  const monthOptions = availableMonths.map((value) => ({ value, label: formatMonth(value) }))

  return (
    <Stack gap="md">
      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" align="flex-end">
          <Select
            label="Mês de atuação"
            leftSection={<IconCalendarEvent size={17} />}
            data={monthOptions}
            value={month}
            onChange={(value) => value && setMonth(value)}
            allowDeselect={false}
            w={{ base: '100%', sm: 270 }}
          />
          <DisponibilidadeShareButton
            diasAtuacao={filteredDays}
            usuarios={usuarios}
            disponibilidades={filteredAvailability}
            tableRef={tableRef}
          />
        </Group>
      </Paper>

      {filteredDays.length === 0 ? (
        <Paper withBorder p="xl" radius="md" ta="center">
          <Text fw={600}>Nenhuma data cadastrada neste mês.</Text>
        </Paper>
      ) : (
        <div ref={tableRef}>
          <Paper withBorder radius="md" visibleFrom="sm" style={{ overflowX: 'auto' }}>
            <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th miw={190}>Integrante</Table.Th>
                  {filteredDays.map((dia) => (
                    <Table.Th key={dia.id} ta="center" miw={118}>
                      <Text size="sm" fw={700}>{formatDate(dia.data)}</Text>
                      <Text size="xs" c="dimmed" fw={400}>{getDayName(dia.data)}</Text>
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {usuarios.map((usuario) => (
                  <Table.Tr key={usuario.id}>
                    <Table.Td>
                      <Group gap="sm" wrap="nowrap">
                        <Avatar color="ibce" size="sm">{(usuario.nome || usuario.email).slice(0, 2).toUpperCase()}</Avatar>
                        <div><Text size="sm" fw={600}>{usuario.nome || usuario.email}</Text><Text size="xs" c="dimmed">{usuario.cargo}</Text></div>
                      </Group>
                    </Table.Td>
                    {filteredDays.map((dia) => <Table.Td key={dia.id} ta="center"><StatusBadge status={disponibilidadeMap[usuario.id]?.[dia.data]} /></Table.Td>)}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>

          <Stack hiddenFrom="sm" gap="md">
            {filteredDays.map((dia) => (
              <Card key={dia.id} withBorder radius="md" padding="md">
                <Group justify="space-between" mb="md">
                  <Text fw={700}>{formatDate(dia.data)}</Text>
                  <Badge color="ibce" variant="light">{getDayName(dia.data)}</Badge>
                </Group>
                <Stack gap={0}>
                  {usuarios.map((usuario, index) => (
                    <Group key={usuario.id} justify="space-between" wrap="nowrap" py="sm" style={{ borderTop: index ? '1px solid var(--mantine-color-default-border)' : undefined }}>
                      <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                        <Avatar color="ibce" size="sm">{(usuario.nome || usuario.email).slice(0, 2).toUpperCase()}</Avatar>
                        <div style={{ minWidth: 0 }}><Text size="sm" fw={600} truncate>{usuario.nome || usuario.email}</Text><Text size="xs" c="dimmed">{usuario.cargo}</Text></div>
                      </Group>
                      <StatusBadge status={disponibilidadeMap[usuario.id]?.[dia.data]} />
                    </Group>
                  ))}
                </Stack>
              </Card>
            ))}
          </Stack>
        </div>
      )}
    </Stack>
  )
}
