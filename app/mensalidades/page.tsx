'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Alert, Badge, Box, Button, Card, Divider, Grid, Group, Paper,
  SimpleGrid, Skeleton, Stack, Table, Text, ThemeIcon, Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconAlertCircle, IconArrowRight, IconCalendar, IconCheck,
  IconCopy, IconCreditCard, IconHistory, IconInfoCircle,
  IconShieldCheck, IconWallet, IconX,
} from '@tabler/icons-react'
import { CicloMensalidade, Configuracao, PagamentoMensalidade } from '@/types'

interface MeuPagamentoItem extends PagamentoMensalidade {
  ciclo: CicloMensalidade
}

const mesesNomes = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export default function MinhasMensalidadesPage() {
  const [loading, setLoading] = useState(true)
  const [moduloAtivo, setModuloAtivo] = useState(true)
  const [config, setConfig] = useState<Configuracao | null>(null)
  const [historico, setHistorico] = useState<MeuPagamentoItem[]>([])
  const [canManage, setCanManage] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [resConfig, resPags] = await Promise.all([
          fetch('/api/configuracoes'),
          fetch('/api/mensalidades/pagamentos'),
        ])

        if (resConfig.ok) {
          const dataConf = await resConfig.json()
          setConfig(dataConf.configuracao)
          setModuloAtivo(Boolean(dataConf.configuracao?.modulo_mensalidade_ativo))
          setCanManage(Boolean(dataConf.canManageFinances))
        }

        if (resPags.ok) {
          const dataPags = await resPags.json()
          setHistorico(dataPags || [])
        }
      } catch (err) {
        console.error('Erro ao carregar mensalidades:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const copiarPix = async () => {
    if (!config?.chave_pix) return
    try {
      await navigator.clipboard.writeText(config.chave_pix)
      notifications.show({
        color: 'green',
        title: 'Chave PIX copiada!',
        message: 'A chave foi copiada para sua área de transferência.',
        icon: <IconCopy size={18} />,
      })
    } catch {
      notifications.show({ color: 'red', title: 'Erro', message: 'Não foi possível copiar automaticamente.' })
    }
  }

  const formatMoeda = (val: number) =>
    Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const formatData = (val?: string | null) => {
    if (!val) return '—'
    const [y, m, d] = val.split('T')[0].split('-')
    return `${d}/${m}/${y}`
  }

  // O pagamento mais recente representa o ciclo atual
  const pagamentoAtual = historico.length > 0 ? historico[0] : null
  const isAtualPago = pagamentoAtual?.status === 'pago'
  const isAtualIsento = pagamentoAtual?.status === 'isento'

  if (loading) {
    return (
      <Stack gap="lg">
        <Skeleton h={40} w={280} />
        <Skeleton h={220} radius="md" />
        <Skeleton h={300} radius="md" />
      </Stack>
    )
  }

  if (!moduloAtivo && !canManage) {
    return (
      <Paper withBorder p="xl" radius="md" ta="center">
        <ThemeIcon size={56} radius="xl" color="gray" variant="light" mx="auto">
          <IconWallet size={28} />
        </ThemeIcon>
        <Title order={3} mt="md">Mensalidades Desativadas</Title>
        <Text c="dimmed" mt="xs" maw={480} mx="auto">
          O módulo de mensalidade não está ativado pela liderança no momento.
        </Text>
      </Paper>
    )
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={1}>Minha Mensalidade</Title>
          <Text c="dimmed">Contribuição mensal para custos e materiais do Ministério de Louvor.</Text>
        </div>

        {canManage && (
          <Button component={Link} href="/admin/mensalidades" variant="light" leftSection={<IconWallet size={18} />}>
            Painel da Tesouraria
          </Button>
        )}
      </Group>

      {/* Card Principal do Mês Vigente */}
      {pagamentoAtual ? (
        <Card withBorder padding="lg" radius="md" bg="var(--app-surface)">
          <Grid gutter="lg" align="center">
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Group gap="xs" mb="xs">
                <Badge size="lg" color="ibce" variant="light">
                  {pagamentoAtual.ciclo ? `${mesesNomes[pagamentoAtual.ciclo.mes - 1]} de ${pagamentoAtual.ciclo.ano}` : 'Mês Atual'}
                </Badge>
                {isAtualPago && <Badge color="green" size="lg" variant="filled" leftSection={<IconCheck size={14} />}>Mensalidade Paga</Badge>}
                {isAtualIsento && <Badge color="blue" size="lg" variant="filled">Isento</Badge>}
                {!isAtualPago && !isAtualIsento && <Badge color="orange" size="lg" variant="filled">Pendente</Badge>}
              </Group>

              <Title order={2} size="h1" c={isAtualPago ? 'green.7' : 'var(--app-text)'} mt="xs">
                {formatMoeda(pagamentoAtual.valor)}
              </Title>

              <Text size="sm" c="dimmed" mt="xs">
                {isAtualPago
                  ? `Pagamento confirmado em ${formatData(pagamentoAtual.data_pagamento)}. Muito obrigado pela sua contribuição!`
                  : `Vencimento: ${formatData(pagamentoAtual.ciclo?.data_vencimento)}. Por favor, realize o pagamento até a data limite.`}
              </Text>
            </Grid.Col>

            {/* Informações de PIX caso pendente */}
            {!isAtualPago && !isAtualIsento && config?.chave_pix && (
              <Grid.Col span={{ base: 12, md: 5 }}>
                <Paper withBorder p="md" radius="md" bg="var(--mantine-color-ibce-0)" style={{ borderColor: 'var(--mantine-color-ibce-3)' }}>
                  <Group justify="space-between" mb="xs">
                    <Text fw={700} size="sm" c="ibce.9">Pague via PIX</Text>
                    <Badge size="xs" variant="light" color="ibce">{config.tipo_chave_pix?.toUpperCase() || 'PIX'}</Badge>
                  </Group>

                  <Box p="xs" bg="var(--app-surface)" style={{ borderRadius: 6, border: '1px solid var(--app-border)' }} mb="xs">
                    <Text size="xs" c="dimmed">Chave PIX:</Text>
                    <Text fw={650} size="sm" style={{ wordBreak: 'break-all' }}>{config.chave_pix}</Text>
                    {config.beneficiario_pix && (
                      <Text size="xs" c="dimmed" mt={4}>Beneficiário: {config.beneficiario_pix}</Text>
                    )}
                  </Box>

                  <Button
                    fullWidth
                    color="ibce"
                    size="sm"
                    leftSection={<IconCopy size={16} />}
                    onClick={copiarPix}
                  >
                    Copiar Chave PIX
                  </Button>
                </Paper>
              </Grid.Col>
            )}
          </Grid>
        </Card>
      ) : (
        <Paper withBorder p="xl" radius="md" ta="center">
          <ThemeIcon size={56} radius="xl" color="ibce" variant="light" mx="auto">
            <IconShieldCheck size={28} />
          </ThemeIcon>
          <Title order={3} mt="md">Nenhuma mensalidade lançada</Title>
          <Text c="dimmed" mt="xs">Quando a liderança ou tesoureiro abrir um novo ciclo, ele aparecerá aqui.</Text>
        </Paper>
      )}

      {/* Histórico de Mensalidades */}
      <Card withBorder padding="lg" radius="md" bg="var(--app-surface)">
        <Group gap="xs" mb="md">
          <ThemeIcon color="ibce" variant="light"><IconHistory size={18} /></ThemeIcon>
          <Title order={3} size="h4">Histórico de Contribuições</Title>
        </Group>

        {historico.length === 0 ? (
          <Text c="dimmed" size="sm">Nenhum registro no seu histórico.</Text>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <Table verticalSpacing="sm" horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Mês de Referência</Table.Th>
                  <Table.Th>Valor</Table.Th>
                  <Table.Th>Vencimento</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Data do Pagamento</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {historico.map((item) => (
                  <Table.Tr key={item.id}>
                    <Table.Td>
                      <Text fw={600} size="sm">
                        {item.ciclo ? `${mesesNomes[item.ciclo.mes - 1]} de ${item.ciclo.ano}` : '—'}
                      </Text>
                    </Table.Td>
                    <Table.Td><Text size="sm">{formatMoeda(item.valor)}</Text></Table.Td>
                    <Table.Td><Text size="sm">{formatData(item.ciclo?.data_vencimento)}</Text></Table.Td>
                    <Table.Td>
                      {item.status === 'pago' && <Badge color="green" variant="light">Pago</Badge>}
                      {item.status === 'pendente' && <Badge color="orange" variant="light">Pendente</Badge>}
                      {item.status === 'isento' && <Badge color="blue" variant="light">Isento</Badge>}
                    </Table.Td>
                    <Table.Td><Text size="sm">{formatData(item.data_pagamento)}</Text></Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        )}
      </Card>
    </Stack>
  )
}
