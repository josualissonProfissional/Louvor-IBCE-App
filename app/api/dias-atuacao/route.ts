// API para gerenciamento de dias de atuação
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { NovoDiaAtuacao } from '@/types'

// GET - Lista dias de atuação
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const dataInicio = searchParams.get('data_inicio')
    const dataFim = searchParams.get('data_fim')

    let query = supabase.from('dias_atuacao').select('*')

    if (dataInicio) {
      query = query.gte('data', dataInicio)
    }
    if (dataFim) {
      query = query.lte('data', dataFim)
    }

    const { data, error } = await query.order('data', { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar dias de atuação' },
      { status: 400 }
    )
  }
}

// POST - Cria novo dia de atuação (apenas admin)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = createServerClient()
    const body = await request.json()

    // Mantém compatibilidade com o formato antigo { data } e aceita o novo lote { datas }.
    const receivedDates: unknown[] = Array.isArray(body.datas) ? body.datas : [body.data]
    if (receivedDates.length === 0 || receivedDates.length > 100) {
      return NextResponse.json({ error: 'Selecione entre 1 e 100 datas' }, { status: 400 })
    }

    const normalizedDates = [...new Set(receivedDates.map((value) => {
      if (typeof value !== 'string') throw new Error('Todas as datas devem ser válidas')
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
      const parsed = new Date(value)
      if (Number.isNaN(parsed.getTime())) throw new Error('Formato de data inválido. Use AAAA-MM-DD')
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`
    }))]

    const { data: existing, error: lookupError } = await supabase
      .from('dias_atuacao')
      .select('data')
      .in('data', normalizedDates)
    if (lookupError) throw lookupError

    const existingDates = new Set((existing || []).map((item: { data: string }) => item.data))
    const datesToCreate = normalizedDates.filter((date) => !existingDates.has(date))
    const rows: NovoDiaAtuacao[] = datesToCreate.map((data) => ({ data }))

    let created: unknown[] = []
    if (rows.length > 0) {
      const { data, error } = await supabase.from('dias_atuacao').insert(rows as any).select()
      if (error) throw error
      created = data || []
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      skipped: normalizedDates.length - datesToCreate.length,
      dates: created,
    }, { status: datesToCreate.length > 0 ? 201 : 200 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao criar dia de atuação' },
      { status: 400 }
    )
  }
}

// DELETE - Remove vários dias de atuação de uma vez (apenas admin)
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()
    const { ids } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => typeof id !== 'string')) {
      return NextResponse.json({ error: 'Selecione ao menos uma data válida' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { error } = await supabase.from('dias_atuacao').delete().in('id', ids)
    if (error) throw error

    return NextResponse.json({ success: true, count: ids.length })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao remover dias de atuação' },
      { status: 400 }
    )
  }
}




