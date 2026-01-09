// API para operações em cifra específica
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { AtualizarCifra } from '@/types'

// PUT - Atualiza cifra
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const supabase = createServerClient()
    const body = await request.json()

    const { texto, titulo } = body

    const updateData: AtualizarCifra = {
      texto,
      titulo: titulo || null,
      updated_at: new Date().toISOString(),
    }

    const query = supabase.from('cifras') as any
    const { data, error } = await query
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar cifra' },
      { status: 400 }
    )
  }
}

// DELETE - Remove cifra
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const supabase = createServerClient()

    const { error } = await supabase
      .from('cifras')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao remover cifra' },
      { status: 400 }
    )
  }
}

