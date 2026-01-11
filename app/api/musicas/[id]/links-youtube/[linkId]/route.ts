import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'

// PUT - Atualiza um link do YouTube
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; linkId: string } }
) {
  try {
    await requireAdmin()
    const supabase = createServerClient()
    const body = await request.json()

    const { url, titulo } = body

    // Busca a música atual
    const { data: musicaData, error: musicaError } = await supabase
      .from('musicas')
      .select('link_youtube')
      .eq('id', params.id)
      .single()

    if (musicaError) throw musicaError

    // Pega os links existentes
    const musicaDataTyped = musicaData as { link_youtube: any } | null
    const linksExistentes = Array.isArray(musicaDataTyped?.link_youtube) 
      ? musicaDataTyped.link_youtube 
      : []

    // Encontra e atualiza o link específico
    const linksAtualizados = linksExistentes.map((link: any) => {
      if (link.id === params.linkId || link.id === `legacy-${params.id}`) {
        return {
          ...link,
          url: url !== undefined ? url.trim() : link.url,
          titulo: titulo !== undefined ? (titulo?.trim() || null) : link.titulo,
          updated_at: new Date().toISOString(),
        }
      }
      return link
    })

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

    // Retorna o link atualizado
    const linkAtualizado = linksAtualizados.find((link: any) => 
      link.id === params.linkId || link.id === `legacy-${params.id}`
    )

    return NextResponse.json(linkAtualizado)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar link do YouTube' },
      { status: 400 }
    )
  }
}

// DELETE - Remove um link do YouTube
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; linkId: string } }
) {
  try {
    await requireAdmin()
    const supabase = createServerClient()

    // Busca a música atual
    const { data: musicaData, error: musicaError } = await supabase
      .from('musicas')
      .select('link_youtube')
      .eq('id', params.id)
      .single()

    if (musicaError) throw musicaError

    // Pega os links existentes e remove o link especificado
    const musicaDataTyped = musicaData as { link_youtube: any } | null
    const linksExistentes = Array.isArray(musicaDataTyped?.link_youtube) 
      ? musicaDataTyped.link_youtube 
      : []

    const linksAtualizados = linksExistentes.filter((link: any) => 
      link.id !== params.linkId && link.id !== `legacy-${params.id}`
    )

    // Atualiza o campo link_youtube na tabela musicas
    const { error } = await supabase
      .from('musicas')
      .update({ 
        link_youtube: linksAtualizados,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao remover link do YouTube' },
      { status: 400 }
    )
  }
}
