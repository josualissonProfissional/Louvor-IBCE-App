import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser, canManageFinances } from '@/lib/auth'
import { createBatchNotifications } from '@/lib/notifications'
import { verificarECriarCicloAutomatico } from '@/lib/mensalidades'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Se a cobrança automática estiver ativa e virou o mês, cria o ciclo automaticamente
    await verificarECriarCicloAutomatico()

    const supabase = createServerClient()

    // Busca ciclos ordenados pelo mais recente
    const { data: ciclos, error: ciclosError } = await (supabase
      .from('ciclos_mensalidade') as any)
      .select('*')
      .order('mes_referencia', { ascending: false })

    if (ciclosError) {
      return NextResponse.json({ error: ciclosError.message }, { status: 500 })
    }

    // Busca métricas de pagamentos para cada ciclo
    const { data: pagamentos, error: pagError } = await (supabase
      .from('pagamentos_mensalidade') as any)
      .select('ciclo_id, status, valor')

    if (pagError) {
      return NextResponse.json({ error: pagError.message }, { status: 500 })
    }

    // Calcula agregados
    const ciclosComMetricas = ((ciclos || []) as any[]).map((ciclo: any) => {
      const pags = ((pagamentos || []) as any[]).filter((p: any) => p.ciclo_id === ciclo.id)
      const pagos = pags.filter((p: any) => p.status === 'pago')
      const pendentes = pags.filter((p: any) => p.status === 'pendente')
      const isentos = pags.filter((p: any) => p.status === 'isento')

      const valorArrecadado = pagos.reduce((acc: number, cur: any) => acc + Number(cur.valor), 0)
      const valorPendente = pendentes.reduce((acc: number, cur: any) => acc + Number(cur.valor), 0)

      return {
        ...ciclo,
        total_membros: pags.length,
        total_pagos: pagos.length,
        total_pendentes: pendentes.length,
        total_isentos: isentos.length,
        valor_arrecadado: valorArrecadado,
        valor_pendente: valorPendente,
      }
    })

    return NextResponse.json(ciclosComMetricas)
  } catch (error) {
    console.error('Erro ao listar ciclos de mensalidade:', error)
    return NextResponse.json({ error: 'Erro interno ao listar ciclos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    const authorized = await canManageFinances()

    if (!user || !authorized) {
      return NextResponse.json(
        { error: 'Apenas líderes e o tesoureiro podem criar ciclos de mensalidade' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { ano, mes, valor, data_vencimento } = body

    if (!ano || !mes || !valor || !data_vencimento) {
      return NextResponse.json(
        { error: 'Ano, mês, valor e data de vencimento são obrigatórios' },
        { status: 400 }
      )
    }

    const mesReferencia = `${ano}-${String(mes).padStart(2, '0')}`
    const supabase = createServerClient()

    // 1. Cria o ciclo
    const { data: novoCiclo, error: cicloError } = await (supabase
      .from('ciclos_mensalidade') as any)
      .insert({
        mes_referencia: mesReferencia,
        ano: Number(ano),
        mes: Number(mes),
        valor: Number(valor),
        data_vencimento,
        criado_por: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (cicloError) {
      if (cicloError.code === '23505') {
        return NextResponse.json(
          { error: `A mensalidade para o mês ${mesReferencia} já existe` },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: cicloError.message }, { status: 500 })
    }

    // 2. Busca todos os usuários do sistema
    const { data: usuarios } = await (supabase.from('usuarios') as any).select('id')

    if (usuarios && usuarios.length > 0) {
      // 3. Cria o registro de pagamento pendente para cada membro
      const pagamentosParaInserir = (usuarios as any[]).map((membro: any) => ({
        ciclo_id: (novoCiclo as any).id,
        usuario_id: membro.id,
        valor: Number(valor),
        status: 'pendente',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      await (supabase.from('pagamentos_mensalidade') as any).insert(pagamentosParaInserir)

      // 4. Dispara notificação in-app para todos os membros
      const mesesNomes = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ]
      const nomeMes = mesesNomes[Number(mes) - 1] || mesReferencia
      const [vAno, vMes, vDia] = data_vencimento.split('-')
      const vencFormatado = `${vDia}/${vMes}/${vAno}`
      const valorFormatado = Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

      await createBatchNotifications(
        (usuarios as any[]).map((membro: any) => ({
          usuario_id: membro.id,
          titulo: `Mensalidade de ${nomeMes}/${ano}`,
          mensagem: `A mensalidade de ${nomeMes} (${valorFormatado}) foi lançada. Vencimento: ${vencFormatado}.`,
          tipo: 'mensalidade',
          link: '/mensalidades',
        }))
      )
    }

    return NextResponse.json(novoCiclo, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar ciclo de mensalidade:', error)
    return NextResponse.json({ error: 'Erro interno ao criar mensalidade' }, { status: 500 })
  }
}
