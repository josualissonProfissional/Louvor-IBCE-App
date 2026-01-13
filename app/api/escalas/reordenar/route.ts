// API para reordenar músicas na escala
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

// PUT - Reordena músicas de uma data
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = createServerClient()
    const body = await request.json()

    const { data: dataEscala, musicas } = body

    // Validação
    if (!dataEscala || !Array.isArray(musicas)) {
      return NextResponse.json(
        { error: 'Data e lista de músicas são obrigatórias' },
        { status: 400 }
      )
    }

    // Atualiza a ordem de cada música (todas as escalas da mesma música recebem a mesma ordem)
    const updates = musicas.map((musica: { musica_id: string; ordem: number }) => {
      const query = supabase.from('escalas') as any
      return query
        .update({ ordem: musica.ordem, updated_at: new Date().toISOString() })
        .eq('data', dataEscala)
        .eq('musica_id', musica.musica_id)
    })

    const results = await Promise.all(updates)
    
    // Verifica se houve algum erro
    for (const result of results) {
      if (result.error) {
        throw result.error
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao reordenar músicas' },
      { status: 400 }
    )
  }
}
