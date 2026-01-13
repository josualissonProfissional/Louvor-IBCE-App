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

    let { data: dataAtuacao } = body

    // Garante que a data está no formato YYYY-MM-DD
    // Se vier como timestamp ou outro formato, converte
    if (dataAtuacao.includes('T') || dataAtuacao.includes('Z')) {
      const date = new Date(dataAtuacao)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      dataAtuacao = `${year}-${month}-${day}`
    }

    // Valida formato da data (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataAtuacao)) {
      throw new Error('Formato de data inválido. Use YYYY-MM-DD')
    }

    const diaAtuacaoData: NovoDiaAtuacao = {
      data: dataAtuacao,
    }

    const { data, error } = await supabase
      .from('dias_atuacao')
      .insert(diaAtuacaoData as any)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao criar dia de atuação' },
      { status: 400 }
    )
  }
}




