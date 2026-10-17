import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser, canManageFinances } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') // 'todas' | 'entrada' | 'saida'
    const cicloId = searchParams.get('ciclo_id')
    const busca = searchParams.get('busca')

    const supabase = createServerClient()

    let query = (supabase.from('movimentacoes_financeiras') as any)
      .select(`
        *,
        registrador:usuarios!movimentacoes_financeiras_registrado_por_fkey(id, nome, email),
        ciclo:ciclos_mensalidade(id, mes_referencia, ano, mes)
      `)
      .order('data', { ascending: false })
      .order('created_at', { ascending: false })

    if (tipo && (tipo === 'entrada' || tipo === 'saida')) {
      query = query.eq('tipo', tipo)
    }

    if (cicloId) {
      query = query.eq('ciclo_id', cicloId)
    }

    if (busca && busca.trim()) {
      query = query.ilike('descricao', `%${busca.trim()}%`)
    }

    const { data: movimentacoes, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Busca todas as movimentações para o resumo geral do caixa
    const { data: todasMovimentacoes } = await (supabase
      .from('movimentacoes_financeiras') as any)
      .select('tipo, valor')

    const totalOutrasEntradas = ((todasMovimentacoes || []) as any[])
      .filter((m: any) => m.tipo === 'entrada')
      .reduce((acc: number, cur: any) => acc + Number(cur.valor || 0), 0)

    const totalSaidas = ((todasMovimentacoes || []) as any[])
      .filter((m: any) => m.tipo === 'saida')
      .reduce((acc: number, cur: any) => acc + Number(cur.valor || 0), 0)

    // Busca total arrecadado com mensalidades pagas
    const { data: pagamentosPagos } = await (supabase
      .from('pagamentos_mensalidade') as any)
      .select('valor')
      .eq('status', 'pago')

    const totalMensalidadesArrecadadas = ((pagamentosPagos || []) as any[])
      .reduce((acc: number, cur: any) => acc + Number(cur.valor || 0), 0)

    const totalGeralEntradas = totalMensalidadesArrecadadas + totalOutrasEntradas
    const saldoEmCaixa = totalGeralEntradas - totalSaidas

    return NextResponse.json({
      movimentacoes: movimentacoes || [],
      resumo: {
        total_mensalidades_arrecadadas: totalMensalidadesArrecadadas,
        total_outras_entradas: totalOutrasEntradas,
        total_geral_entradas: totalGeralEntradas,
        total_saidas: totalSaidas,
        saldo_em_caixa: saldoEmCaixa,
      },
    })
  } catch (error) {
    console.error('Erro ao listar movimentações financeiras:', error)
    return NextResponse.json({ error: 'Erro interno ao listar movimentações' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    const authorized = await canManageFinances()

    if (!user || !authorized) {
      return NextResponse.json(
        { error: 'Apenas líderes e o tesoureiro podem registrar movimentações financeiras' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { tipo, categoria, descricao, valor, data, ciclo_id, observacao } = body

    if (!tipo || !['entrada', 'saida'].includes(tipo)) {
      return NextResponse.json({ error: 'Tipo deve ser "entrada" ou "saida"' }, { status: 400 })
    }

    if (!descricao || !descricao.trim()) {
      return NextResponse.json({ error: 'Descrição é obrigatória' }, { status: 400 })
    }

    const valorNum = Number(valor)
    if (isNaN(valorNum) || valorNum <= 0) {
      return NextResponse.json({ error: 'Valor deve ser um número maior que zero' }, { status: 400 })
    }

    const dataFinal = data || new Date().toISOString().split('T')[0]
    const supabase = createServerClient()

    const { data: novaMovimentacao, error } = await (supabase
      .from('movimentacoes_financeiras') as any)
      .insert({
        tipo,
        categoria: categoria || (tipo === 'entrada' ? 'Entradas' : 'Despesas'),
        descricao: descricao.trim(),
        valor: valorNum,
        data: dataFinal,
        ciclo_id: ciclo_id || null,
        observacao: observacao?.trim() || null,
        registrado_por: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        *,
        registrador:usuarios!movimentacoes_financeiras_registrado_por_fkey(id, nome, email),
        ciclo:ciclos_mensalidade(id, mes_referencia)
      `)
      .single()

    if (error) {
      console.error('Erro ao inserir movimentação:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(novaMovimentacao, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar movimentação financeira:', error)
    return NextResponse.json({ error: 'Erro interno ao criar movimentação' }, { status: 500 })
  }
}
