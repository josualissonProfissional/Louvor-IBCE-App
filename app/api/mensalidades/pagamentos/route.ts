import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser, canManageFinances } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'
import { verificarECriarCicloAutomatico } from '@/lib/mensalidades'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Se a cobrança automática estiver ativa e virou o mês, cria o ciclo automaticamente
    await verificarECriarCicloAutomatico()

    const { searchParams } = new URL(request.url)
    const cicloId = searchParams.get('ciclo_id')
    const usuarioId = searchParams.get('usuario_id')
    const authorized = await canManageFinances()

    const supabase = createServerClient()

    // 1. Se pediu pagamentos de um ciclo específico
    if (cicloId) {
      // Se não for gestor financeiro, só pode ver o seu próprio pagamento naquele ciclo
      if (!authorized) {
        const { data, error } = await (supabase
          .from('pagamentos_mensalidade') as any)
          .select(`
            *,
            ciclo:ciclos_mensalidade(*)
          `)
          .eq('ciclo_id', cicloId)
          .eq('usuario_id', user.id)
          .maybeSingle()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data ? [data] : [])
      }

      // Gestor vê todos os membros no ciclo
      const { data, error } = await (supabase
        .from('pagamentos_mensalidade') as any)
        .select(`
          *,
          usuario:usuarios(id, nome, email, cargo, instrumento:instrumentos(nome)),
          confirmador:usuarios!pagamentos_mensalidade_confirmado_por_fkey(id, nome, email)
        `)
        .eq('ciclo_id', cicloId)
        .order('created_at', { ascending: true })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    // 2. Se pediu histórico de um usuário (ou do usuário logado)
    const targetUserId = (authorized && usuarioId) ? usuarioId : user.id

    const { data, error } = await (supabase
      .from('pagamentos_mensalidade') as any)
      .select(`
        *,
        ciclo:ciclos_mensalidade(*)
      `)
      .eq('usuario_id', targetUserId)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao buscar pagamentos de mensalidade:', error)
    return NextResponse.json({ error: 'Erro interno ao buscar pagamentos' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    const authorized = await canManageFinances()

    if (!user || !authorized) {
      return NextResponse.json(
        { error: 'Apenas líderes e o tesoureiro podem alterar pagamentos' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, status, observacao, valor } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'ID do pagamento e status são obrigatórios' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Busca o pagamento atual e informações do ciclo
    const { data: pagamentoAtual, error: pagError } = await (supabase
      .from('pagamentos_mensalidade') as any)
      .select(`
        *,
        ciclo:ciclos_mensalidade(*)
      `)
      .eq('id', id)
      .single()

    if (pagError || !pagamentoAtual) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }

    const isPago = status === 'pago'
    const payload: any = {
      status,
      observacao: observacao !== undefined ? observacao : pagamentoAtual.observacao,
      valor: valor !== undefined ? Number(valor) : pagamentoAtual.valor,
      updated_at: new Date().toISOString(),
      data_pagamento: isPago ? (pagamentoAtual.data_pagamento || new Date().toISOString()) : null,
      confirmado_por: isPago ? user.id : null,
    }

    const { data: updated, error: updateError } = await (supabase
      .from('pagamentos_mensalidade') as any)
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        usuario:usuarios(id, nome, email),
        ciclo:ciclos_mensalidade(*)
      `)
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Se acabou de ser marcado como PAGO, envia notificação de confirmação ao membro
    if (isPago && pagamentoAtual.status !== 'pago') {
      const mesRef = (updated as any)?.ciclo?.mes_referencia || ''
      await createNotification({
        usuario_id: (updated as any).usuario_id,
        titulo: 'Pagamento Confirmado! ✅',
        mensagem: `O seu pagamento da mensalidade (${mesRef}) foi confirmado. Obrigado!`,
        tipo: 'mensalidade',
        link: '/mensalidades',
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error)
    return NextResponse.json({ error: 'Erro interno ao atualizar pagamento' }, { status: 500 })
  }
}
