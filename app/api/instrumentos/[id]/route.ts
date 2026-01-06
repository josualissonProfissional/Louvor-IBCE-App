// API para operações em instrumento específico
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

// PUT - Atualiza instrumento
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const supabase = createServerClient()
    const body = await request.json()

    const { nome } = body

    const { data, error } = await supabase
      .from('instrumentos')
      .update({ nome })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar instrumento' },
      { status: 400 }
    )
  }
}

// DELETE - Remove instrumento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const supabase = createServerClient()

    const { error } = await supabase
      .from('instrumentos')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao remover instrumento' },
      { status: 400 }
    )
  }
}



