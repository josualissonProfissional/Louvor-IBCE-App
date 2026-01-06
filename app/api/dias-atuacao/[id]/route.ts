// API para operações em dia de atuação específico
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { AtualizarDiaAtuacao } from '@/types'

// PUT - Atualiza dia de atuação
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const supabase = createServerClient()
    const body = await request.json()

    const { data: dataAtuacao } = body

    const updateData: AtualizarDiaAtuacao = {
      data: dataAtuacao,
    }

    const { data, error } = await supabase
      .from('dias_atuacao')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar dia de atuação' },
      { status: 400 }
    )
  }
}

// DELETE - Remove dia de atuação
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const supabase = createServerClient()

    const { error } = await supabase
      .from('dias_atuacao')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao remover dia de atuação' },
      { status: 400 }
    )
  }
}




