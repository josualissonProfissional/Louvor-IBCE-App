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
    const { data: config, error } = await (supabase
      .from('configuracoes') as any)
      .select('*')
      .eq('id', 'geral')
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Busca o usuário tesoureiro atual
    const { data: tesoureiro } = await (supabase
      .from('usuarios') as any)
      .select('id, nome, email')
      .eq('tesoureiro', true)
      .limit(1)
      .maybeSingle()

    return NextResponse.json({
      configuracao: config || {
        id: 'geral',
        modulo_mensalidade_ativo: false,
        chave_pix: '',
        tipo_chave_pix: 'aleatoria',
        beneficiario_pix: '',
        valor_mensalidade_padrao: 20.0,
        dia_vencimento_padrao: 10,
      },
      tesoureiro: tesoureiro || null,
      isAdmin: user.lider === true,
      canManageFinances: user.lider === true || user.tesoureiro === true,
    })
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.lider) {
      return NextResponse.json({ error: 'Apenas líderes podem alterar configurações' }, { status: 403 })
    }

    const body = await request.json()
    const {
      modulo_mensalidade_ativo,
      chave_pix,
      tipo_chave_pix,
      beneficiario_pix,
      valor_mensalidade_padrao,
      dia_vencimento_padrao,
      tesoureiro_id,
    } = body

    const supabase = createServerClient()

    // Atualiza tabela de configurações
    const { data: updatedConfig, error: configError } = await (supabase
      .from('configuracoes') as any)
      .upsert({
        id: 'geral',
        modulo_mensalidade_ativo: Boolean(modulo_mensalidade_ativo),
        chave_pix: chave_pix || null,
        tipo_chave_pix: tipo_chave_pix || null,
        beneficiario_pix: beneficiario_pix || null,
        valor_mensalidade_padrao: Number(valor_mensalidade_padrao) || 20.0,
        dia_vencimento_padrao: Number(dia_vencimento_padrao) || 10,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: 500 })
    }

    // Se tesoureiro_id foi informado (ou alterado)
    if (tesoureiro_id !== undefined) {
      // Remove o papel de tesoureiro de todos
      await (supabase
        .from('usuarios') as any)
        .update({ tesoureiro: false, updated_at: new Date().toISOString() })
        .neq('id', '00000000-0000-0000-0000-000000000000')

      // Atribui ao novo tesoureiro (se fornecido)
      if (tesoureiro_id) {
        await (supabase
          .from('usuarios') as any)
          .update({ tesoureiro: true, updated_at: new Date().toISOString() })
          .eq('id', tesoureiro_id)
      }
    }

    return NextResponse.json({ success: true, configuracao: updatedConfig })
  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
    return NextResponse.json({ error: 'Erro interno ao salvar configurações' }, { status: 500 })
  }
}
