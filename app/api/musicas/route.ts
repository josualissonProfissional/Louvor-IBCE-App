// API para gerenciamento de músicas
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { NovaMusica, NovaCifra, NovaLetra, Musica } from '@/types'

// GET - Lista todas as músicas
export async function GET() {
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
      .order('titulo', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar músicas' },
      { status: 401 }
    )
  }
}

// POST - Cria nova música (apenas admin)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = createServerClient()
    const body = await request.json()

    const { titulo, link_youtube, cifras, letras } = body

    // Cria a música
    const musicaData: NovaMusica = {
      titulo,
      link_youtube: link_youtube || null,
    }

    const { data: musicaDataResult, error: musicaError } = await supabase
      .from('musicas')
      .insert(musicaData as any)
      .select()
      .single()

    if (musicaError) throw musicaError

    const musica = musicaDataResult as Musica

    // Adiciona cifras se fornecidas
    if (cifras && cifras.length > 0) {
      const cifrasData: NovaCifra[] = cifras.map((cifra: string | { titulo?: string | null; texto: string }) => {
        // Suporta tanto formato antigo (string) quanto novo (objeto com titulo e texto)
        if (typeof cifra === 'string') {
          return {
            musica_id: musica.id,
            texto: cifra,
            titulo: null,
          }
        } else {
          return {
            musica_id: musica.id,
            texto: cifra.texto,
            titulo: cifra.titulo || null,
          }
        }
      })

      await supabase.from('cifras').insert(cifrasData as any)
    }

    // Adiciona letras se fornecidas
    if (letras && letras.length > 0) {
      const letrasData: NovaLetra[] = letras.map((texto: string) => ({
        musica_id: musica.id,
        texto,
      }))

      await supabase.from('letras').insert(letrasData as any)
    }

    return NextResponse.json(musica, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao criar música' },
      { status: 400 }
    )
  }
}






