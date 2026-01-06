// API para operações em escala específica
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

// PUT - Atualiza escala
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const supabase = createServerClient()
    const body = await request.json()

    const { data: dataEscala, musica_id, usuario_id, funcao } = body

    const { data, error } = await supabase
      .from('escalas')
      .update({
        data: dataEscala,
        musica_id,
        usuario_id,
        funcao,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar escala' },
      { status: 400 }
    )
  }
}

// DELETE - Remove escala
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const supabase = createServerClient()

    const { error } = await supabase
      .from('escalas')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao remover escala' },
      { status: 400 }
    )
  }
}



