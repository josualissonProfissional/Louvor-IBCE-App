// Agente especializado em busca e informações de músicas
import { createServerClient } from '@/lib/supabase/server'

export interface MusicSearchResult {
  success: boolean
  response: string
  musicas?: Array<{
    id: string
    titulo: string
    link_youtube: any
    temLetras: boolean
    temCifras: boolean
    letras?: Array<{ id: string; texto: string }>
    cifras?: Array<{ id: string; texto: string; titulo?: string }>
  }>
}

/**
 * Agente de Músicas - Busca informações sobre músicas, cifras, letras e links
 */
export class MusicAgent {
  
  /**
   * Processa pergunta sobre músicas
   * @param mentionedMusic Música mencionada com @ (opcional)
   */
  async process(query: string, mentionedMusic?: string): Promise<MusicSearchResult> {
    const lowerQuery = query.toLowerCase()
    
    try {
      const supabase = createServerClient()
      
      // Se há música mencionada, busca apenas ela
      if (mentionedMusic) {
        return await this.searchMentionedMusic(mentionedMusic, supabase, lowerQuery)
      }
      
      // Identifica o tipo de busca
      if (this.isLinkQuery(lowerQuery)) {
        return await this.searchMusicLinks(lowerQuery, supabase)
      } else if (this.isListQuery(lowerQuery)) {
        return await this.listAllMusics(supabase)
      } else if (this.isCountQuery(lowerQuery)) {
        return await this.countMusics(supabase)
      } else if (this.isSpecificMusicQuery(lowerQuery)) {
        return await this.searchSpecificMusic(lowerQuery, supabase)
      } else {
        return await this.generalMusicSearch(lowerQuery, supabase)
      }
      
    } catch (error: any) {
      console.error('Erro no MusicAgent:', error)
      return {
        success: false,
        response: `❌ Erro ao buscar informações de músicas: ${error.message}`
      }
    }
  }

  /**
   * Busca música mencionada com @
   */
  private async searchMentionedMusic(
    mentionedMusic: string,
    supabase: any,
    query: string
  ): Promise<MusicSearchResult> {
    // Remove pontuação no final
    const cleanName = mentionedMusic.replace(/[?!.,;:]+$/, '').trim()
    
    // Normaliza para busca
    const normalizeForSearch = (text: string): string => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
    }
    
    const normalizedName = normalizeForSearch(cleanName)
    
    // Busca a música específica
    const { data: musicas, error } = await supabase
      .from('musicas')
      .select('id, titulo, link_youtube, letras(id, texto), cifras(id, texto, titulo)')
      .ilike('titulo', `%${normalizedName}%`)
      .limit(10)

    if (error) throw error

    if (!musicas || musicas.length === 0) {
      return {
        success: true,
        response: `## 🎵 Música Não Encontrada\n\nNão encontrei a música **"${cleanName}"** no banco de dados.\n\n**Sugestões:**\n- Verifique a ortografia\n- Tente usar apenas parte do nome\n- Use "liste todas as músicas" para ver o repertório completo`
      }
    }

    // Tenta encontrar match exato
    const exactMatch = musicas.find(m => 
      normalizeForSearch(m.titulo) === normalizedName
    )

    const musica = exactMatch || musicas[0]

    // Verifica o tipo de pergunta para formatar resposta adequada
    if (this.isCifraQuery(query)) {
      return await this.formatCifraResponse(musica)
    } else if (this.isLetraQuery(query)) {
      return await this.formatLetraResponse(musica)
    } else {
      return await this.formatDetailedMusicInfo([musica])
    }
  }

  /**
   * Verifica se é pergunta sobre cifra
   */
  private isCifraQuery(query: string): boolean {
    return /cifra|acorde/.test(query)
  }

  /**
   * Verifica se é pergunta sobre letra
   */
  private isLetraQuery(query: string): boolean {
    return /letra|verso|estrofe/.test(query)
  }

  /**
   * Formata resposta de cifra
   */
  private async formatCifraResponse(musica: any): Promise<MusicSearchResult> {
    const temCifras = musica.cifras && musica.cifras.length > 0

    let response = `## 🎸 Cifra: **${musica.titulo}**\n\n`

    if (temCifras) {
      response += `**Cifras disponíveis:** ${musica.cifras.length} versão(ões)\n\n`
      musica.cifras.forEach((cifra: any, idx: number) => {
        response += `**${cifra.titulo || `Versão ${idx + 1}`}:**\n`
        response += `\`\`\`\n${cifra.texto}\n\`\`\`\n\n`
      })
      response += `💡 **Dica:** Use o botão "▶️ Ver Música" para abrir o modal com transposição de acordes!`
    } else {
      response += `❌ Esta música não possui cifras cadastradas no banco de dados.`
    }

    return {
      success: true,
      response,
      musicas: [{
        id: musica.id,
        titulo: musica.titulo,
        link_youtube: musica.link_youtube,
        temLetras: musica.letras && musica.letras.length > 0,
        temCifras: temCifras,
        letras: musica.letras,
        cifras: musica.cifras
      }]
    }
  }

  /**
   * Formata resposta de letra
   */
  private async formatLetraResponse(musica: any): Promise<MusicSearchResult> {
    const temLetras = musica.letras && musica.letras.length > 0

    let response = `## 📝 Letra: **${musica.titulo}**\n\n`

    if (temLetras) {
      response += `**Letras disponíveis:** ${musica.letras.length} versão(ões)\n\n`
      musica.letras.forEach((letra: any, idx: number) => {
        response += `**Versão ${idx + 1}:**\n`
        response += `\`\`\`\n${letra.texto}\n\`\`\`\n\n`
      })
    } else {
      response += `❌ Esta música não possui letras cadastradas no banco de dados.`
    }

    return {
      success: true,
      response,
      musicas: [{
        id: musica.id,
        titulo: musica.titulo,
        link_youtube: musica.link_youtube,
        temLetras: temLetras,
        temCifras: musica.cifras && musica.cifras.length > 0,
        letras: musica.letras,
        cifras: musica.cifras
      }]
    }
  }

  /**
   * Verifica se é pergunta sobre link
   */
  private isLinkQuery(query: string): boolean {
    return /link|youtube|ouvir|escutar|video|vídeo/.test(query)
  }

  /**
   * Verifica se é pergunta de listagem
   */
  private isListQuery(query: string): boolean {
    return /(lista|mostre|quais) (as |todas )?música/.test(query) ||
           /todas as música/.test(query)
  }

  /**
   * Verifica se é pergunta de contagem
   */
  private isCountQuery(query: string): boolean {
    return /quantas? (música|cifra|letra)/.test(query)
  }

  /**
   * Verifica se menciona música específica
   */
  private isSpecificMusicQuery(query: string): boolean {
    return /música ["']([^"']+)["']/.test(query) ||
           /["']([^"']+)["']/.test(query)
  }

  /**
   * Busca links de músicas
   */
  private async searchMusicLinks(query: string, supabase: any): Promise<MusicSearchResult> {
    // Extrai nome da música se houver
    const musicNameMatch = query.match(/(?:música |musica )?["']?([^"'?]+)["']?/i)
    const searchTerm = musicNameMatch ? musicNameMatch[1].trim() : ''

    let musicQuery = supabase
      .from('musicas')
      .select('id, titulo, link_youtube')
      .order('titulo', { ascending: true })

    if (searchTerm && searchTerm.length > 2) {
      musicQuery = musicQuery.ilike('titulo', `%${searchTerm}%`)
    }

    const { data: musicas, error } = await musicQuery.limit(10)

    if (error) throw error

    if (!musicas || musicas.length === 0) {
      return {
        success: true,
        response: `## 🎵 Nenhuma Música Encontrada\n\nNão encontrei músicas${searchTerm ? ` com "${searchTerm}"` : ''} no banco de dados.\n\nTente:\n- Verificar a ortografia\n- Usar parte do nome\n- Perguntar "liste todas as músicas"`
      }
    }

    // Formata resposta
    let response = `## 🎵 ${musicas.length === 1 ? 'Música Encontrada' : `${musicas.length} Músicas Encontradas`}\n\n`

    musicas.forEach((musica, index) => {
      response += `### ${index + 1}. **${musica.titulo}**\n\n`
      
      // Parse do link_youtube (pode ser string ou array JSON)
      let links: Array<{ url: string; titulo?: string }> = []
      
      if (musica.link_youtube) {
        try {
          // Se for string, tenta parsear como JSON
          if (typeof musica.link_youtube === 'string') {
            const parsed = JSON.parse(musica.link_youtube)
            links = Array.isArray(parsed) ? parsed : [{ url: musica.link_youtube }]
          } else if (Array.isArray(musica.link_youtube)) {
            links = musica.link_youtube
          } else if (typeof musica.link_youtube === 'object') {
            links = [musica.link_youtube]
          }
        } catch {
          // Se não for JSON, é uma string simples
          links = [{ url: musica.link_youtube }]
        }
      }

      if (links.length > 0) {
        response += `**🎬 Links do YouTube:**\n`
        links.forEach((link, idx) => {
          response += `- ${link.titulo || `Link ${idx + 1}`}: \`${link.url}\`\n`
        })
      } else {
        response += `*Sem links do YouTube cadastrados*\n`
      }
      
      response += `\n📌 **ID da Música:** \`${musica.id}\`\n`
      response += `\n---\n\n`
    })

    response += `\n💡 **Dica:** Clique no botão "▶️ Ver Música" ao lado de cada resultado para abrir o modal completo com letra, cifra e player!`

    return {
      success: true,
      response,
      musicas: musicas.map(m => ({
        ...m,
        temLetras: false, // Será preenchido depois se necessário
        temCifras: false
      }))
    }
  }

  /**
   * Lista todas as músicas
   */
  private async listAllMusics(supabase: any): Promise<MusicSearchResult> {
    const { data: musicas, error } = await supabase
      .from('musicas')
      .select('id, titulo, link_youtube, letras(id), cifras(id)')
      .order('titulo', { ascending: true })

    if (error) throw error

    if (!musicas || musicas.length === 0) {
      return {
        success: true,
        response: `## 🎵 Nenhuma Música Cadastrada\n\nO banco de dados ainda não possui músicas cadastradas.`
      }
    }

    let response = `## 🎵 Todas as Músicas Cadastradas\n\n`
    response += `**Total:** ${musicas.length} música${musicas.length !== 1 ? 's' : ''}\n\n`
    response += `---\n\n`

    musicas.forEach((musica, index) => {
      const temLetras = musica.letras && musica.letras.length > 0
      const temCifras = musica.cifras && musica.cifras.length > 0
      const temLink = !!musica.link_youtube

      response += `**${index + 1}. ${musica.titulo}**\n`
      response += `- ${temLetras ? '✅' : '❌'} Letras (${musica.letras?.length || 0})\n`
      response += `- ${temCifras ? '✅' : '❌'} Cifras (${musica.cifras?.length || 0})\n`
      response += `- ${temLink ? '✅' : '❌'} Link YouTube\n`
      response += `\n`
    })

    response += `\n💡 **Dica:** Clique nos botões "▶️ Ver Música" para abrir o modal com a música completa!`

    return {
      success: true,
      response,
      musicas: musicas.map(m => ({
        id: m.id,
        titulo: m.titulo,
        link_youtube: m.link_youtube,
        temLetras: m.letras && m.letras.length > 0,
        temCifras: m.cifras && m.cifras.length > 0
      }))
    }
  }

  /**
   * Conta músicas
   */
  private async countMusics(supabase: any): Promise<MusicSearchResult> {
    const { data: musicas, error } = await supabase
      .from('musicas')
      .select('id, letras(id), cifras(id)')

    if (error) throw error

    const total = musicas?.length || 0
    const comLetras = musicas?.filter(m => m.letras && m.letras.length > 0).length || 0
    const comCifras = musicas?.filter(m => m.cifras && m.cifras.length > 0).length || 0

    let response = `## 📊 Estatísticas de Músicas\n\n`
    response += `**Total de Músicas:** ${total}\n\n`
    response += `### Detalhamento:\n`
    response += `- 📝 Com Letras: **${comLetras}** (${total > 0 ? Math.round((comLetras/total)*100) : 0}%)\n`
    response += `- 🎸 Com Cifras: **${comCifras}** (${total > 0 ? Math.round((comCifras/total)*100) : 0}%)\n`

    return {
      success: true,
      response
    }
  }

  /**
   * Busca música específica
   */
  private async searchSpecificMusic(query: string, supabase: any): Promise<MusicSearchResult> {
    // Extrai nome entre aspas ou após "música"
    const matches = query.match(/["']([^"']+)["']/) || query.match(/música (\w+[\w\s]*)/i)
    const searchTerm = matches ? matches[1].trim() : ''

    if (!searchTerm) {
      return await this.listAllMusics(supabase)
    }

    const { data: musicas, error } = await supabase
      .from('musicas')
      .select('id, titulo, link_youtube, letras(id, texto), cifras(id, texto, titulo)')
      .ilike('titulo', `%${searchTerm}%`)
      .limit(5)

    if (error) throw error

    if (!musicas || musicas.length === 0) {
      return {
        success: true,
        response: `## 🔍 Busca: "${searchTerm}"\n\n❌ Nenhuma música encontrada com esse nome.\n\n**Sugestões:**\n- Verifique a ortografia\n- Tente usar apenas parte do nome\n- Use "liste todas as músicas" para ver o repertório completo`
      }
    }

    return await this.formatDetailedMusicInfo(musicas)
  }

  /**
   * Busca geral de músicas
   */
  private async generalMusicSearch(query: string, supabase: any): Promise<MusicSearchResult> {
    // Remove palavras muito comuns que não ajudam na busca
    const stopWords = ['música', 'musica', 'sobre', 'qual', 'mostre', 'lista', 'de', 'da', 'do', 'para', 'com', 'sem']
    const words = query.toLowerCase().split(' ')
      .filter(w => w.length > 3 && !stopWords.includes(w))
    
    // Se não tem palavras úteis, lista todas
    if (words.length === 0) {
      return await this.listAllMusics(supabase)
    }

    const { data: musicas, error } = await supabase
      .from('musicas')
      .select('id, titulo, link_youtube, letras(texto), cifras(texto)')
      .order('titulo', { ascending: true })

    if (error) throw error

    // Busca por palavras-chave no título OU na letra
    const filtered = musicas?.filter(m => {
      const tituloMatch = words.some(word => 
        m.titulo.toLowerCase().includes(word)
      )
      
      const letraMatch = m.letras?.some((l: any) => 
        words.some(word => l.texto.toLowerCase().includes(word))
      ) || false
      
      return tituloMatch || letraMatch
    }) || []

    // Se filtrou demais (menos de 5 músicas) e a query não é muito específica, mostra todas
    if (filtered.length < 5 && filtered.length > 0) {
      return await this.formatDetailedMusicInfo(filtered)
    } else if (filtered.length === 0) {
      // Não encontrou nada, sugere listar todas
      return {
        success: true,
        response: `## 🔍 Busca: "${query}"\n\n❌ Não encontrei músicas com essas palavras-chave.\n\n**Dica:** Para ver todas as músicas, pergunte "liste todas as músicas"`
      }
    }

    return await this.formatDetailedMusicInfo(filtered)
  }

  /**
   * Formata informações detalhadas de músicas
   */
  private async formatDetailedMusicInfo(musicas: any[]): Promise<MusicSearchResult> {
    let response = `## 🎵 ${musicas.length === 1 ? 'Música Encontrada' : `${musicas.length} Músicas Encontradas`}\n\n`

    musicas.forEach((musica, index) => {
      const temLetras = musica.letras && musica.letras.length > 0
      const temCifras = musica.cifras && musica.cifras.length > 0

      response += `### ${index + 1}. **${musica.titulo}**\n\n`
      response += `**📋 Conteúdo Disponível:**\n`
      response += `- ${temLetras ? '✅' : '❌'} Letras: ${musica.letras?.length || 0} versão(ões)\n`
      response += `- ${temCifras ? '✅' : '❌'} Cifras: ${musica.cifras?.length || 0} versão(ões)\n`
      
      if (musica.link_youtube) {
        response += `- ✅ Link do YouTube disponível\n`
      }

      if (temCifras && musica.cifras) {
        response += `\n**🎸 Cifras:**\n`
        musica.cifras.forEach((cifra: any, idx: number) => {
          response += `  ${idx + 1}. ${cifra.titulo || `Versão ${idx + 1}`}\n`
        })
      }

      response += `\n`
    })

    response += `\n💡 **Dica:** Use os botões "▶️ Ver Música" para abrir letra, cifra e player!`

    return {
      success: true,
      response,
      musicas: musicas.map(m => ({
        id: m.id,
        titulo: m.titulo,
        link_youtube: m.link_youtube,
        temLetras: m.letras && m.letras.length > 0,
        temCifras: m.cifras && m.cifras.length > 0,
        letras: m.letras,
        cifras: m.cifras
      }))
    }
  }
}

export const musicAgent = new MusicAgent()
