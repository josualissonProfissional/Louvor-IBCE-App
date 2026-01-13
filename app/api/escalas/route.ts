// API para gerenciamento de escalas
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { NovaEscala } from '@/types'

// GET - Lista escalas
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const dataInicio = searchParams.get('data_inicio')
    const dataFim = searchParams.get('data_fim')

    let query = supabase
      .from('escalas')
      .select(`
        *,
        musica:musicas(*),
        usuario:usuarios(*, instrumento:instrumentos(*))
      `)

    if (dataInicio) {
      query = query.gte('data', dataInicio)
    }
    if (dataFim) {
      query = query.lte('data', dataFim)
    }

    const { data, error } = await query.order('data', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar escalas' },
      { status: 401 }
    )
  }
}

// POST - Cria nova escala
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = createServerClient()
    const body = await request.json()

    const { data: dataEscala, musica_id, usuario_id, funcao } = body

    // Validação: se não tem música, a função não pode ser 'solo'
    if (!musica_id && funcao === 'solo') {
      return NextResponse.json(
        { error: 'Escalas gerais não podem ter função "solo"' },
        { status: 400 }
      )
    }

    // Se tem música, calcula a ordem (última posição + 1)
    let ordem: number | null = null
    if (musica_id) {
      const { data: escalasExistentes } = await supabase
        .from('escalas')
        .select('ordem')
        .eq('data', dataEscala)
        .not('ordem', 'is', null)
        .order('ordem', { ascending: false })
        .limit(1)
      
      ordem = escalasExistentes && escalasExistentes.length > 0 
        ? (escalasExistentes[0].ordem || 0) + 1 
        : 1
    }

    const escalaData: NovaEscala = {
      data: dataEscala,
      musica_id: musica_id || null, // Permite null para escalas gerais
      usuario_id,
      funcao,
      ordem: ordem,
    }

    const { data, error } = await supabase
      .from('escalas')
      .insert(escalaData as any)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao criar escala' },
      { status: 400 }
    )
  }
}




