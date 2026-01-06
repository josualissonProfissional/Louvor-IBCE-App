// API para gerenciamento de cifras
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

// POST - Adiciona nova cifra a uma música
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = createServerClient()
    const body = await request.json()

    const { musica_id, texto } = body

    const { data, error } = await supabase
      .from('cifras')
      .insert({
        musica_id,
        texto,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao criar cifra' },
      { status: 400 }
    )
  }
}







