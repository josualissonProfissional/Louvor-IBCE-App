import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'

// GET - Busca todos os links do YouTube de uma música
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    
    // Busca links do campo link_youtube (JSONB) na tabela musicas
    const { data: musicaData, error: musicaError } = await supabase
      .from('musicas')
      .select('link_youtube')
      .eq('id', params.id)
      .single()

    if (musicaError) throw musicaError

    // link_youtube agora é um array JSONB
    const musicaDataTyped = musicaData as { link_youtube: any } | null
    const links = musicaDataTyped?.link_youtube || []
    
    // Converte para o formato esperado pelo frontend
    const linksFormatted = Array.isArray(links) ? links.map((link: any, index: number) => ({
      id: link.id || `link-${index}`,
      musica_id: params.id,
      url: link.url || link,
      titulo: link.titulo || null,
      created_at: link.created_at || new Date().toISOString(),
      updated_at: link.updated_at || new Date().toISOString(),
    })) : []

    return NextResponse.json(linksFormatted)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar links do YouTube' },
      { status: 400 }
    )
  }
}

// POST - Adiciona um novo link do YouTube a uma música
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const supabase = createServerClient()
    const body = await request.json()

    const { url, titulo } = body

    if (!url || !url.trim()) {
      return NextResponse.json(
        { error: 'URL do YouTube é obrigatória' },
        { status: 400 }
      )
    }

    // Busca a música atual
    const { data: musicaData, error: musicaError } = await supabase
      .from('musicas')
      .select('link_youtube')
      .eq('id', params.id)
      .single()

    if (musicaError) throw musicaError

    // Pega os links existentes (ou array vazio)
    const musicaDataTyped = musicaData as { link_youtube: any } | null
    const linksExistentes = Array.isArray(musicaDataTyped?.link_youtube) 
      ? musicaDataTyped.link_youtube 
      : []

    // Adiciona o novo link
    const novoLink = {
      id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: url.trim(),
      titulo: titulo?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const linksAtualizados = [...linksExistentes, novoLink]

    // Atualiza o campo link_youtube na tabela musicas
    const { data, error } = await supabase
      .from('musicas')
      .update({ 
        link_youtube: linksAtualizados,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(novoLink, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao adicionar link do YouTube' },
      { status: 400 }
    )
  }
}
