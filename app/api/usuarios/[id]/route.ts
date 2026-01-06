// API para operações em usuário específico
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { AtualizarUsuario } from '@/types'

// PUT - Atualiza usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const supabase = createAdminClient()
    const body = await request.json()

    const { nome, email, senha, data_nascimento, cargo, lider, instrumento_id } = body

    // Se uma nova senha foi fornecida, atualiza no Supabase Auth
    if (senha && senha.trim() !== '') {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        params.id,
        { password: senha }
      )
      if (authError) throw authError
    }

    // Atualiza dados na tabela usuarios
    const updateData: AtualizarUsuario = {
      nome: nome || null,
      email,
      data_nascimento,
      cargo,
      lider,
      instrumento_id: instrumento_id || null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('usuarios')
      .update(updateData as any)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar usuário' },
      { status: 400 }
    )
  }
}

// DELETE - Remove usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    // Remove também do Supabase Auth
    await supabase.auth.admin.deleteUser(params.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao remover usuário' },
      { status: 400 }
    )
  }
}




