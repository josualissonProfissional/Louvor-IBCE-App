'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ActionIcon, Alert, Avatar, Badge, Button, Card, Divider, Grid, Group,
  Modal, NumberInput, Paper, SegmentedControl, Select, SimpleGrid, Skeleton,
  Stack, Switch, Table, Tabs, Text, TextInput, Textarea, ThemeIcon, Title, Tooltip,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import {
  IconAlertCircle, IconArrowDownRight, IconArrowLeft, IconArrowUpRight,
  IconBuildingBank, IconCheck, IconCoin, IconCreditCard, IconDotsVertical,
  IconEdit, IconInfoCircle, IconPlayerPause, IconPlus, IconReceipt,
  IconRefresh, IconRepeat, IconSearch, IconSettings, IconTrash,
  IconUserCheck, IconUsers, IconWallet, IconX,
} from '@tabler/icons-react'
import { MovimentacaoComUsuario, Usuario } from '@/types'

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

const categoriasEntrada = [
  'Venda de Lanche',
  'Cantina / Eventos',
  'Doação / Oferta',
  'Rifa / Ação entre Amigos',
  'Outros',
]

const categoriasSaida = [
  'Compra de Instrumento',
  'Acessórios / Cabos / Cordas',
  'Manutenção e Som',
  'Alimentação / Lanche de Ensaio',
  'Material Impresso / Pastas',
  'Outros',
]

export default function AdminMensalidadesPage() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<string | null>('caixa')

  // Dados de Ciclos e Pagamentos
  const [ciclos, setCiclos] = useState<CicloMetrica[]>([])
  const [selectedCicloId, setSelectedCicloId] = useState<string | null>(null)
  const [pagamentos, setPagamentos] = useState<PagamentoItem[]>([])
  const [loadingPagamentos, setLoadingPagamentos] = useState(false)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])

  // Filtros de Mensalidades
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroBusca, setFiltroBusca] = useState<string>('')

  // Livro Caixa (Movimentações)
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoComUsuario[]>([])
  const [loadingMovimentacoes, setLoadingMovimentacoes] = useState(false)
  const [filtroTipoMov, setFiltroTipoMov] = useState<'todas' | 'entrada' | 'saida'>('todas')
  const [filtroBuscaMov, setFiltroBuscaMov] = useState<string>('')
  const [resumoCaixa, setResumoCaixa] = useState({
    total_mensalidades_arrecadadas: 0,
    total_outras_entradas: 0,
    total_geral_entradas: 0,
    total_saidas: 0,
    saldo_em_caixa: 0,
  })

  // Modal Movimentação
  const [modalMovOpened, setModalMovOpened] = useState(false)
  const [salvandoMov, setSalvandoMov] = useState(false)
  const [editingMovId, setEditingMovId] = useState<string | null>(null)
  const [formMov, setFormMov] = useState({
    tipo: 'entrada' as 'entrada' | 'saida',
    categoria: 'Venda de Lanche',
    categoria_custom: '',
    descricao: '',
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    ciclo_id: '',
    observacao: '',
  })

  // Configurações gerais
  const [config, setConfig] = useState({
    modulo_mensalidade_ativo: false,
    cobranca_automatica: true,
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

  // Carrega movimentações e resumo geral do caixa
  const loadMovimentacoes = useCallback(async () => {
    try {
      setLoadingMovimentacoes(true)
      const params = new URLSearchParams()
      if (filtroTipoMov !== 'todas') params.append('tipo', filtroTipoMov)
      if (filtroBuscaMov.trim()) params.append('busca', filtroBuscaMov.trim())

      const res = await fetch(`/api/mensalidades/movimentacoes?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setMovimentacoes(data.movimentacoes || [])
        if (data.resumo) {
          setResumoCaixa(data.resumo)
        }
      }
    } catch (err) {
      console.error('Erro ao carregar movimentações:', err)
    } finally {
      setLoadingMovimentacoes(false)
    }
  }, [filtroTipoMov, filtroBuscaMov])

  // Carrega configurações, ciclos e usuários
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
          cobranca_automatica: dataConf.configuracao?.cobranca_automatica !== false,
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

      await loadMovimentacoes()
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      notifications.show({ color: 'red', title: 'Erro', message: 'Não foi possível carregar as informações' })
    } finally {
      setLoading(false)
    }
  }, [selectedCicloId, loadMovimentacoes])

  useEffect(() => {
    loadInicial()
  }, [loadInicial])

  // Recarrega movimentações quando o filtro muda
  useEffect(() => {
    loadMovimentacoes()
  }, [loadMovimentacoes])

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

  // Alternar cobrança automática rápida em 1 clique
  const alternarCobrancaAutomatica = async (novoValor: boolean) => {
    try {
      const novaConfig = { ...config, cobranca_automatica: novoValor }
      setConfig(novaConfig)
      const res = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaConfig),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao alterar cobrança automática')
      }
      notifications.show({
        color: novoValor ? 'teal' : 'gray',
        title: novoValor ? 'Cobrança Automática Ativada! ⚡' : 'Cobrança Automática Desativada',
        message: novoValor
          ? 'Assim que virar o mês, a mensalidade será gerada e lançada automaticamente para todos os integrantes.'
          : 'A geração automática foi pausada. Os novos meses precisarão ser gerados manualmente.',
        icon: <IconCheck size={18} />,
      })
      await loadInicial()
    } catch (err: any) {
      notifications.show({ color: 'red', title: 'Erro', message: err.message || 'Tente novamente.' })
      await loadInicial()
    }
  }

  // Criar novo ciclo manual
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

  // Alterar status de pagamento (dar baixa / isentar)
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

      // Recarrega pagamentos, métricas e o resumo do caixa
      if (selectedCicloId) {
        await loadPagamentosDoCiclo(selectedCicloId)
        const resCiclos = await fetch('/api/mensalidades/ciclos')
        if (resCiclos.ok) setCiclos(await resCiclos.json())
      }
      await loadMovimentacoes()
    } catch (err: any) {
      notifications.show({ color: 'red', title: 'Erro', message: err.message || 'Tente novamente.' })
    }
  }

  // Modal de Movimentação (Entrada/Saída)
  const abrirNovaMovimentacao = (tipoInicial: 'entrada' | 'saida' = 'entrada') => {
    setEditingMovId(null)
    setFormMov({
      tipo: tipoInicial,
      categoria: tipoInicial === 'entrada' ? 'Venda de Lanche' : 'Compra de Instrumento',
      categoria_custom: '',
      descricao: '',
      valor: 0,
      data: new Date().toISOString().split('T')[0],
      ciclo_id: selectedCicloId || '',
      observacao: '',
    })
    setModalMovOpened(true)
  }

  const abrirEditarMovimentacao = (mov: MovimentacaoComUsuario) => {
    setEditingMovId(mov.id)
    const categoriasBase = mov.tipo === 'entrada' ? categoriasEntrada : categoriasSaida
    const isCustom = !categoriasBase.includes(mov.categoria)
    setFormMov({
      tipo: mov.tipo,
      categoria: isCustom ? 'Outros' : mov.categoria,
      categoria_custom: isCustom ? mov.categoria : '',
      descricao: mov.descricao,
      valor: Number(mov.valor),
      data: mov.data,
      ciclo_id: mov.ciclo_id || '',
      observacao: mov.observacao || '',
    })
    setModalMovOpened(true)
  }

  const salvarMovimentacao = async (e: FormEvent) => {
    e.preventDefault()
    if (!formMov.descricao.trim()) {
      notifications.show({ color: 'red', title: 'Atenção', message: 'Informe a descrição da movimentação' })
      return
    }
    if (formMov.valor <= 0) {
      notifications.show({ color: 'red', title: 'Atenção', message: 'O valor deve ser maior que zero' })
      return
    }

    setSalvandoMov(true)
    try {
      const categoriaFinal =
        formMov.categoria === 'Outros' && formMov.categoria_custom.trim()
          ? formMov.categoria_custom.trim()
          : formMov.categoria

      const payload = {
        tipo: formMov.tipo,
        categoria: categoriaFinal,
        descricao: formMov.descricao.trim(),
        valor: Number(formMov.valor),
        data: formMov.data,
        ciclo_id: formMov.ciclo_id ? formMov.ciclo_id : null,
        observacao: formMov.observacao.trim() || null,
      }

      let res
      if (editingMovId) {
        res = await fetch(`/api/mensalidades/movimentacoes/${editingMovId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/mensalidades/movimentacoes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar movimentação')

      notifications.show({
        color: 'green',
        title: editingMovId ? 'Movimentação atualizada!' : 'Movimentação registrada com sucesso!',
        message:
          formMov.tipo === 'entrada'
            ? `Entrada de ${formatMoeda(formMov.valor)} registrada no caixa.`
            : `Saída de ${formatMoeda(formMov.valor)} registrada no caixa.`,
        icon: <IconCheck size={18} />,
      })

      setModalMovOpened(false)
      setEditingMovId(null)
      await loadMovimentacoes()
    } catch (err: any) {
      notifications.show({ color: 'red', title: 'Erro', message: err.message || 'Tente novamente.' })
    } finally {
      setSalvandoMov(false)
    }
  }

  const excluirMovimentacao = (mov: MovimentacaoComUsuario) => {
    modals.openConfirmModal({
      title: 'Excluir Movimentação',
      centered: true,
      children: (
        <Text size="sm">
          Tem certeza que deseja excluir <strong>&quot;{mov.descricao}&quot;</strong> no valor de{' '}
          <strong>{formatMoeda(mov.valor)}</strong>? Essa ação atualizará o saldo em caixa.
        </Text>
      ),
      labels: { confirm: 'Excluir', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/mensalidades/movimentacoes/${mov.id}`, {
            method: 'DELETE',
          })
          if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || 'Erro ao excluir')
          }
          notifications.show({
            color: 'green',
            title: 'Movimentação excluída',
            message: 'O registro foi removido e o saldo em caixa recalculado.',
            icon: <IconCheck size={18} />,
          })
          await loadMovimentacoes()
        } catch (err: any) {
          notifications.show({ color: 'red', title: 'Erro', message: err.message || 'Tente novamente.' })
        }
      },
    })
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

  const taxaAdimplencia =
    cicloAtual && cicloAtual.total_membros > 0
      ? Math.round((cicloAtual.total_pagos / (cicloAtual.total_membros - cicloAtual.total_isentos || 1)) * 100)
      : 0

  return (
    <Stack gap="lg">
      {/* Cabeçalho */}
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <div>
          <Button component={Link} href="/admin" variant="subtle" px={0} leftSection={<IconArrowLeft size={17} />}>
            Voltar para Administração
          </Button>
          <Title order={1}>Tesouraria & Finanças do Ministério</Title>
          <Text c="dimmed">
            Controle de mensalidades dos integrantes e livro caixa completo (lanches, doações, compras de instrumentos e despesas).
          </Text>
        </div>

        <Group gap="sm" wrap="wrap">
          {isAdmin && (
            <Tooltip
              label={
                config.cobranca_automatica
                  ? 'Cobrança automática ativa (padrão): o novo mês e os lançamentos para todos os membros são gerados automaticamente ao virar o mês. Clique para pausar.'
                  : 'Cobrança automática pausada: clique para ativar a cobrança automática ao virar o mês.'
              }
            >
              <Button
                variant={config.cobranca_automatica ? 'light' : 'outline'}
                color={config.cobranca_automatica ? 'teal' : 'gray'}
                leftSection={config.cobranca_automatica ? <IconRepeat size={18} /> : <IconPlayerPause size={18} />}
                onClick={() => alternarCobrancaAutomatica(!config.cobranca_automatica)}
              >
                Cobrança Automática: {config.cobranca_automatica ? 'Ativa (Padrão)' : 'Desativada'}
              </Button>
            </Tooltip>
          )}

          {isAdmin && (
            <Button
              variant="light"
              color="gray"
              leftSection={<IconSettings size={18} />}
              onClick={() => setConfigOpened(true)}
            >
              Configurações
            </Button>
          )}

          <Button
            color="ibce"
            leftSection={<IconPlus size={18} />}
            onClick={() => abrirNovaMovimentacao('entrada')}
          >
            Nova Movimentação
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
          clique em <strong>Configurações</strong> e ative o botão correspondente.
        </Alert>
      )}

      {/* 4 Cards de Resumo Geral da Tesouraria (Visíveis em ambas as abas) */}
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
            <Text size="xs" c="dimmed" fw={700}>SALDO ATUAL EM CAIXA</Text>
            <ThemeIcon color={resumoCaixa.saldo_em_caixa >= 0 ? 'green' : 'red'} variant="light" size="lg">
              <IconBuildingBank size={20} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={800} c={resumoCaixa.saldo_em_caixa >= 0 ? 'green.7' : 'red.7'} mt="xs">
            {formatMoeda(resumoCaixa.saldo_em_caixa)}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Receitas totais menos despesas
          </Text>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700}>MENSALIDADES PAGAS</Text>
            <ThemeIcon color="blue" variant="light" size="lg">
              <IconCoin size={20} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={700} c="blue.7" mt="xs">
            {formatMoeda(resumoCaixa.total_mensalidades_arrecadadas)}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Total arrecadado dos integrantes
          </Text>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700}>OUTRAS ENTRADAS (LANCHES/DOAÇÕES)</Text>
            <ThemeIcon color="teal" variant="light" size="lg">
              <IconArrowDownRight size={20} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={700} c="teal.7" mt="xs">
            {formatMoeda(resumoCaixa.total_outras_entradas)}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Vendas, cantina, ofertas extras
          </Text>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={700}>SAÍDAS / DESPESAS</Text>
            <ThemeIcon color="red" variant="light" size="lg">
              <IconArrowUpRight size={20} />
            </ThemeIcon>
          </Group>
          <Text size="xl" fw={700} c="red.7" mt="xs">
            {formatMoeda(resumoCaixa.total_saidas)}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Violão, cabos, som e manutenções
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Abas Principais: Livro Caixa e Mensalidades */}
      <Tabs value={activeTab} onChange={setActiveTab} variant="outline" radius="md">
        <Tabs.List mb="md">
          <Tabs.Tab
            value="caixa"
            leftSection={<IconReceipt size={18} />}
            rightSection={
              movimentacoes.length > 0 ? (
                <Badge size="xs" variant="light" color="ibce">{movimentacoes.length}</Badge>
              ) : null
            }
          >
            Livro Caixa (Entradas & Saídas)
          </Tabs.Tab>

          <Tabs.Tab
            value="mensalidades"
            leftSection={<IconWallet size={18} />}
            rightSection={
              ciclos.length > 0 ? (
                <Badge size="xs" variant="light" color="blue">{ciclos.length} meses</Badge>
              ) : null
            }
          >
            Mensalidades dos Membros
          </Tabs.Tab>
        </Tabs.List>

        {/* ABA 1: LIVRO CAIXA (ENTRADAS & SAÍDAS) */}
        <Tabs.Panel value="caixa">
          <Paper withBorder radius="md" p="md">
            <Group justify="space-between" mb="md" wrap="wrap">
              <Group gap="sm" wrap="wrap">
                <TextInput
                  placeholder="Buscar movimentação por descrição..."
                  leftSection={<IconSearch size={16} />}
                  value={filtroBuscaMov}
                  onChange={(e) => setFiltroBuscaMov(e.currentTarget.value)}
                  style={{ minWidth: 260 }}
                />

                <SegmentedControl
                  value={filtroTipoMov}
                  onChange={(val) => setFiltroTipoMov(val as 'todas' | 'entrada' | 'saida')}
                  data={[
                    { label: 'Todas', value: 'todas' },
                    { label: 'Entradas (+)', value: 'entrada' },
                    { label: 'Saídas (-)', value: 'saida' },
                  ]}
                />
              </Group>

              <Group gap="xs">
                <Button
                  variant="light"
                  color="teal"
                  size="sm"
                  leftSection={<IconArrowDownRight size={16} />}
                  onClick={() => abrirNovaMovimentacao('entrada')}
                >
                  + Entrada (Lanche/Doação)
                </Button>

                <Button
                  variant="light"
                  color="red"
                  size="sm"
                  leftSection={<IconArrowUpRight size={16} />}
                  onClick={() => abrirNovaMovimentacao('saida')}
                >
                  + Saída (Violão/Gasto)
                </Button>

                <ActionIcon variant="subtle" size="lg" onClick={loadMovimentacoes} title="Recarregar">
                  <IconRefresh size={18} />
                </ActionIcon>
              </Group>
            </Group>

            {loadingMovimentacoes ? (
              <Stack>{[1, 2, 3].map((i) => <Skeleton key={i} h={54} radius="sm" />)}</Stack>
            ) : movimentacoes.length === 0 ? (
              <Paper p="xl" ta="center">
                <ThemeIcon size={56} radius="xl" color="gray" variant="light" mx="auto">
                  <IconReceipt size={28} />
                </ThemeIcon>
                <Title order={3} mt="md">Nenhuma movimentação encontrada</Title>
                <Text c="dimmed" mt="xs" maw={460} mx="auto">
                  Use os botões acima para registrar entradas como vendas de lanche, doações ou saídas como compra de violão, cabos e manutenção.
                </Text>
              </Paper>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Tipo</Table.Th>
                      <Table.Th>Categoria</Table.Th>
                      <Table.Th>Descrição</Table.Th>
                      <Table.Th>Data</Table.Th>
                      <Table.Th>Registrado Por</Table.Th>
                      <Table.Th ta="right">Valor</Table.Th>
                      <Table.Th ta="right">Ações</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {movimentacoes.map((mov) => {
                      const isEntrada = mov.tipo === 'entrada'
                      return (
                        <Table.Tr key={mov.id}>
                          <Table.Td>
                            {isEntrada ? (
                              <Badge color="teal" variant="light" leftSection={<IconArrowDownRight size={14} />}>
                                Entrada
                              </Badge>
                            ) : (
                              <Badge color="red" variant="light" leftSection={<IconArrowUpRight size={14} />}>
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
                            <div>
                              <Text size="sm" fw={600}>{mov.descricao}</Text>
                              {mov.observacao && (
                                <Text size="xs" c="dimmed">{mov.observacao}</Text>
                              )}
                            </div>
                          </Table.Td>

                          <Table.Td>
                            <Text size="sm">{formatData(mov.data)}</Text>
                          </Table.Td>

                          <Table.Td>
                            <Text size="sm">
                              {mov.registrador?.nome || mov.registrador?.email || '—'}
                            </Text>
                          </Table.Td>

                          <Table.Td ta="right">
                            <Text size="md" fw={700} c={isEntrada ? 'teal.7' : 'red.7'}>
                              {isEntrada ? `+ ${formatMoeda(mov.valor)}` : `- ${formatMoeda(mov.valor)}`}
                            </Text>
                          </Table.Td>

                          <Table.Td ta="right">
                            <Group justify="flex-end" gap="xs">
                              <ActionIcon
                                variant="subtle"
                                color="blue"
                                onClick={() => abrirEditarMovimentacao(mov)}
                                title="Editar"
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                onClick={() => excluirMovimentacao(mov)}
                                title="Excluir"
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
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
        </Tabs.Panel>

        {/* ABA 2: MENSALIDADES DOS MEMBROS */}
        <Tabs.Panel value="mensalidades">
          <Stack gap="md">
            {ciclos.length === 0 ? (
              <Paper withBorder p="xl" radius="md" ta="center">
                <ThemeIcon size={64} radius="xl" color="ibce" variant="light" mx="auto">
                  <IconWallet size={32} />
                </ThemeIcon>
                <Title order={3} mt="md">Nenhum mês de mensalidade criado ainda</Title>
                <Text c="dimmed" mt="xs" maw={520} mx="auto">
                  Clique no botão <strong>Novo Mês Manual</strong> abaixo para criar o primeiro mês de contribuição.
                  Todos os integrantes receberão automaticamente a notificação com prazo e valor.
                </Text>
                <Button
                  mt="md"
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
                  Criar Primeiro Mês
                </Button>
              </Paper>
            ) : (
              <>
                {/* Seletor de Ciclos e Ação Manual */}
                <Paper withBorder p="sm" radius="md">
                  <Group justify="space-between" wrap="wrap">
                    <Group gap="xs" wrap="wrap">
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
                      {cicloAtual && (
                        <Badge color="ibce" variant="light" size="lg">
                          Valor: {formatMoeda(cicloAtual.valor)} / membro
                        </Badge>
                      )}
                    </Group>

                    <Button
                      size="sm"
                      variant="light"
                      leftSection={<IconPlus size={16} />}
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
                      Novo Mês Manual
                    </Button>
                  </Group>
                </Paper>

                {/* Métricas do Ciclo Selecionado */}
                {cicloAtual && (
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                    <Paper withBorder p="md" radius="md">
                      <Group justify="space-between">
                        <Text size="xs" c="dimmed" fw={700}>ARRECADADO NESTE MÊS</Text>
                        <ThemeIcon color="green" variant="light"><IconCoin size={18} /></ThemeIcon>
                      </Group>
                      <Text size="xl" fw={700} c="green.7" mt="xs">{formatMoeda(cicloAtual.valor_arrecadado)}</Text>
                      <Text size="xs" c="dimmed" mt={4}>{cicloAtual.total_pagos} pagamentos confirmados</Text>
                    </Paper>

                    <Paper withBorder p="md" radius="md">
                      <Group justify="space-between">
                        <Text size="xs" c="dimmed" fw={700}>PENDENTE NESTE MÊS</Text>
                        <ThemeIcon color="orange" variant="light"><IconWallet size={18} /></ThemeIcon>
                      </Group>
                      <Text size="xl" fw={700} c="orange.7" mt="xs">{formatMoeda(cicloAtual.valor_pendente)}</Text>
                      <Text size="xs" c="dimmed" mt={4}>{cicloAtual.total_pendentes} membros em aberto</Text>
                    </Paper>

                    <Paper withBorder p="md" radius="md">
                      <Group justify="space-between">
                        <Text size="xs" c="dimmed" fw={700}>ADIMPLÊNCIA DO MÊS</Text>
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
                    <Group gap="sm" wrap="wrap">
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
                            <Table.Th ta="right">Ações do Tesoureiro / Líder</Table.Th>
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
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* Modal Nova / Editar Movimentação (Entrada ou Saída) */}
      <Modal
        opened={modalMovOpened}
        onClose={() => setModalMovOpened(false)}
        title={editingMovId ? 'Editar Movimentação Financeira' : 'Registrar Movimentação no Caixa'}
        centered
        size="md"
      >
        <form onSubmit={salvarMovimentacao}>
          <Stack>
            <div>
              <Text size="sm" fw={600} mb={4}>Tipo de Movimentação</Text>
              <SegmentedControl
                fullWidth
                value={formMov.tipo}
                onChange={(val) => {
                  const novoTipo = val as 'entrada' | 'saida'
                  setFormMov({
                    ...formMov,
                    tipo: novoTipo,
                    categoria: novoTipo === 'entrada' ? 'Venda de Lanche' : 'Compra de Instrumento',
                  })
                }}
                data={[
                  { label: 'Entrada / Receita (+)', value: 'entrada' },
                  { label: 'Saída / Despesa (-)', value: 'saida' },
                ]}
                color={formMov.tipo === 'entrada' ? 'teal' : 'red'}
              />
            </div>

            <Select
              label="Categoria"
              required
              value={formMov.categoria}
              onChange={(val) => setFormMov({ ...formMov, categoria: val || 'Outros' })}
              data={formMov.tipo === 'entrada' ? categoriasEntrada : categoriasSaida}
            />

            {formMov.categoria === 'Outros' && (
              <TextInput
                label="Especifique a Categoria"
                placeholder="Ex: Bazar beneficente, Conserto de mesa de som..."
                value={formMov.categoria_custom}
                onChange={(e) => setFormMov({ ...formMov, categoria_custom: e.currentTarget.value })}
                required
              />
            )}

            <TextInput
              label="Descrição Detalhada"
              placeholder={
                formMov.tipo === 'entrada'
                  ? 'Ex: Venda de bolos e sucos no ensaio geral de sábado'
                  : 'Ex: Compra de violão Giannini eletroacústico e capa'
              }
              required
              value={formMov.descricao}
              onChange={(e) => setFormMov({ ...formMov, descricao: e.currentTarget.value })}
            />

            <SimpleGrid cols={2}>
              <NumberInput
                label="Valor (R$)"
                required
                min={0.01}
                decimalScale={2}
                prefix="R$ "
                value={formMov.valor}
                onChange={(val) => setFormMov({ ...formMov, valor: Number(val) || 0 })}
              />

              <TextInput
                label="Data"
                type="date"
                required
                value={formMov.data}
                onChange={(e) => setFormMov({ ...formMov, data: e.currentTarget.value })}
              />
            </SimpleGrid>

            {ciclos.length > 0 && (
              <Select
                label="Vincular a um Mês (Opcional)"
                placeholder="Geral / Sem mês específico"
                clearable
                value={formMov.ciclo_id}
                onChange={(val) => setFormMov({ ...formMov, ciclo_id: val || '' })}
                data={ciclos.map((c) => ({
                  value: c.id,
                  label: `${mesesNomes[c.mes - 1]} de ${c.ano}`,
                }))}
              />
            )}

            <Textarea
              label="Observações / Detalhes (Opcional)"
              placeholder="Ex: Comprado na loja Som & Cordas, com recibo guardado na pasta física."
              rows={3}
              value={formMov.observacao}
              onChange={(e) => setFormMov({ ...formMov, observacao: e.currentTarget.value })}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setModalMovOpened(false)}>Cancelar</Button>
              <Button
                type="submit"
                loading={salvandoMov}
                color={formMov.tipo === 'entrada' ? 'teal' : 'red'}
              >
                {editingMovId ? 'Salvar Alterações' : formMov.tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal Novo Ciclo Manual */}
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

            <Switch
              label="Cobrança Automática ao Virar o Mês (Padrão)"
              description="Gera automaticamente a nova mensalidade e os registros de pagamento para todos os integrantes assim que o mês virar, utilizando o valor e dia de vencimento padrão."
              size="md"
              color="teal"
              checked={config.cobranca_automatica}
              onChange={(e) => setConfig({ ...config, cobranca_automatica: e.currentTarget.checked })}
            />

            <Divider my="xs" />

            <Select
              label="Tesoureiro Responsável"
              description="O tesoureiro tem permissão para gerenciar as mensalidades, o livro caixa e dar baixa em pagamentos."
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
