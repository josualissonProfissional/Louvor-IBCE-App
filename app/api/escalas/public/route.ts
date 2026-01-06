// API pública para buscar escalas (requer autenticação, mas não precisa ser admin)
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

// GET - Lista escalas (qualquer usuário autenticado pode ver)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const data = searchParams.get('data')
    const dataInicio = searchParams.get('data_inicio')
    const dataFim = searchParams.get('data_fim')

    let query = supabase
      .from('escalas')
      .select(`
        *,
        musica:musicas(
          *,
          letras(id),
          cifras(id)
        ),
        usuario:usuarios(*, instrumento:instrumentos(*))
      `)

    if (data) {
      query = query.eq('data', data)
    } else {
      if (dataInicio) {
        query = query.gte('data', dataInicio)
      }
      if (dataFim) {
        query = query.lte('data', dataFim)
      }
    }

    const { data: escalas, error } = await query.order('data', { ascending: true })

    if (error) throw error

    return NextResponse.json(escalas || [])
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar escalas' },
      { status: 500 }
    )
  }
}

