// API para buscar disponibilidades
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

// GET - Lista disponibilidades (admin pode ver todas, filtrado por data se fornecido)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const data = searchParams.get('data')

    let query = supabase
      .from('disponibilidade')
      .select('*')
      .eq('status', 'disponivel') // Apenas disponíveis

    if (data) {
      query = query.eq('data', data)
    }

    const { data: disponibilidades, error } = await query.order('data', { ascending: true })

    if (error) throw error

    return NextResponse.json(disponibilidades || [])
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar disponibilidades' },
      { status: 401 }
    )
  }
}




