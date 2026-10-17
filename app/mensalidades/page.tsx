'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Alert, Badge, Box, Button, Card, Divider, Grid, Group, Paper,
  SimpleGrid, Skeleton, Stack, Table, Tabs, Text, ThemeIcon, Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconAlertCircle, IconArrowDownRight, IconArrowRight, IconArrowUpRight,
  IconBuildingBank, IconCalendar, IconCheck, IconCoin,
  IconCopy, IconCreditCard, IconHistory, IconInfoCircle,
  IconReceipt, IconShieldCheck, IconWallet, IconX,
} from '@tabler/icons-react'
import { CicloMensalidade, Configuracao, MovimentacaoComUsuario, PagamentoMensalidade } from '@/types'

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
  const [activeTab, setActiveTab] = useState<string | null>('minha')

  // Livro Caixa / Transparência
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoComUsuario[]>([])
  const [resumoCaixa, setResumoCaixa] = useState({
    total_mensalidades_arrecadadas: 0,
    total_outras_entradas: 0,
    total_geral_entradas: 0,
    total_saidas: 0,
    saldo_em_caixa: 0,
  })

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [resConfig, resPags, resMov] = await Promise.all([
          fetch('/api/configuracoes'),
          fetch('/api/mensalidades/pagamentos'),
          fetch('/api/mensalidades/movimentacoes'),
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

        if (resMov.ok) {
          const dataMov = await resMov.json()
          setMovimentacoes(dataMov.movimentacoes || [])
          if (dataMov.resumo) {
            setResumoCaixa(dataMov.resumo)
          }
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
        message: 'Chave copiada para a área de transferência.',
        icon: <IconCopy size={18} />,
      })
    } catch {
      notifications.show({ color: 'red', title: 'Erro', message: 'Não foi possível copiar.' })
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
          O módulo de mensalidade não está ativado no momento.
        </Text>
      </Paper>
    )
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <div>
          <Title order={1}>Mensalidades</Title>
          <Text c="dimmed">Contribuição mensal e prestação de contas.</Text>
        </div>

        {canManage && (
          <Button component={Link} href="/admin/mensalidades" variant="light" leftSection={<IconWallet size={18} />}>
            Painel da Tesouraria
          </Button>
        )}
      </Group>

      {/* Abas: Minha Contribuição vs Transparência */}
      <Tabs value={activeTab} onChange={setActiveTab} variant="outline" radius="md">
        <Tabs.List mb="md">
          <Tabs.Tab value="minha" leftSection={<IconWallet size={18} />}>
            Minha Contribuição
          </Tabs.Tab>
          <Tabs.Tab value="transparencia" leftSection={<IconReceipt size={18} />}>
            Transparência
          </Tabs.Tab>
        </Tabs.List>

        {/* ABA 1: MINHA CONTRIBUIÇÃO */}
        <Tabs.Panel value="minha">
          <Stack gap="lg">
            {/* Card Principal do Mês Vigente */}
            {pagamentoAtual ? (
              <Card withBorder padding="lg" radius="md" bg="var(--app-surface)">
                <Grid gutter="lg" align="center">
                  <Grid.Col span={{ base: 12, md: 7 }}>
                    <Group gap="xs" mb="xs">
                      <Badge size="lg" color="ibce" variant="light">
                        {pagamentoAtual.ciclo ? `${mesesNomes[pagamentoAtual.ciclo.mes - 1]} de ${pagamentoAtual.ciclo.ano}` : 'Mês Atual'}
                      </Badge>
                      {isAtualPago && <Badge color="green" size="lg" variant="filled" leftSection={<IconCheck size={14} />}>Pago</Badge>}
                      {isAtualIsento && <Badge color="blue" size="lg" variant="filled">Isento</Badge>}
                      {!isAtualPago && !isAtualIsento && <Badge color="orange" size="lg" variant="filled">Pendente</Badge>}
                    </Group>

                    <Title order={2} size="h1" c={isAtualPago ? 'green.7' : 'var(--app-text)'} mt="xs">
                      {formatMoeda(pagamentoAtual.valor)}
                    </Title>

                    <Text size="sm" c="dimmed" mt="xs">
                      {isAtualPago
                        ? `Confirmado em ${formatData(pagamentoAtual.data_pagamento)}.`
                        : `Vencimento: ${formatData(pagamentoAtual.ciclo?.data_vencimento)}.`}
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
                          <Text size="xs" c="dimmed">Chave:</Text>
                          <Text fw={650} size="sm" style={{ wordBreak: 'break-all' }}>{config.chave_pix}</Text>
                          {config.beneficiario_pix && (
                            <Text size="xs" c="dimmed" mt={4}>Titular: {config.beneficiario_pix}</Text>
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
                <Title order={3} mt="md">Nenhuma mensalidade em aberto</Title>
                <Text c="dimmed" mt="xs">Tudo em dia por aqui.</Text>
              </Paper>
            )}

            {/* Histórico de Mensalidades Pessoais */}
            <Card withBorder padding="lg" radius="md" bg="var(--app-surface)">
              <Group gap="xs" mb="md">
                <ThemeIcon color="ibce" variant="light"><IconHistory size={18} /></ThemeIcon>
                <Title order={3} size="h4">Histórico</Title>
              </Group>

              {historico.length === 0 ? (
                <Text c="dimmed" size="sm">Nenhum registro encontrado.</Text>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <Table verticalSpacing="sm" horizontalSpacing="md">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Mês</Table.Th>
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
        </Tabs.Panel>

        {/* ABA 2: TRANSPARÊNCIA */}
        <Tabs.Panel value="transparencia">
          <Stack gap="lg">
            {/* Cards de Resumo */}
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
              <Paper
                withBorder
                p="md"
                radius="md"
                style={{
                  borderColor: resumoCaixa.saldo_em_caixa >= 0 ? 'var(--mantine-color-green-4)' : 'var(--mantine-color-red-4)',
                  background: resumoCaixa.saldo_em_caixa >= 0 ? 'rgba(46, 204, 113, 0.05)' : 'rgba(231, 76, 60, 0.05)',
                }}
              >
                <Group justify="space-between">
                  <Text size="xs" c="dimmed" fw={700}>SALDO EM CAIXA</Text>
                  <ThemeIcon color={resumoCaixa.saldo_em_caixa >= 0 ? 'green' : 'red'} variant="light" size="lg">
                    <IconBuildingBank size={20} />
                  </ThemeIcon>
                </Group>
                <Text size="xl" fw={800} c={resumoCaixa.saldo_em_caixa >= 0 ? 'green.7' : 'red.7'} mt="xs">
                  {formatMoeda(resumoCaixa.saldo_em_caixa)}
                </Text>
                <Text size="xs" c="dimmed" mt={4}>Disponível</Text>
              </Paper>

              <Paper withBorder p="md" radius="md">
                <Group justify="space-between">
                  <Text size="xs" c="dimmed" fw={700}>MENSALIDADES</Text>
                  <ThemeIcon color="blue" variant="light" size="lg"><IconCoin size={20} /></ThemeIcon>
                </Group>
                <Text size="xl" fw={700} c="blue.7" mt="xs">
                  {formatMoeda(resumoCaixa.total_mensalidades_arrecadadas)}
                </Text>
                <Text size="xs" c="dimmed" mt={4}>Total arrecadado</Text>
              </Paper>

              <Paper withBorder p="md" radius="md">
                <Group justify="space-between">
                  <Text size="xs" c="dimmed" fw={700}>OUTRAS ENTRADAS</Text>
                  <ThemeIcon color="teal" variant="light" size="lg"><IconArrowDownRight size={20} /></ThemeIcon>
                </Group>
                <Text size="xl" fw={700} c="teal.7" mt="xs">
                  {formatMoeda(resumoCaixa.total_outras_entradas)}
                </Text>
                <Text size="xs" c="dimmed" mt={4}>Receitas extras</Text>
              </Paper>

              <Paper withBorder p="md" radius="md">
                <Group justify="space-between">
                  <Text size="xs" c="dimmed" fw={700}>DESPESAS</Text>
                  <ThemeIcon color="red" variant="light" size="lg"><IconArrowUpRight size={20} /></ThemeIcon>
                </Group>
                <Text size="xl" fw={700} c="red.7" mt="xs">
                  {formatMoeda(resumoCaixa.total_saidas)}
                </Text>
                <Text size="xs" c="dimmed" mt={4}>Total de saídas</Text>
              </Paper>
            </SimpleGrid>

            {/* Lista de Movimentações */}
            <Card withBorder padding="lg" radius="md" bg="var(--app-surface)">
              <Group justify="space-between" mb="md" wrap="wrap">
                <Title order={3} size="h4">Movimentações Recentes</Title>
                <Badge color="ibce" variant="light">
                  {movimentacoes.length} lançamentos
                </Badge>
              </Group>

              {movimentacoes.length === 0 ? (
                <Paper p="xl" ta="center">
                  <ThemeIcon size={48} radius="xl" color="gray" variant="light" mx="auto">
                    <IconReceipt size={24} />
                  </ThemeIcon>
                  <Text c="dimmed" mt="xs" size="sm">Nenhuma movimentação registrada.</Text>
                </Paper>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <Table verticalSpacing="sm" horizontalSpacing="md">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Tipo</Table.Th>
                        <Table.Th>Categoria</Table.Th>
                        <Table.Th>Descrição</Table.Th>
                        <Table.Th>Data</Table.Th>
                        <Table.Th ta="right">Valor</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {movimentacoes.map((mov) => {
                        const isEntrada = mov.tipo === 'entrada'
                        return (
                          <Table.Tr key={mov.id}>
                            <Table.Td>
                              {isEntrada ? (
                                <Badge color="teal" variant="light" leftSection={<IconArrowDownRight size={12} />}>
                                  Entrada
                                </Badge>
                              ) : (
                                <Badge color="red" variant="light" leftSection={<IconArrowUpRight size={12} />}>
                                  Saída
                                </Badge>
                              )}
                            </Table.Td>

                            <Table.Td>
                              <Badge variant="outline" color="gray">
                                {mov.categoria}
                              </Badge>
                            </Table.Td>

                            <Table.Td>
                              <Text size="sm" fw={600}>{mov.descricao}</Text>
                              {mov.observacao && <Text size="xs" c="dimmed">{mov.observacao}</Text>}
                            </Table.Td>

                            <Table.Td>
                              <Text size="sm">{formatData(mov.data)}</Text>
                            </Table.Td>

                            <Table.Td ta="right">
                              <Text size="sm" fw={700} c={isEntrada ? 'teal.7' : 'red.7'}>
                                {isEntrada ? `+ ${formatMoeda(mov.valor)}` : `- ${formatMoeda(mov.valor)}`}
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        )
                      })}
                    </Table.Tbody>
                  </Table>
                </div>
              )}
            </Card>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
