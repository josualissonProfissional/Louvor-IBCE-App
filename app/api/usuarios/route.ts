// API para gerenciamento de usuários (apenas admin)
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateRandomPassword } from '@/lib/utils'

// GET - Lista todos os usuários
export async function GET() {
  try {
    await requireAdmin()
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        *,
        instrumento:instrumentos(*)
      `)
      .order('nome', { ascending: true, nullsFirst: false })
      .order('email', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar usuários' },
      { status: 401 }
    )
  }
}

// POST - Cria novo usuário
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = createAdminClient()
    const body = await request.json()

    const { nome, email, senha, data_nascimento, cargo, lider, instrumento_id } = body

    // Cria usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: senha || generateRandomPassword(),
      email_confirm: true,
    })

    if (authError) throw authError

    // Cria registro na tabela usuarios
    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        id: authData.user.id,
        nome: nome || null,
        email,
        senha: senha || generateRandomPassword(), // Em produção, não armazenar senha em texto
        data_nascimento,
        cargo,
        lider: lider || false,
        instrumento_id: instrumento_id || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao criar usuário' },
      { status: 400 }
    )
  }
}




