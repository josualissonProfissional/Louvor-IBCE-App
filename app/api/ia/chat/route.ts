// API Route para chat inteligente com sistema de agentes
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { deepseekService as aiService, MusicaContext } from '@/lib/deepseek'
import { classifyQuery, getQueryTypeDescription } from '@/lib/agents/classifier'
import { musicAgent } from '@/lib/agents/music-agent'
import { scheduleAgent } from '@/lib/agents/schedule-agent'
import { userAgent } from '@/lib/agents/user-agent'
import { historyAgent } from '@/lib/agents/history-agent'
import { generalAgent } from '@/lib/agents/general-agent'

export const runtime = 'nodejs'
export const maxDuration = 60 // 60 segundos timeout (máximo do Vercel Pro)

// POST - Enviar mensagem para o assistente
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Verifica autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { message, conversationHistory = [] } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mensagem inválida' },
        { status: 400 }
      )
    }

    // Classifica a pergunta
    const classification = classifyQuery(message)
    console.log('🔍 Classificação:', classification)

    let response: any
    let agentUsed: string
    let extraData: any = {}

    // Roteamento para o agente apropriado
    switch (classification.type) {
      case 'theological':
        agentUsed = 'Agente Teológico'
        // Se houver comando /teologia, usa a query limpa (sem o comando)
        const queryToProcess = classification.cleanedQuery || message
        response = await handleTheological(queryToProcess, conversationHistory, supabase, classification.mentionedMusic)
        break

      case 'music_search':
        agentUsed = 'Agente de Músicas'
        response = await musicAgent.process(message, classification.mentionedMusic)
        extraData.musicas = response.musicas
        break

      case 'schedule':
        agentUsed = 'Agente de Escalas'
        response = await scheduleAgent.process(message)
        extraData.escalas = response.escalas
        extraData.diasAtuacao = response.diasAtuacao
        break

      case 'user_info':
        agentUsed = 'Agente de Usuários'
        response = await userAgent.process(message)
        extraData.usuarios = response.usuarios
        break

      case 'history':
        agentUsed = 'Agente de História'
        response = await historyAgent.process(message)
        break

      case 'hybrid':
        agentUsed = 'Agente Híbrido'
        response = await handleHybrid(message, conversationHistory, classification, supabase, classification.mentionedMusic)
        break

      case 'general':
      default:
        agentUsed = 'Agente Geral'
        response = await generalAgent.process(message)
        break
    }

    return NextResponse.json({
      success: response.success !== false,
      response: response.response || response.content,
      agent: agentUsed,
      queryType: getQueryTypeDescription(classification.type),
      classification,
      model: response.model,
      usage: response.usage,
      isConfigured: aiService.isConfigured(),
      ...extraData
    })

  } catch (error: any) {
    console.error('Erro no chat:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * Normaliza string para busca (remove acentos, lowercase)
 */
function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Busca música específica por nome (fuzzy search melhorado)
 */
async function findMusicByName(supabase: any, musicName: string): Promise<MusicaContext | null> {
  if (!musicName || musicName.trim().length < 2) {
    return null
  }

  // Remove o @ se ainda estiver presente
  let cleanName = musicName.replace(/^@/, '').trim()
  
  // Remove pontuação no final (?, !, ., ,, ;, :)
  cleanName = cleanName.replace(/[?!.,;:]+$/, '').trim()
  
  if (cleanName.length < 2) {
    return null
  }
  
  console.log(`🔍 Buscando música: "${cleanName}"`)
  
  // Normaliza para busca (mantém números)
  const normalizedName = normalizeForSearch(cleanName)
  
  // Estratégia 1: Busca exata (com mais resultados)
  let { data: musicas, error } = await supabase
    .from('musicas')
    .select(`
      id,
      titulo,
      link_youtube,
      letras(texto),
      cifras(texto, titulo)
    `)
    .ilike('titulo', `%${normalizedName}%`)
    .limit(50) // Aumenta limite para melhor matching

  if (error) {
    console.error('Erro ao buscar música:', error)
    return null
  }

  if (!musicas || musicas.length === 0) {
    // Estratégia 2: Se não encontrou, tenta buscar por palavras individuais
    const searchWords = normalizedName.split(/\s+/).filter(w => w.length > 0)
    if (searchWords.length > 1) {
      // Busca por cada palavra separadamente e combina resultados
      const allResults: any[] = []
      
      for (const word of searchWords) {
        if (word.length >= 2) {
          const { data: musicasWord, error: errorWord } = await supabase
            .from('musicas')
            .select(`
              id,
              titulo,
              link_youtube,
              letras(texto),
              cifras(texto, titulo)
            `)
            .ilike('titulo', `%${word}%`)
            .limit(50)
          
          if (!errorWord && musicasWord) {
            // Adiciona apenas músicas que ainda não estão na lista
            musicasWord.forEach((m: any) => {
              if (!allResults.find(existing => existing.id === m.id)) {
                allResults.push(m)
              }
            })
          }
        }
      }
      
      if (allResults.length > 0) {
        musicas = allResults
        console.log(`🔍 Busca alternativa encontrou ${musicas.length} resultados`)
      }
    }
    
    if (!musicas || musicas.length === 0) {
      // Estratégia 3: Busca mais ampla - busca todas as músicas e filtra localmente
      // Útil para casos onde o nome pode ter variações
      console.log(`🔍 Tentando busca ampla para: "${cleanName}"`)
      const { data: todasMusicas, error: errorTodas } = await supabase
        .from('musicas')
        .select(`
          id,
          titulo,
          link_youtube,
          letras(texto),
          cifras(texto, titulo)
        `)
        .limit(200) // Limite maior para busca ampla
      
      if (!errorTodas && todasMusicas && todasMusicas.length > 0) {
        // Filtra localmente por similaridade
        const searchWords = normalizedName.split(/\s+/).filter(w => w.length > 0)
        const matches = todasMusicas.filter((m: any) => {
          const musicTitle = normalizeForSearch(m.titulo)
          // Verifica se contém todas as palavras ou pelo menos 70%
          if (searchWords.length > 0) {
            const matchingWords = searchWords.filter(word => musicTitle.includes(word))
            return matchingWords.length >= Math.ceil(searchWords.length * 0.7)
          }
          return musicTitle.includes(normalizedName)
        })
        
        if (matches.length > 0) {
          musicas = matches
          console.log(`🔍 Busca ampla encontrou ${musicas.length} resultados`)
        }
      }
    }
    
    if (!musicas || musicas.length === 0) {
      console.log(`❌ Nenhuma música encontrada para: "${cleanName}"`)
      return null
    }
  }

  // Tenta encontrar match exato primeiro (sem acentos)
  const exactMatch = musicas.find(m => 
    normalizeForSearch(m.titulo) === normalizedName
  )

  if (exactMatch) {
    console.log(`✅ Match exato encontrado: "${exactMatch.titulo}"`)
    return {
      id: exactMatch.id,
      titulo: exactMatch.titulo,
      letras: (exactMatch.letras as any[] || []).map((l: any) => l.texto),
      cifras: (exactMatch.cifras as any[] || []).map((c: any) => c.texto),
      link_youtube: exactMatch.link_youtube || undefined
    }
  }

  // Se não encontrou exato, tenta match que começa com o nome
  const startsWithMatch = musicas.find(m => 
    normalizeForSearch(m.titulo).startsWith(normalizedName)
  )

  if (startsWithMatch) {
    console.log(`✅ Match "starts with" encontrado: "${startsWithMatch.titulo}"`)
    return {
      id: startsWithMatch.id,
      titulo: startsWithMatch.titulo,
      letras: (startsWithMatch.letras as any[] || []).map((l: any) => l.texto),
      cifras: (startsWithMatch.cifras as any[] || []).map((c: any) => c.texto),
      link_youtube: startsWithMatch.link_youtube || undefined
    }
  }

  // Tenta match que contém todas as palavras do nome buscado
  const searchWords = normalizedName.split(/\s+/).filter(w => w.length > 0)
  if (searchWords.length > 1) {
    const containsAllWords = musicas.find(m => {
      const musicTitle = normalizeForSearch(m.titulo)
      return searchWords.every(word => musicTitle.includes(word))
    })
    
    if (containsAllWords) {
      console.log(`✅ Match "contém todas palavras" encontrado: "${containsAllWords.titulo}"`)
      return {
        id: containsAllWords.id,
        titulo: containsAllWords.titulo,
        letras: (containsAllWords.letras as any[] || []).map((l: any) => l.texto),
        cifras: (containsAllWords.cifras as any[] || []).map((c: any) => c.texto),
        link_youtube: containsAllWords.link_youtube || undefined
      }
    }
  }

  // Estratégia adicional: busca por similaridade (contém pelo menos 70% das palavras)
  if (searchWords.length > 1) {
    const bestMatch = musicas.find(m => {
      const musicTitle = normalizeForSearch(m.titulo)
      const matchingWords = searchWords.filter(word => musicTitle.includes(word))
      const matchPercentage = matchingWords.length / searchWords.length
      return matchPercentage >= 0.7 // Pelo menos 70% das palavras
    })
    
    if (bestMatch) {
      console.log(`✅ Match por similaridade encontrado: "${bestMatch.titulo}"`)
      return {
        id: bestMatch.id,
        titulo: bestMatch.titulo,
        letras: (bestMatch.letras as any[] || []).map((l: any) => l.texto),
        cifras: (bestMatch.cifras as any[] || []).map((c: any) => c.texto),
        link_youtube: bestMatch.link_youtube || undefined
      }
    }
  }

  // Retorna a primeira música encontrada (melhor match)
  if (musicas.length > 0) {
    console.log(`⚠️ Usando melhor match disponível: "${musicas[0].titulo}"`)
    const musica = musicas[0]
    return {
      id: musica.id,
      titulo: musica.titulo,
      letras: (musica.letras as any[] || []).map((l: any) => l.texto),
      cifras: (musica.cifras as any[] || []).map((c: any) => c.texto),
      link_youtube: musica.link_youtube || undefined
    }
  }

  return null
}

/**
 * Detecta se a pergunta é sobre músicas com base bíblica específica
 */
function isBibleBasedMusicQuery(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  
  // Verifica se menciona músicas/louvor E base bíblica
  const mentionsMusic = /(quais|quais são|mostre|liste|música|músicas|louvor|louvar)/i.test(lowerMessage)
  const mentionsBibleBase = /(com|tendo) (como )?base|baseado|baseada|sobre (em|no|na)|fundamento/i.test(lowerMessage)
  const mentionsBibleRef = /(gênesis|êxodo|levítico|números|deuteronômio|salmo|mateus|marcos|lucas|joão|atos|romanos|coríntios|gálatas|efésios|filipenses|colossenses|tessalonicenses|timóteo|tito|filemom|hebreus|tiago|pedro|judas|apocalipse|revelação|capítulo|capitulo|cap)/i.test(lowerMessage)
  
  // Padrão específico: "Quais músicas louvar tendo como base..."
  const specificPattern = /(quais|quais são).*música.*(com|tendo).*base/i.test(lowerMessage)
  
  return (mentionsMusic && mentionsBibleBase && mentionsBibleRef) || specificPattern
}

/**
 * Handler para análise teológica
 */
async function handleTheological(
  message: string,
  conversationHistory: any[],
  supabase: any,
  mentionedMusic?: string
): Promise<any> {
  let musicasContext: MusicaContext[] = []

  // Se há menção de música específica, busca apenas ela
  if (mentionedMusic) {
    const musica = await findMusicByName(supabase, mentionedMusic)
    if (musica) {
      musicasContext = [musica]
      console.log(`✅ Música encontrada: ${musica.titulo}`)
    } else {
      // Se não encontrou, retorna erro informativo
      console.log(`⚠️ Música "${mentionedMusic}" não encontrada`)
      return {
        success: false,
        content: `## ❌ Música Não Encontrada\n\nNão encontrei a música **"${mentionedMusic}"** no banco de dados.\n\n**Sugestões:**\n- Verifique a ortografia do nome\n- Tente usar apenas parte do nome\n- Use "liste todas as músicas" para ver o repertório completo\n\n💡 **Dica:** Use o formato \`@nome da música\` para mencionar músicas específicas.`
      }
    }
  } else if (isBibleBasedMusicQuery(message)) {
    // Se é pergunta sobre músicas com base bíblica, busca TODAS as músicas
    console.log('🔍 Detectada pergunta sobre músicas com base bíblica - buscando todas as músicas')
    const { data: musicas, error: musicasError } = await supabase
      .from('musicas')
      .select(`
        id,
        titulo,
        link_youtube,
        letras(texto),
        cifras(texto)
      `)
      .order('titulo', { ascending: true })
      // Sem limite para análise completa

    if (musicasError) {
      console.error('Erro ao buscar músicas:', musicasError)
      throw new Error('Erro ao buscar músicas do banco de dados')
    }

    // Formata contexto das músicas
    musicasContext = (musicas || []).map((m: any) => ({
      id: m.id,
      titulo: m.titulo,
      letras: (m.letras || []).map((l: any) => l.texto),
      cifras: (m.cifras || []).map((c: any) => c.texto),
      link_youtube: m.link_youtube || undefined
    }))
    
    console.log(`📚 Total de músicas para análise: ${musicasContext.length}`)
    if (musicasContext.length > 30) {
      console.log(`📦 Muitas músicas (${musicasContext.length}). A análise será processada em múltiplos lotes.`)
    }
  } else {
    // Busca todas as músicas com letras e cifras (limite de 5 para economia)
    const { data: musicas, error: musicasError } = await supabase
      .from('musicas')
      .select(`
        id,
        titulo,
        link_youtube,
        letras(texto),
        cifras(texto)
      `)
      .order('titulo', { ascending: true })
      .limit(5)

    if (musicasError) {
      console.error('Erro ao buscar músicas:', musicasError)
      throw new Error('Erro ao buscar músicas do banco de dados')
    }

    // Formata contexto das músicas
    musicasContext = (musicas || []).map((m: any) => ({
      id: m.id,
      titulo: m.titulo,
      letras: (m.letras || []).map((l: any) => l.texto),
      cifras: (m.cifras || []).map((c: any) => c.texto),
      link_youtube: m.link_youtube || undefined
    }))
  }

  // Chama serviço de IA teológica (DeepSeek)
  const isBibleQuery = isBibleBasedMusicQuery(message)
  const aiResponse = await aiService.analyzeTheological(
    message,
    musicasContext,
    conversationHistory,
    mentionedMusic ? musicasContext[0] : undefined, // Passa música específica se houver
    isBibleQuery // Indica que é busca por base bíblica
  )

  // Se é busca por base bíblica, tenta extrair músicas mencionadas na resposta
  if (isBibleQuery && musicasContext.length > 0) {
    // Extrai títulos de músicas mencionadas na resposta da IA
    const mentionedTitles: string[] = []
    const responseText = aiResponse.content
    
    // Normaliza função para comparação
    const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    
    musicasContext.forEach(musica => {
      const musicTitle = musica.titulo
      const normalizedTitle = normalize(musicTitle)
      const normalizedResponse = normalize(responseText)
      
      // Verifica se o título aparece na resposta (com variações de formatação markdown)
      const patterns = [
        new RegExp(`🎶\\s*\\*\\*${musicTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\*\\*`, 'i'),
        new RegExp(`###\\s*🎶\\s*${musicTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'),
        new RegExp(`\\*\\*${musicTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\*\\*`, 'i'),
        new RegExp(`"${musicTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'i'),
        new RegExp(normalizedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      ]
      
      const found = patterns.some(pattern => pattern.test(responseText) || normalizedResponse.includes(normalizedTitle))
      
      if (found) {
        mentionedTitles.push(musica.titulo)
      }
    })

    // Se não encontrou por título exato, tenta buscar por palavras-chave do título
    if (mentionedTitles.length === 0) {
      musicasContext.forEach(musica => {
        const titleWords = normalize(musica.titulo).split(/\s+/).filter(w => w.length > 3)
        if (titleWords.length > 0) {
          // Se pelo menos 50% das palavras do título aparecem na resposta, considera relevante
          const normalizedResponse = normalize(responseText)
          const matches = titleWords.filter(word => normalizedResponse.includes(word))
          if (matches.length >= Math.ceil(titleWords.length * 0.5)) {
            mentionedTitles.push(musica.titulo)
          }
        }
      })
    }

    // Filtra músicas mencionadas na resposta
    const relevantMusics = musicasContext.filter(m => 
      mentionedTitles.some(title => m.titulo === title)
    )

    // Adiciona músicas relevantes ao retorno
    if (relevantMusics.length > 0) {
      console.log(`✅ Encontradas ${relevantMusics.length} músicas relacionadas na resposta da IA`)
      return {
        ...aiResponse,
        musicas: relevantMusics.map(m => ({
          id: m.id,
          titulo: m.titulo,
          temLetras: m.letras.length > 0,
          temCifras: m.cifras && m.cifras.length > 0
        }))
      }
    }
  }

  return aiResponse
}

/**
 * Handler para consultas híbridas (combina múltiplos agentes)
 */
async function handleHybrid(
  message: string,
  conversationHistory: any[],
  classification: any,
  supabase: any,
  mentionedMusic?: string
): Promise<any> {
  let response = ''
  let combinedData: any = {}

  // Executa agentes necessários
  if (classification.requiresTheology) {
    const theologyResponse = await handleTheological(message, conversationHistory, supabase, mentionedMusic)
    response += theologyResponse.content + '\n\n'
    
    // Se é teológico sobre músicas, NÃO chama o agente de músicas
    // (o agente teológico já tem todas as músicas e faz a análise)
    if (classification.requiresMusic) {
      classification.requiresMusic = false // Evita duplicação
    }
  }

  // Só chama agente de músicas se NÃO for análise teológica
  if (classification.requiresMusic) {
    const musicResponse = await musicAgent.process(message)
    response += musicResponse.response + '\n\n'
    combinedData.musicas = musicResponse.musicas
  }

  if (classification.requiresSchedule) {
    const scheduleResponse = await scheduleAgent.process(message)
    response += scheduleResponse.response + '\n\n'
    combinedData.escalas = scheduleResponse.escalas
  }

  if (classification.requiresUser) {
    const userResponse = await userAgent.process(message)
    response += userResponse.response + '\n\n'
    combinedData.usuarios = userResponse.usuarios
  }

  return {
    success: true,
    response: response.trim() || 'Não consegui processar esta consulta híbrida.',
    ...combinedData
  }
}

// GET - Verifica status da API
export async function GET() {
  return NextResponse.json({
    status: 'online',
    aiProvider: 'DeepSeek',
    agents: [
      'Teológico',
      'Músicas',
      'Escalas',
      'Usuários',
      'Geral',
      'Híbrido'
    ],
    isConfigured: aiService.isConfigured(),
    message: aiService.isConfigured() 
      ? 'Sistema de agentes online e configurado (DeepSeek AI)'
      : 'Sistema de agentes online (IA teológica em modo fallback)'
  })
}
