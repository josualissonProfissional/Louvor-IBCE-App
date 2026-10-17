import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabase = createServerClient()
    const { data: notificacoes, error } = await (supabase
      .from('notificacoes') as any)
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const naoLidas = ((notificacoes || []) as any[]).filter((n: any) => !n.lida).length

    return NextResponse.json({
      notificacoes: notificacoes || [],
      nao_lidas: naoLidas,
    })
  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
    return NextResponse.json({ error: 'Erro interno ao buscar notificações' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, marcar_todas } = body
    const supabase = createServerClient()

    if (marcar_todas) {
      const { error } = await (supabase
        .from('notificacoes') as any)
        .update({ lida: true })
        .eq('usuario_id', user.id)
        .eq('lida', false)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: 'Todas as notificações foram marcadas como lidas' })
    }

    if (!id) {
      return NextResponse.json({ error: 'ID da notificação é obrigatório' }, { status: 400 })
    }

    const { data, error } = await (supabase
      .from('notificacoes') as any)
      .update({ lida: true })
      .eq('id', id)
      .eq('usuario_id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error)
    return NextResponse.json({ error: 'Erro interno ao atualizar notificação' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const limparLidas = searchParams.get('limpar_lidas') === 'true'
    const supabase = createServerClient()

    if (limparLidas) {
      const { error } = await (supabase
        .from('notificacoes') as any)
        .delete()
        .eq('usuario_id', user.id)
        .eq('lida', true)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: 'Notificações lidas removidas' })
    }

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const { error } = await (supabase
      .from('notificacoes') as any)
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir notificação:', error)
    return NextResponse.json({ error: 'Erro interno ao excluir notificação' }, { status: 500 })
  }
}
