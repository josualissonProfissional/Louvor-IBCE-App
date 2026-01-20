// API para autocomplete de músicas (busca rápida de títulos)
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

// GET - Lista títulos de músicas para autocomplete
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
    const query = searchParams.get('q') || '' // Query de busca opcional

    let musicasQuery = supabase
      .from('musicas')
      .select('id, titulo')
      .order('titulo', { ascending: true })

    // Se há query, filtra por título
    if (query && query.trim().length > 0) {
      musicasQuery = musicasQuery.ilike('titulo', `%${query.trim()}%`)
    }

    // Limita a 20 resultados para performance
    const { data: musicas, error } = await musicasQuery.limit(20)

    if (error) throw error

    return NextResponse.json({
      musicas: musicas || []
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar músicas' },
      { status: 500 }
    )
  }
}
