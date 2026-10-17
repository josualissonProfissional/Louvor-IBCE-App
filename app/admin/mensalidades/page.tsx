'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Alert, Avatar, Badge, Button, Card, Divider, Grid, Group,
  Modal, NumberInput, Paper, Select, SimpleGrid, Skeleton,
  Stack, Switch, Table, Tabs, Text, TextInput, ThemeIcon, Title, Tooltip,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import {
  IconAlertCircle, IconArrowLeft, IconCheck, IconCoin, IconCreditCard,
  IconDotsVertical, IconEdit, IconInfoCircle, IconPlus, IconRefresh,
  IconSearch, IconSettings, IconUserCheck, IconUsers, IconWallet, IconX,
} from '@tabler/icons-react'
import { Usuario } from '@/types'

interface CicloMetrica {
  id: string
  mes_referencia: string
  ano: number
  mes: number
  valor: number
  data_vencimento: string
  total_membros: number
  total_pagos: number
  total_pendentes: number
  total_isentos: number
  valor_arrecadado: number
  valor_pendente: number
}

interface PagamentoItem {
  id: string
  ciclo_id: string
  usuario_id: string
  valor: number
  status: 'pendente' | 'pago' | 'isento'
  data_pagamento: string | null
  confirmado_por: string | null
  observacao: string | null
  usuario: {
    id: string
    nome: string | null
    email: string
    cargo: string
    instrumento?: { nome: string } | null
  }
  confirmador?: {
    id: string
    nome: string | null
    email: string
  } | null
}

const mesesNomes = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export default function AdminMensalidadesPage() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [ciclos, setCiclos] = useState<CicloMetrica[]>([])
  const [selectedCicloId, setSelectedCicloId] = useState<string | null>(null)
  const [pagamentos, setPagamentos] = useState<PagamentoItem[]>([])
  const [loadingPagamentos, setLoadingPagamentos] = useState(false)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroBusca, setFiltroBusca] = useState<string>('')

  // Configurações gerais
  const [config, setConfig] = useState({
    modulo_mensalidade_ativo: false,
    chave_pix: '',
    tipo_chave_pix: 'aleatoria',
    beneficiario_pix: '',
    valor_mensalidade_padrao: 20.0,
    dia_vencimento_padrao: 10,
    tesoureiro_id: '',
  })
  const [salvandoConfig, setSalvandoConfig] = useState(false)
  const [configOpened, setConfigOpened] = useState(false)

  // Modal Novo Ciclo
  const [novoCicloOpened, setNovoCicloOpened] = useState(false)
  const [criandoCiclo, setCriandoCiclo] = useState(false)
  const [formNovoCiclo, setFormNovoCiclo] = useState({
    ano: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    valor: 20.0,
    data_vencimento: '',
  })

  // Carrega configurações e ciclos
  const loadInicial = useCallback(async () => {
    try {
      setLoading(true)
      const [resConfig, resCiclos, resUsers] = await Promise.all([
        fetch('/api/configuracoes'),
        fetch('/api/mensalidades/ciclos'),
        fetch('/api/usuarios'),
      ])

      if (resConfig.ok) {
        const dataConf = await resConfig.json()
        setIsAdmin(Boolean(dataConf.isAdmin))
        setConfig({
          modulo_mensalidade_ativo: Boolean(dataConf.configuracao?.modulo_mensalidade_ativo),
          chave_pix: dataConf.configuracao?.chave_pix || '',
          tipo_chave_pix: dataConf.configuracao?.tipo_chave_pix || 'aleatoria',
          beneficiario_pix: dataConf.configuracao?.beneficiario_pix || '',
          valor_mensalidade_padrao: Number(dataConf.configuracao?.valor_mensalidade_padrao) || 20.0,
          dia_vencimento_padrao: Number(dataConf.configuracao?.dia_vencimento_padrao) || 10,
          tesoureiro_id: dataConf.tesoureiro?.id || '',
        })
      }

      if (resCiclos.ok) {
        const dataCiclos: CicloMetrica[] = await resCiclos.json()
        setCiclos(dataCiclos)
        if (dataCiclos.length > 0 && !selectedCicloId) {
          setSelectedCicloId(dataCiclos[0].id)
        }
      }

      if (resUsers.ok) {
        const dataUsers = await resUsers.json()
        setUsuarios(dataUsers)
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      notifications.show({ color: 'red', title: 'Erro', message: 'Não foi possível carregar as informações' })
    } finally {
      setLoading(false)
    }
  }, [selectedCicloId])

  useEffect(() => {
    loadInicial()
  }, [loadInicial])

  // Carrega pagamentos do ciclo selecionado
  const loadPagamentosDoCiclo = useCallback(async (cicloId: string) => {
    try {
      setLoadingPagamentos(true)
      const res = await fetch(`/api/mensalidades/pagamentos?ciclo_id=${cicloId}`)
      if (res.ok) {
        const data = await res.json()
        setPagamentos(data)
      }
    } catch (err) {
      console.error('Erro ao buscar pagamentos:', err)
    } finally {
      setLoadingPagamentos(false)
    }
  }, [])

  useEffect(() => {
    if (selectedCicloId) {
      loadPagamentosDoCiclo(selectedCicloId)
    }
  }, [selectedCicloId, loadPagamentosDoCiclo])

  // Salvar configurações gerais
  const salvarConfiguracoes = async (e: FormEvent) => {
    e.preventDefault()
    setSalvandoConfig(true)
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar configurações')

      notifications.show({
        color: 'green',
        title: 'Sucesso',
        message: 'Configurações de mensalidade atualizadas!',
        icon: <IconCheck size={18} />,
      })
      setConfigOpened(false)
      await loadInicial()
    } catch (err: any) {
      notifications.show({ color: 'red', title: 'Erro', message: err.message || 'Tente novamente.' })
    } finally {
      setSalvandoConfig(false)
    }
  }

  // Criar novo ciclo
  const criarCiclo = async (e: FormEvent) => {
    e.preventDefault()
    setCriandoCiclo(true)
    try {
      const res = await fetch('/api/mensalidades/ciclos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formNovoCiclo),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar mensalidade')

      notifications.show({
        color: 'green',
        title: 'Ciclo criado com sucesso!',
        message: 'Os membros foram notificados e as pendências geradas.',
        icon: <IconCheck size={18} />,
      })

      setNovoCicloOpened(false)
      await loadInicial()
      if (data.id) setSelectedCicloId(data.id)
    } catch (err: any) {
      notifications.show({ color: 'red', title: 'Erro', message: err.message || 'Tente novamente.' })
    } finally {
      setCriandoCiclo(false)
    }
  }

  // Alterar status de pagamento (ex: marcar como pago)
  const alterarStatusPagamento = async (
    pagamentoId: string,
    novoStatus: 'pago' | 'pendente' | 'isento',
    membroNome: string
  ) => {
    try {
      const res = await fetch('/api/mensalidades/pagamentos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pagamentoId, status: novoStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao alterar status')

      notifications.show({
        color: novoStatus === 'pago' ? 'green' : novoStatus === 'isento' ? 'blue' : 'orange',
        title: novoStatus === 'pago' ? 'Pagamento Confirmado! ✅' : 'Status Alterado',
        message: `${membroNome} agora está como "${novoStatus}".`,
      })

      // Recarrega pagamentos e métricas
      if (selectedCicloId) {
        await loadPagamentosDoCiclo(selectedCicloId)
        const resCiclos = await fetch('/api/mensalidades/ciclos')
        if (resCiclos.ok) setCiclos(await resCiclos.json())
      }
    } catch (err: any) {
      notifications.show({ color: 'red', title: 'Erro', message: err.message || 'Tente novamente.' })
    }
  }

  const cicloAtual = ciclos.find((c) => c.id === selectedCicloId)

  // Pagamentos filtrados
  const pagamentosFiltrados = pagamentos.filter((p) => {
    const term = filtroBusca.trim().toLowerCase()
    const matchesBusca =
      !term ||
      (p.usuario?.nome || '').toLowerCase().includes(term) ||
      p.usuario?.email.toLowerCase().includes(term)

    const matchesStatus = filtroStatus === 'todos' || p.status === filtroStatus
    return matchesBusca && matchesStatus
  })

  // Formatadores
  const formatMoeda = (val: number) =>
    Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const formatData = (val?: string | null) => {
    if (!val) return '—'
    const [y, m, d] = val.split('T')[0].split('-')
    return `${d}/${m}/${y}`
  }

  const taxaAdimplencia = cicloAtual && cicloAtual.total_membros > 0
    ? Math.round((cicloAtual.total_pagos / (cicloAtual.total_membros - cicloAtual.total_isentos || 1)) * 100)
    : 0

  return (
    <Stack gap="lg">
      {/* Cabeçalho */}
      <Group justify="space-between" align="flex-start">
        <div>
          <Button component={Link} href="/admin" variant="subtle" px={0} leftSection={<IconArrowLeft size={17} />}>
            Voltar para Administração
          </Button>
          <Title order={1}>Tesouraria & Mensalidades</Title>
          <Text c="dimmed">Controle de arrecadação, vencimentos e baixa de pagamentos dos integrantes.</Text>
        </div>

        <Group>
          {isAdmin && (
            <Button
              variant="light"
              color="gray"
              leftSection={<IconSettings size={18} />}
              onClick={() => setConfigOpened(true)}
            >
              Configurar Módulo
            </Button>
          )}

          <Button
            leftSection={<IconPlus size={18} />}
            onClick={() => {
              const hoje = new Date()
              const ano = hoje.getFullYear()
              const mes = hoje.getMonth() + 1
              const diaVenc = config.dia_vencimento_padrao || 10
              const dataVenc = `${ano}-${String(mes).padStart(2, '0')}-${String(diaVenc).padStart(2, '0')}`
              setFormNovoCiclo({
                ano,
                mes,
                valor: config.valor_mensalidade_padrao || 20.0,
                data_vencimento: dataVenc,
              })
              setNovoCicloOpened(true)
            }}
          >
            Novo Mês de Mensalidade
          </Button>
        </Group>
      </Group>

      {/* Alerta se módulo estiver desligado */}
      {!loading && !config.modulo_mensalidade_ativo && (
        <Alert
          color="orange"
          icon={<IconAlertCircle size={20} />}
          title="Módulo de Mensalidade está Desativado"
        >
          O módulo está desativado para os integrantes no momento. Para ativá-lo na barra lateral de todos os membros,
          clique em <strong>Configurar Módulo</strong> e ative o botão correspondente.
        </Alert>
      )}

      {loading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} h={110} radius="md" />)}
        </SimpleGrid>
      ) : ciclos.length === 0 ? (
        <Paper withBorder p="xl" radius="md" ta="center">
          <ThemeIcon size={64} radius="xl" color="ibce" variant="light" mx="auto">
            <IconWallet size={32} />
          </ThemeIcon>
          <Title order={3} mt="md">Nenhum mês de mensalidade criado ainda</Title>
          <Text c="dimmed" mt="xs" maw={520} mx="auto">
            Clique no botão <strong>Novo Mês de Mensalidade</strong> acima para criar o primeiro mês de contribuição.
            Todos os integrantes receberão automaticamente a notificação com prazo e valor.
          </Text>
        </Paper>
      ) : (
        <>
          {/* Seletor de Ciclos */}
          <Paper withBorder p="sm" radius="md">
            <Group justify="space-between" wrap="nowrap">
              <Group gap="xs">
                <Text fw={700} size="sm">Mês de Referência:</Text>
                <Select
                  value={selectedCicloId}
                  onChange={(val) => val && setSelectedCicloId(val)}
                  allowDeselect={false}
                  data={ciclos.map((c) => ({
                    value: c.id,
                    label: `${mesesNomes[c.mes - 1]} de ${c.ano} (Vence em ${formatData(c.data_vencimento)})`,
                  }))}
                  style={{ minWidth: 260 }}
                />
              </Group>

              {cicloAtual && (
                <Badge color="ibce" variant="light" size="lg">
                  Valor: {formatMoeda(cicloAtual.valor)} / membro
                </Badge>
              )}
            </Group>
          </Paper>

          {/* Cards de Métricas */}
          {cicloAtual && (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
              <Paper withBorder p="md" radius="md">
                <Group justify="space-between">
                  <Text size="xs" c="dimmed" fw={700}>ARRECADADO</Text>
                  <ThemeIcon color="green" variant="light"><IconCoin size={18} /></ThemeIcon>
                </Group>
                <Text size="xl" fw={700} c="green.7" mt="xs">{formatMoeda(cicloAtual.valor_arrecadado)}</Text>
                <Text size="xs" c="dimmed" mt={4}>{cicloAtual.total_pagos} pagamentos confirmados</Text>
              </Paper>

              <Paper withBorder p="md" radius="md">
                <Group justify="space-between">
                  <Text size="xs" c="dimmed" fw={700}>PENDENTE</Text>
                  <ThemeIcon color="orange" variant="light"><IconWallet size={18} /></ThemeIcon>
                </Group>
                <Text size="xl" fw={700} c="orange.7" mt="xs">{formatMoeda(cicloAtual.valor_pendente)}</Text>
                <Text size="xs" c="dimmed" mt={4}>{cicloAtual.total_pendentes} membros em aberto</Text>
              </Paper>

              <Paper withBorder p="md" radius="md">
                <Group justify="space-between">
                  <Text size="xs" c="dimmed" fw={700}>ADIMPLÊNCIA</Text>
                  <ThemeIcon color="ibce" variant="light"><IconUserCheck size={18} /></ThemeIcon>
                </Group>
                <Text size="xl" fw={700} mt="xs">{taxaAdimplencia}%</Text>
                <Text size="xs" c="dimmed" mt={4}>
                  {cicloAtual.total_pagos} de {cicloAtual.total_membros - cicloAtual.total_isentos} pagantes
                </Text>
              </Paper>

              <Paper withBorder p="md" radius="md">
                <Group justify="space-between">
                  <Text size="xs" c="dimmed" fw={700}>PRAZO DE VENCIMENTO</Text>
                  <ThemeIcon color="blue" variant="light"><IconCreditCard size={18} /></ThemeIcon>
                </Group>
                <Text size="xl" fw={700} mt="xs">{formatData(cicloAtual.data_vencimento)}</Text>
                <Text size="xs" c="dimmed" mt={4}>Data limite estipulada</Text>
              </Paper>
            </SimpleGrid>
          )}

          {/* Tabela de Membros do Ciclo */}
          <Paper withBorder radius="md" p="md">
            <Group justify="space-between" mb="md" wrap="wrap">
              <Group gap="sm">
                <TextInput
                  placeholder="Buscar integrante por nome ou e-mail..."
                  leftSection={<IconSearch size={16} />}
                  value={filtroBusca}
                  onChange={(e) => setFiltroBusca(e.currentTarget.value)}
                  style={{ width: 280 }}
                />
                <Select
                  value={filtroStatus}
                  onChange={(val) => setFiltroStatus(val || 'todos')}
                  data={[
                    { value: 'todos', label: 'Todos os status' },
                    { value: 'pendente', label: 'Apenas Pendentes' },
                    { value: 'pago', label: 'Apenas Pagos' },
                    { value: 'isento', label: 'Apenas Isentos' },
                  ]}
                  style={{ width: 180 }}
                />
              </Group>

              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconRefresh size={14} />}
                onClick={() => selectedCicloId && loadPagamentosDoCiclo(selectedCicloId)}
              >
                Atualizar lista
              </Button>
            </Group>

            {loadingPagamentos ? (
              <Stack>{[1, 2, 3].map((i) => <Skeleton key={i} h={54} radius="sm" />)}</Stack>
            ) : pagamentosFiltrados.length === 0 ? (
              <Text ta="center" c="dimmed" py="xl">Nenhum integrante encontrado com os filtros selecionados.</Text>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Integrante</Table.Th>
                      <Table.Th>Função</Table.Th>
                      <Table.Th>Valor</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Data do Pagamento</Table.Th>
                      <Table.Th ta="right">Ações do Tesoureiro/Líder</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pagamentosFiltrados.map((p) => {
                      const isPago = p.status === 'pago'
                      const isPendente = p.status === 'pendente'
                      const isIsento = p.status === 'isento'

                      return (
                        <Table.Tr key={p.id}>
                          <Table.Td>
                            <Group gap="sm" wrap="nowrap">
                              <Avatar color="ibce" radius="xl">
                                {(p.usuario?.nome || p.usuario?.email || 'M').slice(0, 2).toUpperCase()}
                              </Avatar>
                              <div>
                                <Text size="sm" fw={600}>{p.usuario?.nome || 'Sem nome'}</Text>
                                <Text size="xs" c="dimmed">{p.usuario?.email}</Text>
                              </div>
                            </Group>
                          </Table.Td>

                          <Table.Td>
                            <Text size="sm" tt="capitalize">{p.usuario?.cargo || 'Membro'}</Text>
                            {p.usuario?.instrumento && (
                              <Text size="xs" c="dimmed">{p.usuario.instrumento.nome}</Text>
                            )}
                          </Table.Td>

                          <Table.Td>
                            <Text size="sm" fw={600}>{formatMoeda(p.valor)}</Text>
                          </Table.Td>

                          <Table.Td>
                            {isPago && <Badge color="green" variant="light" leftSection={<IconCheck size={12} />}>Pago</Badge>}
                            {isPendente && <Badge color="orange" variant="light">Pendente</Badge>}
                            {isIsento && <Badge color="blue" variant="light">Isento</Badge>}
                          </Table.Td>

                          <Table.Td>
                            <Text size="sm">{formatData(p.data_pagamento)}</Text>
                            {p.confirmador && (
                              <Text size="xs" c="dimmed">por {p.confirmador.nome || p.confirmador.email}</Text>
                            )}
                          </Table.Td>

                          <Table.Td ta="right">
                            <Group justify="flex-end" gap="xs">
                              {isPendente && (
                                <Button
                                  size="xs"
                                  color="green"
                                  leftSection={<IconCheck size={14} />}
                                  onClick={() =>
                                    alterarStatusPagamento(p.id, 'pago', p.usuario?.nome || p.usuario?.email)
                                  }
                                >
                                  Dar Baixa (Pago)
                                </Button>
                              )}

                              {isPago && (
                                <Button
                                  size="xs"
                                  variant="subtle"
                                  color="orange"
                                  onClick={() =>
                                    alterarStatusPagamento(p.id, 'pendente', p.usuario?.nome || p.usuario?.email)
                                  }
                                >
                                  Desfazer Pago
                                </Button>
                              )}

                              {!isIsento ? (
                                <Button
                                  size="xs"
                                  variant="subtle"
                                  color="gray"
                                  onClick={() =>
                                    alterarStatusPagamento(p.id, 'isento', p.usuario?.nome || p.usuario?.email)
                                  }
                                >
                                  Isentar
                                </Button>
                              ) : (
                                <Button
                                  size="xs"
                                  variant="subtle"
                                  color="orange"
                                  onClick={() =>
                                    alterarStatusPagamento(p.id, 'pendente', p.usuario?.nome || p.usuario?.email)
                                  }
                                >
                                  Remover Isenção
                                </Button>
                              )}
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      )
                    })}
                  </Table.Tbody>
                </Table>
              </div>
            )}
          </Paper>
        </>
      )}

      {/* Modal Novo Ciclo */}
      <Modal
        opened={novoCicloOpened}
        onClose={() => setNovoCicloOpened(false)}
        title="Criar Novo Mês de Mensalidade"
        centered
        size="md"
      >
        <form onSubmit={criarCiclo}>
          <Stack>
            <SimpleGrid cols={2}>
              <Select
                label="Mês de Referência"
                required
                value={String(formNovoCiclo.mes)}
                onChange={(val) => setFormNovoCiclo({ ...formNovoCiclo, mes: Number(val) })}
                data={mesesNomes.map((nome, idx) => ({ value: String(idx + 1), label: nome }))}
              />
              <NumberInput
                label="Ano"
                required
                min={2020}
                max={2035}
                value={formNovoCiclo.ano}
                onChange={(val) => setFormNovoCiclo({ ...formNovoCiclo, ano: Number(val) || 2026 })}
              />
            </SimpleGrid>

            <NumberInput
              label="Valor da Mensalidade (R$)"
              required
              min={1}
              decimalScale={2}
              prefix="R$ "
              value={formNovoCiclo.valor}
              onChange={(val) => setFormNovoCiclo({ ...formNovoCiclo, valor: Number(val) || 20.0 })}
            />

            <TextInput
              label="Data de Vencimento (Prazo)"
              type="date"
              required
              value={formNovoCiclo.data_vencimento}
              onChange={(e) => setFormNovoCiclo({ ...formNovoCiclo, data_vencimento: e.currentTarget.value })}
            />

            <Alert color="blue" icon={<IconInfoCircle size={18} />}>
              Ao confirmar, registros pendentes serão gerados para todos os integrantes e uma notificação com o prazo e valor será enviada automaticamente.
            </Alert>

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setNovoCicloOpened(false)}>Cancelar</Button>
              <Button type="submit" loading={criandoCiclo}>Criar Mensalidade</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal Configurações do Módulo (Líder apenas) */}
      <Modal
        opened={configOpened}
        onClose={() => setConfigOpened(false)}
        title="Configurações do Módulo de Mensalidade"
        centered
        size="lg"
      >
        <form onSubmit={salvarConfiguracoes}>
          <Stack>
            <Switch
              label="Ativar Módulo de Mensalidade"
              description="Quando ativo, o menu 'Minha Mensalidade' fica visível para todos os integrantes."
              size="md"
              checked={config.modulo_mensalidade_ativo}
              onChange={(e) => setConfig({ ...config, modulo_mensalidade_ativo: e.currentTarget.checked })}
            />

            <Divider my="xs" />

            <Select
              label="Tesoureiro Responsável"
              description="O tesoureiro tem permissão total para gerenciar as mensalidades e confirmar pagamentos."
              placeholder="Selecione um integrante"
              clearable
              value={config.tesoureiro_id}
              onChange={(val) => setConfig({ ...config, tesoureiro_id: val || '' })}
              data={usuarios.map((u) => ({
                value: u.id,
                label: `${u.nome || u.email}${u.lider ? ' (Líder)' : ''}`,
              }))}
            />

            <SimpleGrid cols={2}>
              <NumberInput
                label="Valor Padrão (R$)"
                prefix="R$ "
                decimalScale={2}
                min={0}
                value={config.valor_mensalidade_padrao}
                onChange={(val) => setConfig({ ...config, valor_mensalidade_padrao: Number(val) || 20 })}
              />

              <NumberInput
                label="Dia de Vencimento Padrão"
                description="Ex: dia 10 de cada mês"
                min={1}
                max={31}
                value={config.dia_vencimento_padrao}
                onChange={(val) => setConfig({ ...config, dia_vencimento_padrao: Number(val) || 10 })}
              />
            </SimpleGrid>

            <Divider my="xs" label="Dados para Pagamento via PIX" labelPosition="center" />

            <SimpleGrid cols={2}>
              <Select
                label="Tipo de Chave PIX"
                value={config.tipo_chave_pix}
                onChange={(val) => setConfig({ ...config, tipo_chave_pix: val || 'aleatoria' })}
                data={[
                  { value: 'cpf', label: 'CPF' },
                  { value: 'cnpj', label: 'CNPJ' },
                  { value: 'email', label: 'E-mail' },
                  { value: 'celular', label: 'Celular' },
                  { value: 'aleatoria', label: 'Chave Aleatória' },
                ]}
              />
              <TextInput
                label="Chave PIX"
                placeholder="Ex: financeiro@ibce.com.br"
                value={config.chave_pix}
                onChange={(e) => setConfig({ ...config, chave_pix: e.currentTarget.value })}
              />
            </SimpleGrid>

            <TextInput
              label="Nome do Beneficiário (Titular da Conta)"
              placeholder="Ex: Igreja Batista Central..."
              value={config.beneficiario_pix}
              onChange={(e) => setConfig({ ...config, beneficiario_pix: e.currentTarget.value })}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setConfigOpened(false)}>Cancelar</Button>
              <Button type="submit" loading={salvandoConfig}>Salvar Configurações</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  )
}
