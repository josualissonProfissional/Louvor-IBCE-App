// API para gerenciamento de instrumentos
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { NovoInstrumento } from '@/types'

// GET - Lista todos os instrumentos
export async function GET() {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('instrumentos')
      .select('*')
      .order('nome', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar instrumentos' },
      { status: 400 }
    )
  }
}

// POST - Cria novo instrumento (apenas admin)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = createServerClient()
    const body = await request.json()

    const { nome } = body

    const instrumentoData: NovoInstrumento = {
      nome,
    }

    const { data, error } = await supabase
      .from('instrumentos')
      .insert(instrumentoData as any)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao criar instrumento' },
      { status: 400 }
    )
  }
}







