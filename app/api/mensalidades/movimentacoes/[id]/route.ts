import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser, canManageFinances } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const authorized = await canManageFinances()

    if (!user || !authorized) {
      return NextResponse.json(
        { error: 'Apenas líderes e o tesoureiro podem editar movimentações' },
        { status: 403 }
      )
    }

    const { id } = params
    if (!id) {
      return NextResponse.json({ error: 'ID da movimentação é obrigatório' }, { status: 400 })
    }

    const body = await request.json()
    const { tipo, categoria, descricao, valor, data, ciclo_id, observacao } = body

    const payload: any = {
      updated_at: new Date().toISOString(),
    }

    if (tipo !== undefined) {
      if (!['entrada', 'saida'].includes(tipo)) {
        return NextResponse.json({ error: 'Tipo deve ser "entrada" ou "saida"' }, { status: 400 })
      }
      payload.tipo = tipo
    }

    if (categoria !== undefined) payload.categoria = categoria
    if (descricao !== undefined) payload.descricao = descricao.trim()
    if (valor !== undefined) {
      const v = Number(valor)
      if (isNaN(v) || v <= 0) {
        return NextResponse.json({ error: 'Valor deve ser maior que zero' }, { status: 400 })
      }
      payload.valor = v
    }
    if (data !== undefined) payload.data = data
    if (ciclo_id !== undefined) payload.ciclo_id = ciclo_id || null
    if (observacao !== undefined) payload.observacao = observacao?.trim() || null

    const supabase = createServerClient()
    const { data: updated, error } = await (supabase
      .from('movimentacoes_financeiras') as any)
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        registrador:usuarios!movimentacoes_financeiras_registrado_por_fkey(id, nome, email),
        ciclo:ciclos_mensalidade(id, mes_referencia)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erro ao atualizar movimentação financeira:', error)
    return NextResponse.json({ error: 'Erro interno ao atualizar movimentação' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const authorized = await canManageFinances()

    if (!user || !authorized) {
      return NextResponse.json(
        { error: 'Apenas líderes e o tesoureiro podem excluir movimentações' },
        { status: 403 }
      )
    }

    const { id } = params
    if (!id) {
      return NextResponse.json({ error: 'ID da movimentação é obrigatório' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { error } = await (supabase
      .from('movimentacoes_financeiras') as any)
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Movimentação excluída com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir movimentação financeira:', error)
    return NextResponse.json({ error: 'Erro interno ao excluir movimentação' }, { status: 500 })
  }
}
