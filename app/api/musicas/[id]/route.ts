// API para operações em música específica
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { AtualizarMusica } from '@/types'

// GET - Busca música específica (qualquer usuário autenticado pode ver)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('musicas')
      .select(`
        *,
        cifras(*),
        letras(*)
      `)
      .eq('id', params.id)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar música' },
      { status: 400 }
    )
  }
}

// PUT - Atualiza música
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const supabase = createServerClient()
    const body = await request.json()

    const { titulo, link_youtube } = body

    const updateData: AtualizarMusica = {
      titulo,
      link_youtube,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('musicas')
      .update(updateData as any)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar música' },
      { status: 400 }
    )
  }
}

// DELETE - Remove música
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const supabase = createServerClient()

    const { error } = await supabase
      .from('musicas')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao remover música' },
      { status: 400 }
    )
  }
}






