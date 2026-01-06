// API para gerenciamento de letras
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { NovaLetra } from '@/types'

// POST - Adiciona nova letra a uma música
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = createServerClient()
    const body = await request.json()

    const { musica_id, texto } = body

    const letraData: NovaLetra = {
      musica_id,
      texto,
    }

    const { data, error } = await supabase
      .from('letras')
      .insert(letraData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao criar letra' },
      { status: 400 }
    )
  }
}







